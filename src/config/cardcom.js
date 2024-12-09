// Cardcom configuration
const config = {
  terminalNumber: process.env.CARDCOM_TERMINAL_NUMBER || '0000000',
  apiName: process.env.CARDCOM_API_NAME || 'test_api',
  environment: process.env.CARDCOM_ENVIRONMENT || 'test'
};

module.exports = config;
