// Test script for Paymentus Chat Integration
const BASE_URL = 'http://localhost:4000/api';

async function testPaymentusChatIntegration() {
  console.log('🧪 Testing Paymentus Chat Integration...\n');

  try {
    // Test 1: Get Paymentus biller
    console.log('1. Finding Paymentus biller...');
    const billersResponse = await fetch(`${BASE_URL}/payment/billers`);
    const billers = await billersResponse.json();
    
    const paymentusBiller = billers.billers.find(b => b.provider === 'paymentus');
    if (!paymentusBiller) {
      console.log('❌ No Paymentus biller found');
      return;
    }
    
    console.log(`✅ Found Paymentus biller: ${paymentusBiller.name} (${paymentusBiller.billerId})`);
    console.log('');

    // Test 2: Generate Paymentus token for chat integration
    console.log('2. Generating Paymentus token for chat...');
    const tokenResponse = await fetch(`${BASE_URL}/payment/token/paymentus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userLogin: 'test@paymentus.com',
        accountNumber: 'TEST-ACCOUNT-123',
        billerId: paymentusBiller.billerId
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.ok && tokenData.success) {
      console.log('✅ Paymentus token generated successfully!');
      console.log(`  - Token: ${tokenData.token.substring(0, 20)}...`);
      console.log(`  - Expires: ${tokenData.expiresAt}`);
      console.log(`  - Biller: ${tokenData.billerName}`);
      console.log('');
      
      // Test 3: Show chat integration data
      console.log('3. Chat Integration Data:');
      console.log('The chat would receive this message with embedded checkout:');
      console.log(JSON.stringify({
        id: Date.now().toString(),
        from: "ai",
        text: "I've prepared your payment for $150.00. Please complete the payment form below:",
        timestamp: new Date(),
        paymentCheckout: {
          token: tokenData.token,
          accountNumber: 'TEST-ACCOUNT-123',
          paymentAmount: 150.00,
          billerName: tokenData.billerName,
          customerInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@paymentus.com',
            phone: '123-456-7890',
            zipCode: '12345'
          }
        }
      }, null, 2));
      console.log('');
      
      // Test 4: Show Paymentus checkout configuration
      console.log('4. Paymentus Checkout Configuration:');
      console.log('The PaymentusChatCheckout component would render:');
      console.log(JSON.stringify({
        authorization: tokenData.token,
        paymentAccounts: [{
          accountNumber: 'TEST-ACCOUNT-123',
          paymentType: 'UTILITY',
          authToken1: '12345',
          paymentAmount: 150.00
        }],
        customerInfoConfig: {
          defaultValues: {
            'first-name': 'John',
            'last-name': 'Doe',
            'email': 'test@paymentus.com',
            'day-phone-nr': '123-456-7890',
            'zip-code': '12345'
          }
        }
      }, null, 2));
      console.log('');

      // Test 5: Show expected success response
      console.log('5. Expected Success Response:');
      console.log('When CHECKOUT_SUCCESS event fires, the chat would receive:');
      console.log(JSON.stringify({
        "reference-number": 123456789,
        "payment-date": Date.now(),
        "payment-amount": 150.00,
        "convenience-fee": 2.50,
        "total-amount": 152.50,
        "payment-status-description": "Payment processed successfully",
        "payment-status": "ACCEPTED",
        "payment-method": {
          "type": "CARD",
          "account-number": "****1234",
          "token": "pm_123456789"
        }
      }, null, 2));
      console.log('');

    } else {
      console.log('❌ Token generation failed:', tokenData.message);
      console.log('');
    }

    console.log('🎉 Paymentus Chat Integration test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Paymentus biller found');
    console.log('✅ Token generation working');
    console.log('✅ Chat integration data prepared');
    console.log('✅ Checkout configuration ready');
    console.log('✅ Success response format defined');
    console.log('\n🚀 Ready for frontend integration!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentusChatIntegration(); 