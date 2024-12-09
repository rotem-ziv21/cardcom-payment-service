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
      payment: {
        process: '/payment/process/:locationId',
        webhook: '/payment/webhook/:locationId',
        status: '/payment/status/:orderId'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Routes
const paymentRoutes = require('./routes/payment');
const statusRoutes = require('./routes/status');

// Use routes
app.use('/payment', paymentRoutes);
app.use('/status', statusRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
