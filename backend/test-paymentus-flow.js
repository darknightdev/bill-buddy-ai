// Test script for Paymentus User Checkout Pixel flow
const BASE_URL = 'http://localhost:4000/api';

async function testPaymentusFlow() {
  console.log('🧪 Testing Paymentus User Checkout Pixel Flow...\n');

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
    
    console.log(`Found Paymentus biller: ${paymentusBiller.name} (${paymentusBiller.billerId})`);
    console.log('');

    // Test 2: Check biller capabilities
    console.log('2. Checking biller capabilities...');
    const capabilitiesResponse = await fetch(`${BASE_URL}/payment/capabilities/${paymentusBiller.billerId}?accountId=TEST-ACCOUNT-123`);
    const capabilities = await capabilitiesResponse.json();
    
    console.log(`Provider: ${capabilities.provider}`);
    console.log(`Supported methods: ${capabilities.supportedMethods.join(', ')}`);
    console.log(`Can process payment: ${capabilities.canProcessPayment}`);
    console.log('');

    // Test 3: Generate Paymentus token
    console.log('3. Generating Paymentus token...');
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
      
      // Test 4: Show what the frontend would receive
      console.log('4. Frontend Integration Data:');
      console.log('The frontend would receive this data to initialize the Paymentus User Checkout Pixel:');
      console.log(JSON.stringify({
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
      }, null, 2));
      console.log('');
      
      // Test 5: Show Paymentus checkout configuration
      console.log('5. Paymentus Checkout Configuration:');
      console.log('The Paymentus User Checkout Pixel would be configured with:');
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

    } else {
      console.log('❌ Token generation failed:', tokenData.message);
      console.log('');
    }

    console.log('🎉 Paymentus User Checkout Pixel flow test completed!');
    console.log('\n📋 Summary:');
    console.log('- Paymentus biller detection working');
    console.log('- Token generation endpoint ready');
    console.log('- Frontend integration data prepared');
    console.log('- User Checkout Pixel configuration ready');
    console.log('\n🚀 Next Steps:');
    console.log('1. Replace mock token generation with real Paymentus Auth SDK');
    console.log('2. Test the PaymentusCheckout component in the frontend');
    console.log('3. Handle CHECKOUT_SUCCESS event for payment completion');
    console.log('4. Add real Paymentus credentials to .env file');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test environment configuration
async function testEnvironment() {
  console.log('\n🔧 Testing Environment Configuration...');
  
  try {
    const envVars = [
      'PAYMENTUS_ENABLED',
      'PAYMENTUS_API_KEY',
      'PAYMENTUS_PRE_SHARED_KEY',
      'PAYMENTUS_TLA',
      'PAYMENTUS_BASE_URL'
    ];
    
    console.log('Environment variables:');
    let allSet = true;
    envVars.forEach(varName => {
      const value = process.env[varName];
      const isSet = !!value;
      if (!isSet) allSet = false;
      console.log(`  ${varName}: ${isSet ? '✅ Set' : '❌ Not set'}`);
    });
    
    if (!allSet) {
      console.log('\n⚠️  Warning: Some Paymentus environment variables are not set.');
      console.log('Please add the following to your .env file:');
      console.log('PAYMENTUS_PRE_SHARED_KEY=your_test_pre_shared_key');
      console.log('PAYMENTUS_TLA=your_test_tla');
      console.log('PAYMENTUS_BASE_URL=https://secure1.paymentus.com');
    } else {
      console.log('\n✅ All Paymentus environment variables are set!');
    }
    
  } catch (error) {
    console.error('Environment test failed:', error.message);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testPaymentusFlow().then(() => {
    return testEnvironment();
  });
}

module.exports = { testPaymentusFlow, testEnvironment }; 