import { Router } from "express";
import OpenAI from "openai";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/snippet
router.post("/", async (req, res) => {
  const { annotated } = req.body;
  if (!annotated || !annotated.fields) {
    return res.status(400).json({ error: "Missing annotated fields" });
  }

  try {
    const snippets = [];

    for (const field of annotated.fields) {
      const { fieldId, value, type } = field;
      
      // Generate TTS text based on field type
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

      // Generate TTS audio
      const audio = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: ttsText,
      });

      // Save audio file
      const mp3FileName = `${fieldId}.mp3`;
      const mp3Path = path.join(__dirname, "../../public/media", mp3FileName);
      await fs.writeFile(mp3Path, Buffer.from(await audio.arrayBuffer()));

      // Create snippet object
      snippets.push({
        snippetId: fieldId,
        mp3Url: `/media/${mp3FileName}`,
        text: displayText,
        ttsText: ttsText
      });
    }

    res.json({ snippets });
  } catch (err) {
    console.error("Snippet generation error:", err);
    res.status(500).json({ error: "Snippet generation failed" });
  }
});

export default router; 