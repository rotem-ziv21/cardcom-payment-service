const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.json({
    message: 'Payment Integration Service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      oauth: '/oauth/callback',
      webhook: '/webhook',
      payment: '/payment',
      status: '/status'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Routes
app.use('/oauth', require('./routes/oauth'));
app.use('/webhook', require('./routes/webhook'));
app.use('/payment', require('./routes/payment'));
app.use('/status', require('./routes/status'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
