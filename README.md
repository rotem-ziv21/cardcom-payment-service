# HighLevel Custom Payment Provider

This project implements a custom payment provider integration for HighLevel's marketplace.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Fill in your HighLevel app credentials and other configuration

3. Start the server:
```bash
npm start
```

## HighLevel Configuration

1. Create a marketplace app in HighLevel dashboard
2. Configure the required scopes:
   - payments/orders.readonly
   - payments/orders.write
   - payments/subscriptions.readonly
   - payments/transactions.readonly
   - payments/custom-provider.readonly
   - payments/custom-provider.write
   - products.readonly
   - products/prices.readonly

3. Set the redirect URL to: `https://your-domain.com/oauth/callback`
4. Configure webhook URL to: `https://your-domain.com/webhook`

## Features

- OAuth integration with HighLevel
- Payment processing
- Subscription management
- Webhook handling
- Refund processing

## Development

Run in development mode with hot reloading:
```bash
npm run dev
```

Run tests:
```bash
npm test
```
