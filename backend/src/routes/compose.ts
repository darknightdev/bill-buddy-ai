import { Router } from "express";
import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";

const router = Router();

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
    "-y", // Overwrite output file
    outputPath
  ];
  
  await runFFmpeg(args);
  
  // Clean up text file
  await fs.remove(textFilePath);
  
  return `/videos/${videoFileName}`;
}

// POST /api/compose
router.post("/", async (req, res) => {
  const { snippets } = req.body;
  if (!snippets || !Array.isArray(snippets)) {
    return res.status(400).json({ error: "Missing snippets array" });
  }

  try {
    const videos = [];
    
    for (const snippet of snippets) {
      try {
        const videoUrl = await composeVideo(snippet);
        videos.push(videoUrl);
      } catch (err) {
        console.error(`Error composing video for ${snippet.snippetId}:`, err);
        // Continue with other videos even if one fails
      }
    }
    
    res.json({ videos });
  } catch (err) {
    console.error("Video composition error:", err);
    res.status(500).json({ error: "Video composition failed" });
  }
});

export default router; 