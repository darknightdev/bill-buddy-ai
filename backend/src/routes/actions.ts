import express from "express";
import { billerRegistry } from "../services/BillerRegistry";

const router = express.Router();

interface ActionRequest {
  actionType: string;
  billData: any;
  userRequest: string;
}

interface ActionResponse {
  message: string;
  nextSteps?: string[];
  success: boolean;
}

// POST /api/actions - Handle action requests from chat
router.post("/", async (req, res) => {
  try {
    const { actionType, billData, userRequest }: ActionRequest = req.body;

    console.log('Action request:', { actionType, userRequest });

    // Handle different action types
    switch (actionType) {
      case 'payment':
        return handlePaymentAction(req, res, billData, userRequest);
      
      case 'service_request':
        return handleServiceRequest(req, res, billData, userRequest);
      
      case 'billing_modification':
        return handleBillingModification(req, res, billData, userRequest);
      
      case 'contact_provider':
        return handleContactProvider(req, res, billData, userRequest);
      
      case 'file_claim':
        return handleFileClaim(req, res, billData, userRequest);
      
      default:
        return handleGeneralAction(req, res, billData, userRequest);
    }

  } catch (error) {
    console.error('Action processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process action request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function handlePaymentAction(req: express.Request, res: express.Response, billData: any, userRequest: string) {
  try {
    const billerId = billData?.annotated?.raw?.billerId;
    const amount = billData?.annotated?.raw?.totalOwed;
    const accountId = billData?.annotated?.raw?.accountId;

    if (!billerId || !amount || !accountId) {
      return res.json({
        success: false,
        message: 'Unable to process payment - missing bill information',
        nextSteps: ['Please ensure your bill has been properly processed']
      });
    }

    // Check if biller supports payments
    const biller = billerRegistry.lookupBiller(billerId);
    if (!biller) {
      return res.json({
        success: false,
        message: 'This biller is not supported for online payments',
        nextSteps: ['Contact the biller directly to make your payment']
      });
    }

    if (biller.provider === 'none') {
      return res.json({
        success: false,
        message: 'This biller does not support online payments',
        nextSteps: ['Contact the biller directly to make your payment']
      });
    }

    // For Paymentus billers, we'll let the frontend handle the token generation
    if (biller.provider === 'paymentus') {
      return res.json({
        success: true,
        message: `I can help you pay your ${biller.name} bill of $${amount}. Let me set up the payment for you.`,
        nextSteps: ['Complete Payment', 'Cancel Payment'],
        paymentInfo: {
          billerId,
          billerName: biller.name,
          amount,
          accountId,
          provider: 'paymentus'
        }
      });
    }

    // For other providers
    return res.json({
      success: true,
      message: `I can help you pay your ${biller.name} bill of $${amount}. Let me set up the payment for you.`,
      nextSteps: ['Complete Payment', 'Cancel Payment'],
      paymentInfo: {
        billerId,
        billerName: biller.name,
        amount,
        accountId,
        provider: biller.provider
      }
    });

  } catch (error) {
    console.error('Payment action error:', error);
    res.json({
      success: false,
      message: 'Failed to process payment request',
      nextSteps: ['Try again', 'Contact support']
    });
  }
}

async function handleServiceRequest(req: express.Request, res: express.Response, billData: any, userRequest: string) {
  const billerName = billData?.annotated?.raw?.billerName || 'your service provider';
  
  res.json({
    success: true,
    message: `I can help you with your service request for ${billerName}. What specific service do you need?`,
    nextSteps: [
      'Schedule a service appointment',
      'Report an outage',
      'Request maintenance',
      'Contact customer service'
    ]
  });
}

async function handleBillingModification(req: express.Request, res: express.Response, billData: any, userRequest: string) {
  const billerName = billData?.annotated?.raw?.billerName || 'your service provider';
  
  res.json({
    success: true,
    message: `I can help you modify your billing for ${billerName}. What changes would you like to make?`,
    nextSteps: [
      'Change billing address',
      'Update payment method',
      'Modify service plan',
      'Request billing adjustment'
    ]
  });
}

async function handleContactProvider(req: express.Request, res: express.Response, billData: any, userRequest: string) {
  const billerName = billData?.annotated?.raw?.billerName || 'your service provider';
  
  res.json({
    success: true,
    message: `I can help you contact ${billerName}. How would you like to reach them?`,
    nextSteps: [
      'Call customer service',
      'Send email',
      'Live chat',
      'Visit local office'
    ]
  });
}

async function handleFileClaim(req: express.Request, res: express.Response, billData: any, userRequest: string) {
  const billerName = billData?.annotated?.raw?.billerName || 'your service provider';
  
  res.json({
    success: true,
    message: `I can help you file a claim with ${billerName}. What type of claim do you need to file?`,
    nextSteps: [
      'File insurance claim',
      'Dispute a charge',
      'Request refund',
      'Report billing error'
    ]
  });
}

async function handleGeneralAction(req: express.Request, res: express.Response, billData: any, userRequest: string) {
  res.json({
    success: true,
    message: `I understand you want to ${userRequest.toLowerCase()}. How can I help you with that?`,
    nextSteps: [
      'Get more information',
      'Contact support',
      'View account details',
      'Make a payment'
    ]
  });
}

export default router; 