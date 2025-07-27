import { Router } from "express";
import { billerRegistry } from "../services/BillerRegistry";
import { GatewayFactory, PaymentRequest } from "../services/PaymentGateway";
import { paymentusAuthService } from "../services/PaymentusAuth";

const router = Router();

// GET /api/payment/capabilities/:billerId - Check payment capabilities for a biller
router.get("/capabilities/:billerId", async (req, res) => {
  try {
    const { billerId } = req.params;
    const { accountId } = req.query;

    const biller = billerRegistry.lookupBiller(billerId);
    
    if (!biller) {
      return res.status(404).json({ 
        error: "Biller not found",
        message: "This biller is not registered in our system"
      });
    }

    // If accountId is provided, validate the biller supports this account
    let isValidAccount = true;
    if (accountId && biller.provider !== 'none') {
      try {
        const gateway = GatewayFactory.createGateway(biller);
        isValidAccount = await gateway.validateBiller(biller, accountId as string);
      } catch (error) {
        console.error('Account validation error:', error);
        isValidAccount = false;
      }
    }

    const capabilities = {
      billerId: biller.billerId,
      billerName: biller.name,
      provider: biller.provider,
      supportedMethods: biller.supportedMethods,
      isActive: biller.isActive,
      isValidAccount,
      canProcessPayment: biller.provider !== 'none' && isValidAccount
    };

    res.json(capabilities);
  } catch (error) {
    console.error('Payment capabilities error:', error);
    res.status(500).json({ error: "Failed to check payment capabilities" });
  }
});

// POST /api/payment/process - Process a payment
router.post("/process", async (req, res) => {
  try {
    const { 
      billerId, 
      amount, 
      currency = 'USD', 
      accountId, 
      paymentMethod,
      customerInfo 
    } = req.body;

    // Validate required fields
    if (!billerId || !amount || !accountId || !paymentMethod) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ['billerId', 'amount', 'accountId', 'paymentMethod']
      });
    }

    // Lookup biller
    const biller = billerRegistry.lookupBiller(billerId);
    if (!biller) {
      return res.status(404).json({ 
        error: "Biller not found",
        message: "This biller is not registered in our system"
      });
    }

    // Check if biller supports payment
    if (biller.provider === 'none') {
      return res.status(400).json({ 
        error: "Payment not supported",
        message: "This biller does not support online payments. Please contact them directly."
      });
    }

    // Validate payment method is supported
    if (!biller.supportedMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        error: "Payment method not supported",
        message: `This biller only supports: ${biller.supportedMethods.join(', ')}`,
        supportedMethods: biller.supportedMethods
      });
    }

    // Create payment request
    const paymentRequest: PaymentRequest = {
      amount: parseFloat(amount),
      currency,
      accountId,
      billerId,
      paymentMethod,
      customerInfo
    };

    // Create gateway and process payment
    const gateway = GatewayFactory.createGateway(biller);
    
    // Validate account with the gateway
    const isValidAccount = await gateway.validateBiller(biller, accountId);
    if (!isValidAccount) {
      return res.status(400).json({ 
        error: "Invalid account",
        message: "The provided account ID is not valid for this biller"
      });
    }

    // Process the payment
    const paymentResponse = await gateway.createPayment(paymentRequest);

    res.json({
      success: true,
      transactionId: paymentResponse.transactionId,
      paymentUrl: paymentResponse.paymentUrl,
      status: paymentResponse.status,
      message: paymentResponse.message,
      gateway: paymentResponse.gateway,
      billerName: biller.name
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      error: "Payment processing failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/payment/billers - List all available billers
router.get("/billers", async (req, res) => {
  try {
    const { search } = req.query;
    
    let billers;
    if (search && typeof search === 'string') {
      billers = billerRegistry.searchBillers(search);
    } else {
      billers = billerRegistry.getAllBillers();
    }

    res.json({
      billers: billers.map(biller => ({
        billerId: biller.billerId,
        name: biller.name,
        provider: biller.provider,
        supportedMethods: biller.supportedMethods,
        isActive: biller.isActive
      }))
    });
  } catch (error) {
    console.error('Biller list error:', error);
    res.status(500).json({ error: "Failed to retrieve billers" });
  }
});

// GET /api/payment/status/:transactionId - Check payment status
router.get("/status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // In a real implementation, you'd look up the gateway from the transaction
    // For now, we'll use a mock approach
    const mockStatus = {
      transactionId,
      status: 'pending', // or 'completed', 'failed'
      amount: 0,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gateway: 'unknown'
    };

    res.json(mockStatus);
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

// POST /api/payment/token/paymentus - Generate Paymentus token for User Checkout Pixel
router.post("/token/paymentus", async (req, res) => {
  try {
    const { userLogin, accountNumber, billerId } = req.body;

    // Validate required fields
    if (!userLogin || !accountNumber || !billerId) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ['userLogin', 'accountNumber', 'billerId']
      });
    }

    // Lookup biller
    const biller = billerRegistry.lookupBiller(billerId);
    if (!biller) {
      return res.status(404).json({ 
        error: "Biller not found",
        message: "This biller is not registered in our system"
      });
    }

    // Check if biller supports Paymentus
    if (biller.provider !== 'paymentus') {
      return res.status(400).json({ 
        error: "Provider not supported",
        message: "This biller does not use Paymentus for payments"
      });
    }

    // Generate Paymentus token
    const authResponse = await paymentusAuthService.generateToken({
      userLogin,
      accountNumber,
      billerConfig: biller
    });

    res.json({
      success: true,
      token: authResponse.token,
      expiresAt: authResponse.expiresAt,
      billerName: biller.name,
      billerId: biller.billerId
    });

  } catch (error) {
    console.error('Paymentus token generation error:', error);
    res.status(500).json({ 
      error: "Failed to generate Paymentus token",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/payment/webhook/:gateway - Handle payment webhooks
router.post("/webhook/:gateway", async (req, res) => {
  try {
    const { gateway } = req.params;
    const signature = req.headers['x-signature'] as string;
    
    console.log(`Webhook received from ${gateway}:`, req.body);
    
    // In a real implementation, you'd:
    // 1. Look up the transaction from the webhook data
    // 2. Get the appropriate gateway instance
    // 3. Call handleWebhook on the gateway
    // 4. Update your database with the new status
    
    // For now, just acknowledge the webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router; 