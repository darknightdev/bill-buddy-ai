import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Enhanced bill analysis with external context
interface BillContext {
  billType: string;
  serviceProvider: string;
  historicalData?: any[];
  externalData?: any;
  userPreferences?: any;
}

// Enhanced Q&A system with advanced reasoning
router.post("/", async (req, res) => {
  const { question, annotated, billContext } = req.body;
  
  if (!question || !annotated) {
    return res.status(400).json({ error: "Missing question or annotated data" });
  }

  try {
    // Enhanced context building with external data
    const enhancedContext = await buildEnhancedContext(annotated, billContext);
    
    // Determine question type and provide specialized responses
    const questionType = classifyQuestion(question);
    const response = await generateSpecializedResponse(question, enhancedContext, questionType);

    res.json({ 
      answer: response.answer,
      question,
      questionType,
      confidence: response.confidence,
      suggestedActions: response.suggestedActions,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Enhanced Q&A error:", err);
    res.status(500).json({ error: "Failed to process question" });
  }
});

// Build enhanced context with external data
async function buildEnhancedContext(annotated: any, billContext?: BillContext) {
  const baseContext = `
    Bill Information:
    - Due Date: ${annotated.annotated?.dueDate || 'Not specified'}
    - Total Amount: $${annotated.annotated?.totalOwed || 'Not specified'}
    - Account ID: ${annotated.annotated?.accountId || 'Not specified'}
    - Bill Type: ${billContext?.billType || 'Unknown'}
    - Service Provider: ${billContext?.serviceProvider || 'Unknown'}
    ${annotated.annotated?.lineItems ? `- Line Items: ${JSON.stringify(annotated.annotated.lineItems)}` : ''}
    
    Extracted Fields: ${JSON.stringify(annotated.fields || [], null, 2)}
  `;

  // Add external data based on bill type
  let externalContext = "";
  if (billContext?.billType === "investment" || billContext?.billType === "statement") {
    externalContext = await getMarketData();
  } else if (billContext?.billType === "utility") {
    externalContext = await getUtilityData();
  }

  return {
    baseContext,
    externalContext,
    billContext
  };
}

// Classify question type for specialized handling
function classifyQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes("due date") || lowerQuestion.includes("when")) {
    return "due_date";
  } else if (lowerQuestion.includes("pay") || lowerQuestion.includes("payment")) {
    return "payment";
  } else if (lowerQuestion.includes("owe") || lowerQuestion.includes("amount") || lowerQuestion.includes("total")) {
    return "amount";
  } else if (lowerQuestion.includes("higher") || lowerQuestion.includes("increase") || lowerQuestion.includes("more")) {
    return "comparison";
  } else if (lowerQuestion.includes("drop") || lowerQuestion.includes("decrease") || lowerQuestion.includes("loss")) {
    return "performance";
  } else if (lowerQuestion.includes("service") || lowerQuestion.includes("restore") || lowerQuestion.includes("outage")) {
    return "service";
  } else if (lowerQuestion.includes("change") || lowerQuestion.includes("update") || lowerQuestion.includes("modify")) {
    return "modification";
  } else {
    return "general";
  }
}

// Generate specialized responses based on question type
async function generateSpecializedResponse(question: string, context: any, questionType: string) {
  const systemPrompt = buildSystemPrompt(context, questionType);
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: question
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  const answer = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your question.";
  
  // Extract suggested actions from the response
  const suggestedActions = extractSuggestedActions(answer, questionType);
  
  return {
    answer,
    confidence: calculateConfidence(questionType, context),
    suggestedActions
  };
}

// Build specialized system prompts
function buildSystemPrompt(context: any, questionType: string): string {
  const basePrompt = `You are an intelligent bill assistant with access to comprehensive bill information and external data. 
  Provide helpful, accurate, and actionable responses. Always be professional and empathetic.
  
  ${context.baseContext}
  ${context.externalContext ? `External Context: ${context.externalContext}` : ''}
  `;

  switch (questionType) {
    case "due_date":
      return basePrompt + `
        For due date questions:
        - Provide the exact due date
        - Mention any late fees or grace periods
        - Suggest payment reminders
        - Offer payment scheduling options
      `;
    
    case "payment":
      return basePrompt + `
        For payment questions:
        - Explain all available payment methods
        - Provide step-by-step payment instructions
        - Mention any payment processing fees
        - Offer payment scheduling and automation
        - Include security best practices
      `;
    
    case "amount":
      return basePrompt + `
        For amount questions:
        - Break down the total amount by line items
        - Explain any taxes, fees, or surcharges
        - Provide payment plan options if available
        - Suggest cost-saving opportunities
      `;
    
    case "comparison":
      return basePrompt + `
        For comparison questions:
        - Compare with previous billing periods
        - Identify specific changes in charges
        - Explain seasonal variations if applicable
        - Provide external factors that may have influenced changes
        - Suggest ways to reduce future bills
      `;
    
    case "performance":
      return basePrompt + `
        For performance questions:
        - Analyze performance trends
        - Provide market context and external factors
        - Explain any fees or charges that affected performance
        - Suggest portfolio adjustments if applicable
        - Provide historical performance data
      `;
    
    case "service":
      return basePrompt + `
        For service questions:
        - Check current service status
        - Provide outage information if applicable
        - Offer troubleshooting steps
        - Provide contact information for service issues
        - Suggest preventive measures
      `;
    
    case "modification":
      return basePrompt + `
        For modification requests:
        - Explain the modification process
        - Provide required information and documentation
        - Offer alternative solutions
        - Include contact information for changes
        - Explain any fees associated with changes
      `;
    
    default:
      return basePrompt + `
        For general questions:
        - Provide comprehensive and helpful answers
        - Suggest relevant actions the user can take
        - Offer to connect with customer service if needed
        - Provide additional resources or information
      `;
  }
}

// Extract suggested actions from AI response
function extractSuggestedActions(answer: string, questionType: string): string[] {
  const actions: string[] = [];
  
  // Add type-specific actions
  switch (questionType) {
    case "payment":
      actions.push("Pay Bill Now", "Schedule Payment", "Set Up Auto-Pay", "View Payment History");
      break;
    case "service":
      actions.push("Report Issue", "Check Service Status", "Contact Support", "Schedule Service");
      break;
    case "modification":
      actions.push("Update Information", "Request Change", "Contact Billing", "Download Forms");
      break;
    case "comparison":
      actions.push("View Detailed Breakdown", "Compare Bills", "Set Up Alerts", "Optimize Usage");
      break;
  }
  
  // Add general actions
  actions.push("Download Bill", "Contact Support", "View Account Details");
  
  return actions;
}

// Calculate confidence score
function calculateConfidence(questionType: string, context: any): number {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence based on available data
  if (context.billContext?.billType) confidence += 0.1;
  if (context.externalContext) confidence += 0.1;
  if (context.baseContext.includes("Not specified") === false) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

// Mock external data functions (to be replaced with real APIs)
async function getMarketData(): Promise<string> {
  return `
    Market Context:
    - S&P 500 Performance: -2.3% this month
    - Inflation Rate: 3.2% year-over-year
    - Federal Reserve Rate: 5.25%
    - Market Volatility: High due to economic uncertainty
  `;
}

async function getUtilityData(): Promise<string> {
  return `
    Utility Context:
    - Seasonal Usage Patterns: 15% higher than average
    - Rate Changes: 2.1% increase effective last month
    - Weather Impact: Unusually hot summer affecting usage
    - Conservation Tips: Available for reducing consumption
  `;
}

export default router; 