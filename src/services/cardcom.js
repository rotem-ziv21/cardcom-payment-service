const axios = require('axios');
const config = require('../config/cardcom');

class CardcomService {
  constructor() {
    this.baseUrl = 'https://secure.cardcom.solutions/api/v11';
  }

  async createLowProfile(locationId, paymentData) {
    try {
      // Create Low Profile request
      const response = await axios.post(`${this.baseUrl}/LowProfile/Create`, {
        TerminalNumber: config.terminalNumber,
        ApiName: config.apiName,
        ReturnValue: paymentData.orderId,
        Operation: "1", // Regular transaction
        CodePage: "65001", // UTF-8
        SumToBill: paymentData.amount,
        SuccessRedirectUrl: `${process.env.BASE_URL}/payment/success/${locationId}`,
        FailedRedirectUrl: `${process.env.BASE_URL}/payment/failed/${locationId}`,
        NotificationUrl: `${process.env.BASE_URL}/payment/webhook/${locationId}`,
        Document: {
          To: paymentData.customerName,
          Email: paymentData.customerEmail,
          Products: paymentData.items.map(item => ({
            Description: item.name,
            UnitCost: item.price,
            Quantity: item.quantity || 1
          }))
        },
        Language: paymentData.language || "he",
        CoinID: 1, // NIS
        IsManualCodeRequired: false,
        IsValidatePhone: false
      });

      if (response.data.ResponseCode !== "0") {
        throw new Error(`Cardcom error: ${response.data.Description}`);
      }

      return {
        success: true,
        transactionId: paymentData.orderId,
        paymentUrl: response.data.LowProfileUrl
      };
    } catch (error) {
      console.error('Error creating Low Profile:', error);
      throw error;
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
