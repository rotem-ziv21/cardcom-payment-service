const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/mongodb');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

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
      payment: {
        process: '/payment/process/:locationId',
        webhook: '/payment/webhook/:locationId',
        status: '/payment/status/:orderId',
        success: '/payment/success/:locationId',
        failed: '/payment/failed/:locationId'
      },
      provider: {
        register: '/provider/register/:locationId',
        update: '/provider/update/:locationId',
        status: '/provider/status/:locationId'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Service is running' });
});

// Routes
const oauthRoutes = require('./routes/oauth');
const paymentRoutes = require('./routes/payment');
const statusRoutes = require('./routes/status');
const configRoutes = require('./routes/config');

// Use routes
app.use('/oauth', oauthRoutes);
app.use('/payment', paymentRoutes);
app.use('/status', statusRoutes);
app.use('/config', configRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
