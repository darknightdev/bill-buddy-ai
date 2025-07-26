import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ask
router.post("/", async (req, res) => {
  const { question, annotated } = req.body;
  
  if (!question || !annotated) {
    return res.status(400).json({ error: "Missing question or annotated data" });
  }

  try {
    // Create a context from the annotated bill data
    const billContext = `
      Bill Information:
      - Due Date: ${annotated.annotated?.dueDate || 'Not specified'}
      - Total Amount: $${annotated.annotated?.totalOwed || 'Not specified'}
      - Account ID: ${annotated.annotated?.accountId || 'Not specified'}
      ${annotated.annotated?.lineItems ? `- Line Items: ${JSON.stringify(annotated.annotated.lineItems)}` : ''}
      
      Extracted Fields: ${JSON.stringify(annotated.fields || [], null, 2)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful bill assistant. You have access to the following bill information. 
          Answer questions about the bill clearly and concisely. If you don't have enough information, 
          say so politely. Be helpful and professional.
          
          ${billContext}`
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const answer = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your question.";

    res.json({ 
      answer,
      question,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Q&A error:", err);
    res.status(500).json({ error: "Failed to process question" });
  }
});

export default router; 