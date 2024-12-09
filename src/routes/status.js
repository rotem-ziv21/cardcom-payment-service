const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const tokenService = require('../services/token');

// Check integration status
router.get('/:locationId', async (req, res) => {
  const { locationId } = req.params;

  try {
    // Check if we have valid tokens
    let hasValidToken = false;
    try {
      await tokenService.getToken(locationId);
      hasValidToken = true;
    } catch (error) {
      console.log('No valid token found:', error.message);
    }

    // Check if we have Cardcom config
    const cardcomDoc = await db.collection('cardcom_configs').doc(locationId).get();
    const hasCardcomConfig = cardcomDoc.exists && cardcomDoc.data().terminalNumber;

    // Generate auth URL if needed
    let authUrl = null;
    if (!hasValidToken) {
      authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=payments/orders.readonly payments/orders.write payments/subscriptions.readonly payments/transactions.readonly payments/custom-provider.readonly payments/custom-provider.write products.readonly products/prices.readonly`;
    }

    res.json({
      connected: hasValidToken,
      configured: hasCardcomConfig,
      authUrl,
      message: hasValidToken ? 
        (hasCardcomConfig ? 'Fully configured and connected' : 'Connected but missing Cardcom configuration') :
        'Not connected'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check status',
      details: error.message 
    });
  }
});

module.exports = router;
