# Enhanced Payment System Implementation

This document describes the generic, multi-step payment system with biller payment capability detection and provider-agnostic architecture.

## Overview

The payment system follows a **generic adapter pattern** where the system:
1. Extracts biller information from bills
2. Maintains a registry of biller payment capabilities
3. Routes payments to appropriate gateways through a unified interface
4. Supports multiple payment providers (Paymentus, Stripe, Adyen, Square)
5. Provides webhook handling and status tracking
6. Uses configuration-driven provider management

## Architecture

### 1. Biller Registry (`backend/src/services/BillerRegistry.ts`)

The biller registry maintains a mapping of biller IDs to their payment capabilities:

```typescript
interface BillerConfig {
  billerId: string;
  name: string;
  provider: 'paymentus' | 'stripe' | 'none';
  providerCredentials?: {
    apiKey?: string;
    billerCode?: string;
    stripeAccount?: string;
  };
  supportedMethods: ('ACH' | 'CARD' | 'BANK_TRANSFER')[];
  isActive: boolean;
}
```

**Default Billers:**
- `UTIL123` - Acme Water Co. (Paymentus)
- `INS456` - Best Health Insurance (Stripe)
- `GOV789` - City Tax Department (No payment support)
- `ELEC001` - Power Grid Electric (Paymentus)
- `GAS002` - Natural Gas Co. (Stripe)

### 2. Generic Payment Gateway Interface (`backend/src/services/PaymentGateway.ts`)

The system uses a unified `PaymentGateway` interface that abstracts provider-specific implementations:

```typescript
interface PaymentGateway {
  init(config: Record<string, any>): void;
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
  validateBiller(billerConfig: BillerConfig, accountId: string): Promise<boolean>;
  getSupportedMethods(): ('ACH' | 'CARD' | 'BANK_TRANSFER')[];
  handleWebhook?(body: any, signature?: string): Promise<void>;
  getGatewayName(): string;
}
```

**Available Implementations:**
- **PaymentusGateway**: Handles utility and government payments
- **StripeGateway**: Handles insurance and service payments  
- **NoPaymentGateway**: For unsupported billers
- **AdyenGateway**: Ready for future implementation
- **SquareGateway**: Ready for future implementation

### 3. Payment Configuration (`backend/src/config/payment.ts`)

Configuration-driven provider management:

```typescript
export const paymentConfig: PaymentConfig = {
  defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'paymentus',
  providers: {
    paymentus: { enabled: true, credentials: { apiKey: '...' } },
    stripe: { enabled: true, credentials: { secretKey: '...' } },
    adyen: { enabled: false, credentials: { apiKey: '...' } },
    square: { enabled: false, credentials: { accessToken: '...' } }
  }
};
```

### 4. Payment Routes (`backend/src/routes/payment.ts`)

API endpoints for payment operations:

- `GET /api/payment/capabilities/:billerId` - Check payment capabilities
- `POST /api/payment/process` - Process a payment
- `GET /api/payment/billers` - List available billers
- `GET /api/payment/status/:transactionId` - Check payment status
- `POST /api/payment/webhook/:gateway` - Handle payment webhooks

## Frontend Integration

### PaymentFlow Component (`frontend/src/components/PaymentFlow.tsx`)

A multi-step modal component that:

1. **Checking**: Validates biller capabilities
2. **Capabilities**: Shows available payment methods
3. **Payment**: Confirms payment details
4. **Processing**: Shows payment processing status
5. **Complete**: Shows success with payment URL
6. **Error**: Shows error messages

### Updated PayButton Component

The existing PayButton now integrates with the PaymentFlow component and requires:
- `billerId`: Extracted from bill annotation
- `billerName`: Extracted from bill annotation
- `accountId`: Extracted from bill annotation
- `amount`: Total amount owed

## API Usage Examples

### 1. Check Biller Capabilities

```bash
curl "http://localhost:4000/api/payment/capabilities/UTIL123?accountId=12345"
```

Response:
```json
{
  "billerId": "UTIL123",
  "billerName": "Acme Water Co.",
  "provider": "paymentus",
  "supportedMethods": ["ACH", "CARD"],
  "isActive": true,
  "isValidAccount": true,
  "canProcessPayment": true
}
```

### 2. Process Payment

```bash
curl -X POST "http://localhost:4000/api/payment/process" \
  -H "Content-Type: application/json" \
  -d '{
    "billerId": "UTIL123",
    "amount": 150.00,
    "currency": "USD",
    "accountId": "12345",
    "paymentMethod": "CARD",
    "customerInfo": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

Response:
```json
{
  "success": true,
  "transactionId": "pay_1234567890_abc123",
  "paymentUrl": "https://paymentus.com/pay/pay_1234567890_abc123",
  "status": "pending",
  "message": "Payment initiated successfully",
  "gateway": "paymentus",
  "billerName": "Acme Water Co."
}
```

### 3. List All Billers

```bash
curl "http://localhost:4000/api/payment/billers"
```

## Testing

### Paymentus Integration Test

Run the Paymentus flow test to verify the real integration:

```bash
cd backend
node test-paymentus-flow.js
```

This will test:
- Real Paymentus Auth SDK integration
- Token generation with actual credentials
- Biller capability detection
- Frontend integration data preparation

### Enhanced Payment System Test

Run the enhanced test script to verify the complete payment system:

```bash
cd backend
node test-enhanced-payment.js
```

This will test:
- Multiple payment providers
- Webhook endpoints
- Configuration validation
- Gateway caching
- Error handling

## Environment Variables

Add these to your `.env` file for production:

```env
# Payment Provider Configuration
DEFAULT_PAYMENT_PROVIDER=paymentus
PAYMENT_TIMEOUT=30000
PAYMENT_RETRY_ATTEMPTS=3
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

# Paymentus Configuration
PAYMENTUS_ENABLED=true
PAYMENTUS_API_KEY=your_paymentus_api_key
PAYMENTUS_PRE_SHARED_KEY=your_paymentus_pre_shared_key
PAYMENTUS_TLA=your_paymentus_tla
PAYMENTUS_BASE_URL=https://secure1.paymentus.com
PAYMENTUS_WEBHOOK_SECRET=your_paymentus_webhook_secret

# Stripe Configuration
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Adyen Configuration (for future use)
ADYEN_ENABLED=false
ADYEN_API_KEY=your_adyen_api_key
ADYEN_MERCHANT_ACCOUNT=your_merchant_account
ADYEN_WEBHOOK_SECRET=your_adyen_webhook_secret

# Square Configuration (for future use)
SQUARE_ENABLED=false
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_WEBHOOK_SECRET=your_square_webhook_secret
```

## Integration with Bill Processing

The payment system integrates with the existing bill processing pipeline:

1. **Ingest**: PDF/text processing
2. **Annotate**: Extracts `billerId`, `billerName`, `accountId`, `totalOwed`
3. **Payment**: Uses extracted data to determine payment capabilities

### Updated Annotation

The annotation step now extracts biller information:

```typescript
// Additional fields extracted
billerId: string;    // Unique biller identifier
billerName: string;  // Full biller name
```

## Key Benefits of Generic Architecture

1. **Provider Agnostic**: Switch between Paymentus, Stripe, Adyen, Square via configuration
2. **Pluggable**: Add new payment providers without changing core payment logic
3. **Testable**: Mock gateway interface for unit testing
4. **Scalable**: Cached gateway instances for performance
5. **Maintainable**: Unified interface reduces code duplication
6. **Future-Proof**: Easy to add new providers and features

## Future Enhancements

1. **Database Integration**: Replace in-memory registry with database
2. **Payment Status Tracking**: Implement webhook handling for payment status updates
3. **Recurring Payments**: Support for automatic recurring payments
4. **Payment History**: Track and display payment history
5. **Multi-Currency**: Support for different currencies
6. **Fraud Detection**: Implement fraud detection and prevention
7. **Adyen Integration**: Add Adyen gateway implementation
8. **Square Integration**: Add Square gateway implementation
9. **Payment Analytics**: Track payment success rates and performance metrics
10. **Real-time Payment Updates**: WebSocket integration for live payment status

## Security Considerations

1. **API Key Management**: Store sensitive credentials securely
2. **Input Validation**: Validate all payment inputs
3. **Account Verification**: Verify account ownership before processing payments
4. **Rate Limiting**: Implement rate limiting on payment endpoints
5. **Audit Logging**: Log all payment attempts and results

## Error Handling

The system handles various error scenarios:

- **Biller Not Found**: Returns 404 with helpful message
- **Payment Not Supported**: Returns 400 with alternative contact info
- **Invalid Account**: Returns 400 with validation error
- **Gateway Errors**: Returns 500 with error details
- **Network Errors**: Returns 500 with retry guidance 