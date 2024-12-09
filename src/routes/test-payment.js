const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const paymentService = require('../services/payment');

// Save test configuration
router.post('/save-test-config', async (req, res) => {
  try {
    const testConfig = {
      terminalNumber: "154042",
      apiName: "4eh4Cel12HyLaPn6sN2t",
      username: "CarU8GMg4VhRoUhEcmq9",
      environment: "test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('cardcom_configs').doc('test-location').set(testConfig);
    
    res.json({
      success: true,
      message: 'Test configuration saved successfully',
      config: testConfig
    });
  } catch (error) {
    console.error('Error saving test config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test payment endpoint
router.post('/process-payment', async (req, res) => {
  try {
    const paymentData = {
      amount: req.body.amount || 1, // Default to 1 NIS for testing
      description: req.body.description || 'Test Transaction'
    };

    const result = await paymentService.processPayment('test-location', paymentData);
    res.json(result);
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
