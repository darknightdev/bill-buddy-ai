import { Router } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";

const upload = multer();
const router = Router();

// POST /api/ingest - Handle both file uploads and direct text input
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let text = "";

    // Check if we have a file upload
    if (req.file) {
      const buffer = req.file.buffer;
      
      try {
        const data = await pdf(buffer);
        text = data.text;
      } catch (e) {
        const { data: { text: ocrText } } = await Tesseract.recognize(buffer, "eng");
        text = ocrText;
      }
    } 
    // Check if we have direct text input
    else if (req.body.text) {
      text = req.body.text;
    } 
    else {
      return res.status(400).json({ error: "No file or text provided" });
    }

    text = text.replace(/\r\n/g, "\n").trim();
    return res.json({ text });
  } catch (err) {
    console.error("Ingest error:", err);
    res.status(500).json({ error: "Ingestion failed" });
  }
});

export default router; 