const express = require('express');
const router = express.Router();

// Handle HighLevel webhooks
router.post('/', async (req, res) => {
  try {
    const { event, chargeId, ghlSubscriptionId, subscriptionSnapshot, chargeSnapshot } = req.body;
    
    switch (event) {
      case 'payment.captured':
        // Handle payment capture
        break;
      case 'subscription.updated':
        // Handle subscription update
        break;
      case 'subscription.trialing':
      case 'subscription.active':
        // Handle subscription status change
        break;
      case 'subscription.charged':
        // Handle subscription charge
        break;
      default:
        console.warn(`Unhandled webhook event: ${event}`);
    }
    
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

module.exports = router;
