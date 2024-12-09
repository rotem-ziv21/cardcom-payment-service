const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const axios = require('axios');
const querystring = require('querystring');

// Generate authorization URL
router.get('/auth-url', (req, res) => {
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=payments/orders.readonly payments/orders.write payments/subscriptions.readonly payments/transactions.readonly payments/custom-provider.readonly payments/custom-provider.write products.readonly products/prices.readonly`;
  
  res.json({ authUrl });
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { code, locationId } = req.query;

  if (!code || !locationId) {
    return res.status(400).json({ 
      error: 'Missing required parameters' 
    });
  }

  try {
    // Exchange code for access token using x-www-form-urlencoded format
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', 
      querystring.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        user_type: 'Location'  // Adding user_type parameter
      }), 
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Store the tokens in Firebase
    await db.collection('oauth_tokens').doc(locationId).set({
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
      tokenType: tokenResponse.data.token_type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Store initial Cardcom config (empty)
    await db.collection('cardcom_configs').doc(locationId).set({
      terminalNumber: "",
      username: "",
      apiName: "",
      environment: "test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Return success response
    res.json({
      success: true,
      message: 'OAuth flow completed successfully',
      locationId
    });
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to complete OAuth flow',
      details: error.message 
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  const { locationId } = req.body;

  if (!locationId) {
    return res.status(400).json({ 
      error: 'Missing locationId' 
    });
  }

  try {
    // Get stored tokens
    const tokenDoc = await db.collection('oauth_tokens').doc(locationId).get();
    if (!tokenDoc.exists) {
      return res.status(404).json({ 
        error: 'No tokens found for this location' 
      });
    }

    const tokens = tokenDoc.data();

    // Refresh the access token using x-www-form-urlencoded format
    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token',
      querystring.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        user_type: 'Location'  // Adding user_type parameter
      }),
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Update stored tokens
    await db.collection('oauth_tokens').doc(locationId).update({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to refresh token',
      details: error.message 
    });
  }
});

module.exports = router;
