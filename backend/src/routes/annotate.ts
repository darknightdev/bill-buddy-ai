import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/annotate
router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
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

    console.log("OpenAI Response:", JSON.stringify(completion, null, 2));

    // Parse tool call result (OpenAI SDK >=4.x)
    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    console.log("Tool Call:", toolCall);
    
    let fields: any[] = [];
    if (toolCall && toolCall.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      console.log("Parsed Args:", args);
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

    res.json({ fields, annotated: toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Annotation failed" });
  }
});

export default router; 