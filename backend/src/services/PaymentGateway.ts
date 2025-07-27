import { BillerConfig } from './BillerRegistry';

export interface PaymentRequest {
  amount: number;
  currency: string;
  accountId: string;
  billerId: string;
  paymentMethod: 'ACH' | 'CARD' | 'BANK_TRANSFER';
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  transactionId: string;
  paymentUrl?: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  gateway: string;
  metadata?: Record<string, any>;
}

export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  amount?: number;
  currency?: string;
  gateway: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// Generic Payment Gateway Interface
export interface PaymentGateway {
  /** Initialize the gateway with configuration */
  init(config: Record<string, any>): void;

  /** Create a payment; returns transaction details */
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /** Query payment status */
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;

  /** Validate if a biller/account combination is supported */
  validateBiller(billerConfig: BillerConfig, accountId: string): Promise<boolean>;

  /** Get supported payment methods */
  getSupportedMethods(): ('ACH' | 'CARD' | 'BANK_TRANSFER')[];

  /** Handle incoming webhooks (optional) */
  handleWebhook?(body: any, signature?: string): Promise<void>;

  /** Get gateway name */
  getGatewayName(): string;
}

// Enhanced Paymentus Gateway
export class PaymentusGateway implements PaymentGateway {
  private apiKey: string = '';
  private baseUrl: string = '';
  private billerCode: string = '';

  init(config: { apiKey: string; billerCode: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.billerCode = config.billerCode;
    this.baseUrl = config.baseUrl || 'https://api.paymentus.com/v1';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Mock Paymentus API call - replace with real implementation
    console.log(`Paymentus: Creating payment for ${request.amount} ${request.currency}`);
    console.log(`Biller Code: ${this.billerCode}, Account: ${request.accountId}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response - in real implementation, this would call Paymentus API
    const transactionId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      transactionId,
      paymentUrl: `${this.baseUrl}/checkout/${transactionId}`,
      status: 'pending',
      message: 'Payment initiated successfully',
      gateway: 'paymentus',
      metadata: {
        billerCode: this.billerCode,
        accountId: request.accountId
      }
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    // Mock status check - replace with real Paymentus API call
    console.log(`Paymentus: Checking status for ${transactionId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      transactionId,
      status: 'pending', // or 'completed', 'failed'
      amount: 0,
      currency: 'USD',
      gateway: 'paymentus',
      updatedAt: new Date().toISOString(),
      metadata: {
        billerCode: this.billerCode
      }
    };
  }

  async validateBiller(billerConfig: BillerConfig, accountId: string): Promise<boolean> {
    // Mock validation - replace with real Paymentus API call
    console.log(`Paymentus: Validating biller ${billerConfig.billerId} for account ${accountId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return billerConfig.provider === 'paymentus' && 
           billerConfig.providerCredentials?.billerCode === this.billerCode;
  }

  getSupportedMethods(): ('ACH' | 'CARD' | 'BANK_TRANSFER')[] {
    return ['ACH', 'CARD', 'BANK_TRANSFER'];
  }

  async handleWebhook(body: any, signature?: string): Promise<void> {
    // Verify webhook signature and process payment status updates
    console.log('Paymentus webhook received:', body);
    
    // In real implementation:
    // 1. Verify signature
    // 2. Update payment status in database
    // 3. Send notifications if needed
  }

  getGatewayName(): string {
    return 'paymentus';
  }
}

// Enhanced Stripe Gateway
export class StripeGateway implements PaymentGateway {
  private apiKey: string = '';
  private stripeAccount: string = '';
  private baseUrl: string = '';

  init(config: { apiKey: string; stripeAccount: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.stripeAccount = config.stripeAccount;
    this.baseUrl = config.baseUrl || 'https://api.stripe.com/v1';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Mock Stripe API call - replace with real implementation
    console.log(`Stripe: Creating payment for ${request.amount} ${request.currency}`);
    console.log(`Stripe Account: ${this.stripeAccount}, Account: ${request.accountId}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const transactionId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      transactionId,
      paymentUrl: `https://checkout.stripe.com/pay/${transactionId}`,
      status: 'pending',
      message: 'Payment session created',
      gateway: 'stripe',
      metadata: {
        stripeAccount: this.stripeAccount,
        accountId: request.accountId
      }
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    console.log(`Stripe: Checking status for ${transactionId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      transactionId,
      status: 'pending',
      amount: 0,
      currency: 'USD',
      gateway: 'stripe',
      updatedAt: new Date().toISOString(),
      metadata: {
        stripeAccount: this.stripeAccount
      }
    };
  }

  async validateBiller(billerConfig: BillerConfig, accountId: string): Promise<boolean> {
    console.log(`Stripe: Validating biller ${billerConfig.billerId} for account ${accountId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return billerConfig.provider === 'stripe' && 
           billerConfig.providerCredentials?.stripeAccount === this.stripeAccount;
  }

  getSupportedMethods(): ('ACH' | 'CARD' | 'BANK_TRANSFER')[] {
    return ['CARD', 'BANK_TRANSFER'];
  }

  async handleWebhook(body: any, signature?: string): Promise<void> {
    console.log('Stripe webhook received:', body);
    
    // In real implementation:
    // 1. Verify webhook signature
    // 2. Update payment status in database
    // 3. Send notifications if needed
  }

  getGatewayName(): string {
    return 'stripe';
  }
}

// No Payment Gateway (for unsupported billers)
export class NoPaymentGateway implements PaymentGateway {
  init(config: Record<string, any>): void {
    // No initialization needed
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    throw new Error(`Payment not supported for biller: ${request.billerId}`);
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    throw new Error('Payment not supported');
  }

  async validateBiller(billerConfig: BillerConfig, accountId: string): Promise<boolean> {
    return false;
  }

  getSupportedMethods(): ('ACH' | 'CARD' | 'BANK_TRANSFER')[] {
    return [];
  }

  getGatewayName(): string {
    return 'none';
  }
}

// Enhanced Gateway Factory with better configuration
export class GatewayFactory {
  private static gateways = new Map<string, PaymentGateway>();

  static createGateway(billerConfig: BillerConfig): PaymentGateway {
    const gatewayKey = `${billerConfig.provider}_${billerConfig.billerId}`;
    
    // Return cached gateway if exists
    if (this.gateways.has(gatewayKey)) {
      return this.gateways.get(gatewayKey)!;
    }

    let gateway: PaymentGateway;

    switch (billerConfig.provider) {
      case 'paymentus':
        if (!billerConfig.providerCredentials?.apiKey || !billerConfig.providerCredentials?.billerCode) {
          throw new Error('Missing Paymentus credentials');
        }
        gateway = new PaymentusGateway();
        gateway.init({
          apiKey: billerConfig.providerCredentials.apiKey,
          billerCode: billerConfig.providerCredentials.billerCode,
          baseUrl: process.env.PAYMENTUS_BASE_URL
        });
        break;
      
      case 'stripe':
        if (!billerConfig.providerCredentials?.stripeAccount) {
          throw new Error('Missing Stripe credentials');
        }
        gateway = new StripeGateway();
        gateway.init({
          apiKey: process.env.STRIPE_SECRET_KEY || 'mock_stripe_key',
          stripeAccount: billerConfig.providerCredentials.stripeAccount,
          baseUrl: process.env.STRIPE_BASE_URL
        });
        break;
      
      case 'none':
        gateway = new NoPaymentGateway();
        gateway.init({});
        break;
      
      default:
        throw new Error(`Unsupported payment provider: ${billerConfig.provider}`);
    }

    // Cache the gateway instance
    this.gateways.set(gatewayKey, gateway);
    return gateway;
  }

  static clearCache(): void {
    this.gateways.clear();
  }

  static getCachedGateways(): string[] {
    return Array.from(this.gateways.keys());
  }
} 