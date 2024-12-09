const express = require('express');
const router = express.Router();
const highLevelService = require('../services/highlevel');
const cardcomService = require('../services/cardcom');

// Handle payment initiation from HighLevel
router.post('/process/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { 
      orderId,
      amount,
      customerName,
      customerEmail,
      items,
      language = 'he'
    } = req.body;

    // Create Low Profile payment page in Cardcom
    const lowProfileResponse = await cardcomService.createLowProfile(locationId, {
      orderId,
      amount,
      customerName,
      customerEmail,
      items,
      language
    });

    // Return the payment page URL to be loaded in iframe
    res.json({
      success: true,
      paymentUrl: lowProfileResponse.LowProfileUrl,
      transactionId: orderId
    });

  } catch (error) {
    console.error('Payment process error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle Cardcom webhook notifications
router.post('/webhook/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const webhookData = req.body;

    const result = await cardcomService.handleWebhook(locationId, webhookData);

    // Notify HighLevel about the payment status
    if (result.success) {
      await highLevelService.sendWebhookEvent('payment.succeeded', {
        transactionId: result.orderId,
        status: 'succeeded',
        paymentProvider: 'cardcom'
      });
    } else {
      await highLevelService.sendWebhookEvent('payment.failed', {
        transactionId: result.orderId,
        status: 'failed',
        error: result.message,
        paymentProvider: 'cardcom'
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle payment status check
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const status = await cardcomService.getPaymentStatus(orderId);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Success redirect endpoint
router.get('/success/:locationId', async (req, res) => {
  res.send(`
    <html>
      <body>
        <script>
          window.parent.postMessage({ type: 'payment_success' }, '*');
        </script>
        <h2>התשלום בוצע בהצלחה!</h2>
      </body>
    </html>
  `);
});

// Failure redirect endpoint
router.get('/failed/:locationId', async (req, res) => {
  res.send(`
    <html>
      <body>
        <script>
          window.parent.postMessage({ type: 'payment_failed' }, '*');
        </script>
        <h2>התשלום נכשל, אנא נסה שנית</h2>
      </body>
    </html>
  `);
});

module.exports = router;
