const express = require('express');
const router = express.Router();
const authService = require('../services/auth');

// Check integration status
router.get('/:locationId', async (req, res) => {
  const { locationId } = req.params;
  
  try {
    const token = await authService.getStoredToken(locationId);
    
    if (token) {
      res.json({
        status: 'connected',
        expiresAt: token.expires_at
      });
    } else {
      const authUrl = authService.generateAuthUrl();
      res.json({
        status: 'disconnected',
        authUrl
      });
    }
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
