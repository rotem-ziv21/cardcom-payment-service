const express = require('express');
const router = express.Router();
const cardcomConfig = require('../config/cardcom');

// Check integration status
router.get('/:locationId', async (req, res) => {
  try {
    // Since we're using static config, we'll always return true
    res.json({
      success: true,
      status: {
        configured: true,
        terminalNumber: cardcomConfig.terminalNumber,
        environment: cardcomConfig.environment
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
