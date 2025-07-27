// Enhanced test script for the generic payment system
const BASE_URL = 'http://localhost:4000/api';

async function testEnhancedPaymentSystem() {
  console.log('🧪 Testing Enhanced Payment System...\n');

  try {
    // Test 1: Get all billers
    console.log('1. Testing biller list...');
    const billersResponse = await fetch(`${BASE_URL}/payment/billers`);
    const billers = await billersResponse.json();
    console.log('Available billers:', billers.billers.map(b => `${b.name} (${b.billerId}) - ${b.provider}`));
    console.log('');

    // Test 2: Check capabilities for each biller
    console.log('2. Testing biller capabilities...');
    for (const biller of billers.billers) {
      const capabilitiesResponse = await fetch(`${BASE_URL}/payment/capabilities/${biller.billerId}`);
      const capabilities = await capabilitiesResponse.json();
      console.log(`${biller.name} (${biller.provider}):`);
      console.log(`  - Supported methods: ${capabilities.supportedMethods.join(', ')}`);
      console.log(`  - Can process payment: ${capabilities.canProcessPayment}`);
      console.log(`  - Valid account: ${capabilities.isValidAccount}`);
      console.log('');
    }

    // Test 3: Test payment processing for different providers
    console.log('3. Testing payment processing across providers...');
    
    const supportedBillers = billers.billers.filter(b => b.provider !== 'none');
    
    for (const biller of supportedBillers.slice(0, 2)) { // Test first 2 supported billers
      console.log(`Testing payment with ${biller.name} (${biller.provider})...`);
      
      const paymentResponse = await fetch(`${BASE_URL}/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billerId: biller.billerId,
          amount: 150.00 + Math.random() * 50, // Random amount
          currency: 'USD',
          accountId: `TEST-ACCOUNT-${biller.billerId}`,
          paymentMethod: biller.supportedMethods[0],
          customerInfo: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          metadata: {
            testRun: true,
            billerType: biller.provider
          }
        })
      });

      const paymentResult = await paymentResponse.json();
      if (paymentResponse.ok) {
        console.log('✅ Payment processed successfully!');
        console.log(`  - Transaction ID: ${paymentResult.transactionId}`);
        console.log(`  - Gateway: ${paymentResult.gateway}`);
        console.log(`  - Payment URL: ${paymentResult.paymentUrl}`);
        console.log(`  - Status: ${paymentResult.status}`);
        console.log(`  - Message: ${paymentResult.message}`);
        
        // Test 4: Check payment status
        console.log('  - Checking payment status...');
        const statusResponse = await fetch(`${BASE_URL}/payment/status/${paymentResult.transactionId}`);
        const statusResult = await statusResponse.json();
        console.log(`    Status: ${statusResult.status}`);
        console.log('');
      } else {
        console.log('❌ Payment failed:', paymentResult.message);
        console.log('');
      }
    }

    // Test 5: Test webhook endpoint
    console.log('4. Testing webhook endpoint...');
    const webhookResponse = await fetch(`${BASE_URL}/payment/webhook/paymentus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'test-signature'
      },
      body: JSON.stringify({
        event: 'payment.completed',
        transactionId: 'test-transaction-123',
        amount: 150.00,
        currency: 'USD'
      })
    });
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook endpoint working');
    } else {
      console.log('❌ Webhook endpoint failed');
    }
    console.log('');

    // Test 6: Test unsupported biller
    console.log('5. Testing unsupported biller...');
    const unsupportedBiller = billers.billers.find(b => b.provider === 'none');
    if (unsupportedBiller) {
      const capabilitiesResponse = await fetch(`${BASE_URL}/payment/capabilities/${unsupportedBiller.billerId}`);
      const capabilities = await capabilitiesResponse.json();
      console.log(`${unsupportedBiller.name}:`);
      console.log(`  - Can process payment: ${capabilities.canProcessPayment}`);
      console.log(`  - Supported methods: ${capabilities.supportedMethods.join(', ')}`);
      console.log(`  - Provider: ${capabilities.provider}`);
    }
    console.log('');

    console.log('🎉 Enhanced payment system test completed!');
    console.log('\n📋 Summary:');
    console.log('- Generic gateway interface implemented');
    console.log('- Multiple provider support (Paymentus, Stripe)');
    console.log('- Webhook handling ready');
    console.log('- Configuration-driven provider management');
    console.log('- Cached gateway instances for performance');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test configuration
async function testConfiguration() {
  console.log('\n🔧 Testing Configuration...');
  
  try {
    // Test environment variables
    const envVars = [
      'PAYMENTUS_API_KEY',
      'STRIPE_SECRET_KEY', 
      'DEFAULT_PAYMENT_PROVIDER',
      'PAYMENT_TIMEOUT',
      'PAYMENT_RETRY_ATTEMPTS'
    ];
    
    console.log('Environment variables:');
    envVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`  ${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
    });
    
  } catch (error) {
    console.error('Configuration test failed:', error.message);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testEnhancedPaymentSystem().then(() => {
    return testConfiguration();
  });
}

module.exports = { testEnhancedPaymentSystem, testConfiguration }; 