import { Router } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import OpenAI from "openai";
import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const upload = multer();
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to run FFmpeg command
async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);
    
    ffmpeg.stdout.on("data", (data) => {
      console.log(`FFmpeg stdout: ${data}`);
    });
    
    ffmpeg.stderr.on("data", (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });
    
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
    
    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}

// Compose video for a single snippet
async function composeVideo(snippet: any): Promise<string> {
  const videoFileName = `${snippet.snippetId}.mp4`;
  const outputPath = path.join(__dirname, "../../public/videos", videoFileName);
  const audioPath = path.join(__dirname, "../../public/media", `${snippet.snippetId}.mp3`);
  
  // Create a text file for the overlay text
  const textFileName = `${snippet.snippetId}_text.txt`;
  const textFilePath = path.join(__dirname, "../../public/media", textFileName);
  await fs.writeFile(textFilePath, snippet.text);
  
  // Create video with solid color background and text overlay
  const args = [
    "-f", "lavfi",
    "-i", "color=c=0xf8fafc:size=1280x720:duration=5",
    "-i", audioPath,
    "-vf", `drawtext=textfile='${textFilePath}':fontcolor=black:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=white@0.8:boxborderw=5`,
    "-c:v", "libx264",
    "-c:a", "aac",
    "-shortest",
    "-y",
    outputPath
  ];
  
  await runFFmpeg(args);
  
  // Clean up text file
  await fs.remove(textFilePath);
  
  return `/videos/${videoFileName}`;
}

// POST /api/avp (Audio-Video Pipeline)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Step 1: Ingest - Extract text from file
    const buffer = req.file.buffer;
    let text = "";

    try {
      // Try to parse as PDF first
      const data = await pdf(buffer);
      text = data.text;
    } catch (pdfError) {
      console.log("PDF parsing failed, trying OCR...");
      
      // If PDF parsing fails, check if it's a PDF and convert to image
      const fileExtension = req.file.originalname?.toLowerCase().split('.').pop();
      
            if (fileExtension === 'pdf') {
        // For PDF files, try OCR directly on the buffer
        // Tesseract can sometimes handle PDFs directly, especially if they contain images
        try {
          const { data: { text: ocrText } } = await Tesseract.recognize(buffer, "eng");
          text = ocrText;
        } catch (ocrError) {
          console.error("OCR failed on PDF:", ocrError);
          // If OCR fails on PDF, provide a helpful error message
          throw new Error("This PDF appears to be image-based and couldn't be processed. Please try uploading a searchable PDF or an image file instead.");
        }
      } else {
        // For non-PDF files, try OCR directly
        try {
          const { data: { text: ocrText } } = await Tesseract.recognize(buffer, "eng");
          text = ocrText;
        } catch (ocrError) {
          console.error("OCR failed:", ocrError);
          throw new Error("Failed to extract text from file");
        }
      }
    }

    text = text.replace(/\r\n/g, "\n").trim();

    // Step 2: Annotate - Extract and tag fields
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "annotateFields",
          parameters: {
            type: "object",
            properties: {
              dueDate: { type: "string" },
              totalOwed: { type: "number" },
              accountId: { type: "string" },
              lineItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    amount: { type: "number" }
                  },
                  required: ["description", "amount"]
                }
              }
            },
            required: ["dueDate", "totalOwed"]
          }
        }
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Extract bill fields and tag with type, group, security, status." },
        { role: "user", content: text }
      ],
      tools
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    let fields: any[] = [];
    if (toolCall && toolCall.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      fields = [
        {
          fieldId: "dueDate",
          value: args.dueDate,
          type: "date",
          group: "billing",
          security: "public",
          status: "extracted"
        },
        {
          fieldId: "totalOwed",
          value: args.totalOwed,
          type: "amount",
          group: "billing",
          security: "public",
          status: "extracted"
        },
        ...(args.accountId ? [{
          fieldId: "accountId",
          value: args.accountId,
          type: "id",
          group: "account",
          security: "private",
          status: "extracted"
        }] : []),
        ...(Array.isArray(args.lineItems) ? args.lineItems.map((item: any, i: number) => ({
          fieldId: `lineItem_${i}`,
          value: item,
          type: "lineItem",
          group: "billing",
          security: "public",
          status: "extracted"
        })) : [])
      ];
    }

    const annotated = { fields, raw: toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {} };

    // Step 3: Generate snippets (TTS + text overlays)
    const snippets = [];
    for (const field of fields) {
      const { fieldId, value, type } = field;
      
      let ttsText = "";
      let displayText = "";
      
      switch (fieldId) {
        case "dueDate":
          ttsText = `Your due date is ${value}`;
          displayText = `Due Date: ${value}`;
          break;
        case "totalOwed":
          ttsText = `Your total amount due is $${value}`;
          displayText = `Amount Due: $${value}`;
          break;
        case "accountId":
          ttsText = `Your account number is ${value}`;
          displayText = `Account: ${value}`;
          break;
        default:
          if (type === "lineItem") {
            ttsText = `${value.description} costs $${value.amount}`;
            displayText = `${value.description}: $${value.amount}`;
          } else {
            ttsText = `The ${fieldId} is ${value}`;
            displayText = `${fieldId}: ${value}`;
          }
      }

      const audio = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: ttsText,
      });

      const mp3FileName = `${fieldId}.mp3`;
      const mp3Path = path.join(__dirname, "../../public/media", mp3FileName);
      await fs.writeFile(mp3Path, Buffer.from(await audio.arrayBuffer()));

      snippets.push({
        snippetId: fieldId,
        mp3Url: `/media/${mp3FileName}`,
        text: displayText,
        ttsText: ttsText
      });
    }

    // Step 4: Compose videos
    const videos = [];
    for (const snippet of snippets) {
      try {
        const videoUrl = await composeVideo(snippet);
        videos.push(videoUrl);
      } catch (err) {
        console.error(`Error composing video for ${snippet.snippetId}:`, err);
      }
    }

    // Return complete pipeline result
    res.json({
      text,
      annotated,
      snippets,
      videos
    });

  } catch (err) {
    console.error("AVP pipeline error:", err);
    res.status(500).json({ error: "AVP pipeline failed" });
  }
});

export default router; 