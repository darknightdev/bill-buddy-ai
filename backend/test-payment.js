// Test script for the payment system
const BASE_URL = 'http://localhost:4000/api';

async function testPaymentSystem() {
  console.log('🧪 Testing Payment System...\n');

  try {
    // Test 1: Get all billers
    console.log('1. Testing biller list...');
    const billersResponse = await fetch(`${BASE_URL}/payment/billers`);
    const billers = await billersResponse.json();
    console.log('Available billers:', billers.billers.map(b => `${b.name} (${b.billerId})`));
    console.log('');

    // Test 2: Check capabilities for each biller
    console.log('2. Testing biller capabilities...');
    for (const biller of billers.billers) {
      const capabilitiesResponse = await fetch(`${BASE_URL}/payment/capabilities/${biller.billerId}`);
      const capabilities = await capabilitiesResponse.json();
      console.log(`${biller.name}:`);
      console.log(`  - Provider: ${capabilities.provider}`);
      console.log(`  - Supported methods: ${capabilities.supportedMethods.join(', ')}`);
      console.log(`  - Can process payment: ${capabilities.canProcessPayment}`);
      console.log('');
    }

    // Test 3: Test payment processing for a supported biller
    console.log('3. Testing payment processing...');
    const supportedBiller = billers.billers.find(b => b.provider !== 'none');
    if (supportedBiller) {
      console.log(`Testing payment with ${supportedBiller.name}...`);
      
      const paymentResponse = await fetch(`${BASE_URL}/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billerId: supportedBiller.billerId,
          amount: 150.00,
          currency: 'USD',
          accountId: 'TEST-ACCOUNT-123',
          paymentMethod: supportedBiller.supportedMethods[0],
          customerInfo: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        })
      });

      const paymentResult = await paymentResponse.json();
      if (paymentResponse.ok) {
        console.log('✅ Payment processed successfully!');
        console.log(`  - Transaction ID: ${paymentResult.transactionId}`);
        console.log(`  - Gateway: ${paymentResult.gateway}`);
        console.log(`  - Payment URL: ${paymentResult.paymentUrl}`);
      } else {
        console.log('❌ Payment failed:', paymentResult.message);
      }
    } else {
      console.log('No supported billers found for payment testing');
    }

    console.log('\n🎉 Payment system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPaymentSystem();
}

module.exports = { testPaymentSystem }; 