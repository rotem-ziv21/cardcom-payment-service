const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

router.get('/test-firebase', async (req, res) => {
  try {
    // Try to write a test document
    const testRef = db.collection('test').doc('test-doc');
    await testRef.set({
      message: 'Firebase connection works!',
      timestamp: new Date().toISOString()
    });

    // Read it back
    const doc = await testRef.get();
    
    res.json({
      success: true,
      data: doc.data(),
      message: 'Firebase connection is working properly'
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to connect to Firebase'
    });
  }
});

module.exports = router;
