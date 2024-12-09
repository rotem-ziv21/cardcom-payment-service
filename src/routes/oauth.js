const express = require('express');
const router = express.Router();
const highLevelService = require('../services/highlevel');
const authService = require('../services/auth');

// Generate authorization URL
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = authService.generateAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Auth URL generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code, locationId } = req.query;
  
  try {
    // Exchange code for access token
    const tokenData = await highLevelService.exchangeCodeForToken(code);
    
    // Store the token securely
    await authService.storeToken(locationId, tokenData);
    
    // Create provider integration
    await highLevelService.createProviderIntegration(locationId, tokenData.access_token);
    
    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Integration Success</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .success-container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .success-icon {
              color: #4CAF50;
              font-size: 48px;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="success-container">
            <div class="success-icon">✓</div>
            <h1>Integration Successful!</h1>
            <p>You can now close this window and return to HighLevel.</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Integration setup error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Integration Error</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .error-container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .error-icon {
              color: #f44336;
              font-size: 48px;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">✗</div>
            <h1>Integration Failed</h1>
            <p>Error: ${error.message}</p>
            <p>Please try again or contact support.</p>
          </div>
        </body>
      </html>
    `);
  }
});

module.exports = router;
