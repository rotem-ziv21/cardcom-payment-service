const axios = require('axios');
const config = require('../config/cardcom');

class CardcomService {
  constructor() {
    this.baseUrl = 'https://secure.cardcom.solutions/api/v11';
  }

  async createLowProfile(locationId, paymentData) {
    try {
      // Calculate total amount from items
      const totalAmount = paymentData.items.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
      }, 0);

      const requestData = {
        TerminalNumber: config.terminalNumber,
        APIName: config.apiName,
        ReturnValue: paymentData.orderId,
        Operation: "1",
        CodePage: "65001",
        SumToBill: totalAmount,
        Description: paymentData.items[0].name,
        SuccessRedirectUrl: `${process.env.BASE_URL}/payment/success/${locationId}`,
        FailedRedirectUrl: `${process.env.BASE_URL}/payment/failed/${locationId}`,
        NotificationUrl: `${process.env.BASE_URL}/payment/webhook/${locationId}`,
        Language: paymentData.language || "he",
        CoinID: 1,
        IsManualCodeRequired: false,
        IsValidatePhone: false,
        // Add customer details
        CustomerEmail: paymentData.customerEmail,
        CustomerId: locationId,
        CustomerName: paymentData.customerName
      };

      console.log('Sending request to Cardcom:', JSON.stringify(requestData, null, 2));

      // Create Low Profile request
      const response = await axios.post(`${this.baseUrl}/LowProfile/Create`, requestData);

      console.log('Cardcom response:', JSON.stringify(response.data, null, 2));

      // Check if we got a valid URL back
      if (!response.data.url) {
        throw new Error(`Cardcom error: ${response.data.Description || 'Unknown error'}`);
      }

      return {
        success: true,
        transactionId: paymentData.orderId,
        paymentUrl: response.data.url
      };
    } catch (error) {
      console.error('Error creating Low Profile:', error.response ? error.response.data : error.message);
      throw new Error(error.response?.data?.Description || error.message);
    }
  }

  async handleWebhook(locationId, webhookData) {
    try {
      const { ReturnValue, Status, ErrorMessage } = webhookData;
      
      return {
        orderId: ReturnValue,
        success: Status === '0',
        message: Status === '0' ? 'Payment successful' : ErrorMessage
      };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  async getPaymentStatus(orderId) {
    // בקארדקום אין API ישיר לבדיקת סטטוס - אנחנו מקבלים את זה דרך ה-webhook
    return {
      orderId,
      status: 'pending',
      message: 'Status will be updated via webhook'
    };
  }
}

module.exports = new CardcomService();
