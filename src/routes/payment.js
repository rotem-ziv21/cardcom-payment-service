const express = require('express');
const router = express.Router();
const cardcomService = require('../services/cardcom');
const path = require('path');

// GoHighLevel Payment Provider Metadata
router.get('/provider', (req, res) => {
    res.json({
        name: process.env.PROVIDER_NAME,
        description: process.env.PROVIDER_DESCRIPTION,
        logoUrl: process.env.PROVIDER_LOGO_URL,
        uniqueName: process.env.PROVIDER_UNIQUE_NAME,
        paymentUrl: `${process.env.BASE_URL}/process/:locationId`,
        queryUrl: `${process.env.BASE_URL}/query/:locationId`
    });
});

// Process payment request from GoHighLevel
router.get('/process/:locationId', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'payment.html'));
});

router.post('/process/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const {
            amount,
            currency,
            items,
            customer,
            metadata
        } = req.body;

        console.log('Received payment request:', {
            locationId,
            amount,
            currency,
            items,
            customer,
            metadata
        });

        // יצירת פרטי התשלום לקארדקום
        const paymentData = {
            orderId: metadata?.orderId || `GHL-${Date.now()}`,
            amount: parseFloat(amount),
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerEmail: customer.email,
            items: items.map(item => ({
                name: item.name,
                price: parseFloat(item.unitPrice),
                quantity: item.quantity
            }))
        };

        console.log('Creating payment with data:', paymentData);

        // יצירת עסקה בקארדקום
        const result = await cardcomService.createLowProfile(locationId, paymentData);

        console.log('Cardcom response:', result);

        // החזרת התשובה ל-GoHighLevel
        res.json({
            success: true,
            url: result.url,
            providerId: result.providerId || paymentData.orderId,
            metadata: {
                cardcomLowProfileId: result.lowProfileId
            }
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Query endpoint for payment status, refunds, etc.
router.post('/query/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { action, paymentId, metadata } = req.body;

        console.log('Received query request:', {
            locationId,
            action,
            paymentId,
            metadata
        });

        let result;
        switch (action) {
            case 'verify':
                result = await cardcomService.verifyPayment(paymentId);
                break;
            
            case 'refund':
                const { amount } = req.body;
                result = await cardcomService.refundPayment(paymentId, amount);
                break;
            
            case 'subscription':
                result = await cardcomService.checkSubscription(paymentId);
                break;
            
            default:
                throw new Error(`Unsupported action: ${action}`);
        }

        console.log('Query result:', result);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Query processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Success/Failure redirect endpoints
router.get('/payment/success/:locationId', (req, res) => {
    const { locationId } = req.params;
    const { ReturnValue } = req.query;
    
    console.log('Payment success:', { locationId, ReturnValue });
    
    // Redirect back to GoHighLevel with success status
    res.redirect(`${process.env.HIGHLEVEL_REDIRECT_URI}?status=success&orderId=${ReturnValue}`);
});

router.get('/payment/failed/:locationId', (req, res) => {
    const { locationId } = req.params;
    const { ReturnValue } = req.query;
    
    console.log('Payment failed:', { locationId, ReturnValue });
    
    // Redirect back to GoHighLevel with failure status
    res.redirect(`${process.env.HIGHLEVEL_REDIRECT_URI}?status=failed&orderId=${ReturnValue}`);
});

// Webhook endpoint for payment status updates
router.post('/webhook/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const webhookData = req.body;

        console.log('Received webhook:', webhookData);

        // עדכון סטטוס התשלום ב-GoHighLevel
        const status = webhookData.Status === 'Approved' ? 'success' : 'failed';
        
        // שליחת עדכון ל-GoHighLevel
        // TODO: implement GoHighLevel status update

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// תצוגת דף התשלום
router.get('/pay', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/payment.html'));
});

// Success page
router.get('/success/:locationId', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>תשלום הושלם בהצלחה</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background-color: #f8f9fa;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success-icon {
          color: #28a745;
          font-size: 48px;
          margin-bottom: 1rem;
        }
        h1 {
          color: #28a745;
          margin-bottom: 1rem;
        }
        p {
          color: #6c757d;
          margin-bottom: 2rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✓</div>
        <h1>התשלום בוצע בהצלחה!</h1>
        <p>תודה על הרכישה</p>
      </div>
      <script>
        // Notify parent window about success
        if (window.opener) {
          window.opener.postMessage({ type: 'payment_success' }, '*');
          setTimeout(() => window.close(), 3000);
        }
      </script>
    </body>
    </html>
  `);
});

// Failure page
router.get('/failed/:locationId', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>שגיאה בתשלום</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background-color: #f8f9fa;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error-icon {
          color: #dc3545;
          font-size: 48px;
          margin-bottom: 1rem;
        }
        h1 {
          color: #dc3545;
          margin-bottom: 1rem;
        }
        p {
          color: #6c757d;
          margin-bottom: 2rem;
        }
        .retry-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        .retry-button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">✕</div>
        <h1>התשלום נכשל</h1>
        <p>אירעה שגיאה בביצוע התשלום. אנא נסה שנית.</p>
        <button class="retry-button" onclick="window.close()">סגור</button>
      </div>
      <script>
        // Notify parent window about failure
        if (window.opener) {
          window.opener.postMessage({ type: 'payment_failed' }, '*');
          setTimeout(() => window.close(), 5000);
        }
      </script>
    </body>
    </html>
  `);
});

// GoHighLevel test page
router.get('/ghl-test', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/ghl-test.html'));
});

module.exports = router;
