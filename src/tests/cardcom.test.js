require('dotenv').config();
const cardcomService = require('../services/cardcom');

async function testCardcomPayment() {
  try {
    // נדמה בקשה מ-GoHighLevel
    const testData = {
      orderId: 'TEST-' + Date.now(),
      amount: 5,
      customerName: 'Test Client',
      customerEmail: 'test@testdomain.com',
      items: [
        {
          name: 'חולצה',
          price: 5,
          quantity: 1
        }
      ]
    };

    console.log('Testing Cardcom payment with data:', JSON.stringify(testData, null, 2));
    
    // יצירת עמוד תשלום
    const result = await cardcomService.createLowProfile('test-location', testData);
    console.log('\nSuccess! Payment page created.');
    console.log('Payment URL:', result.url);
    
    // בדיקת סטטוס התשלום (אופציונלי)
    if (result.lowProfileId) {
      console.log('\nChecking payment status...');
      const status = await cardcomService.verifyPayment(result.lowProfileId);
      console.log('Payment status:', JSON.stringify(status, null, 2));
    }

  } catch (error) {
    console.error('\nTest failed:', error.response?.data || error.message);
  }
}

testCardcomPayment();
