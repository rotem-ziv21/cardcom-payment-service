const express = require('express');
const router = express.Router();
const axios = require('axios');

const BASE_URL = 'https://cardcom-payment-service.onrender.com';

// Register payment provider with GoHighLevel
router.post('/register/:locationId', async (req, res) => {
  const { locationId } = req.params;
  const { token } = req.body; // Access token from GoHighLevel

  try {
    const response = await axios.post(
      `https://services.leadconnectorhq.com/payments/custom-provider/provider?locationId=${locationId}`,
      {
        name: "Cardcom Payments",
        description: "Secure payment processing with Cardcom - supporting credit cards and various payment methods.",
        paymentsUrl: `${BASE_URL}/payment/process`,
        queryUrl: `${BASE_URL}/payment/status`,
        imageUrl: "https://www.cardcom.co.il/wp-content/uploads/2019/11/cardcom-logo.png"
      },
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    res.json({
      success: true,
      data: response.data,
      message: 'Payment provider registered successfully'
    });
  } catch (error) {
    console.error('Provider registration error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Update payment provider
router.put('/update/:locationId', async (req, res) => {
  const { locationId } = req.params;
  const { token } = req.body;

  try {
    const response = await axios.put(
      `https://services.leadconnectorhq.com/payments/custom-provider/provider?locationId=${locationId}`,
      {
        name: "Cardcom Payments",
        description: "Secure payment processing with Cardcom - supporting credit cards and various payment methods.",
        paymentsUrl: `${BASE_URL}/payment/process`,
        queryUrl: `${BASE_URL}/payment/status`,
        imageUrl: "https://www.cardcom.co.il/wp-content/uploads/2019/11/cardcom-logo.png"
      },
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    res.json({
      success: true,
      data: response.data,
      message: 'Payment provider updated successfully'
    });
  } catch (error) {
    console.error('Provider update error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get provider status
router.get('/status/:locationId', async (req, res) => {
  const { locationId } = req.params;
  const { token } = req.query;

  try {
    const response = await axios.get(
      `https://services.leadconnectorhq.com/payments/custom-provider/provider?locationId=${locationId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    res.json({
      success: true,
      data: response.data,
      message: 'Provider status retrieved successfully'
    });
  } catch (error) {
    console.error('Provider status error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

module.exports = router;
