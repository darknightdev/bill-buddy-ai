import { Router } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import fs from "fs-extra";
import path from "path";


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