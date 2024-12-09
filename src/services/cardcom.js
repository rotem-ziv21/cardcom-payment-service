const axios = require('axios');
const config = require('../config/cardcom');

class CardcomService {
  constructor() {
    this.baseUrl = 'https://secure.cardcom.solutions/Interface/LowProfileClearing.aspx';
  }

  async createLowProfile(locationId, paymentData) {
    try {
      // Calculate total amount from items
      const totalAmount = paymentData.items.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
      }, 0);

      const requestData = {
        terminalnumber: config.terminalNumber,
        lowprofilecode: config.apiName,
        sum: totalAmount,
        coinid: 1, // NIS
        language: paymentData.language || "he",
        customeremail: paymentData.customerEmail,
        customerid: locationId,
        customername: paymentData.customerName,
        successurl: `${process.env.BASE_URL}/payment/success/${locationId}`,
        failureurl: `${process.env.BASE_URL}/payment/failed/${locationId}`,
        cancelurl: `${process.env.BASE_URL}/payment/failed/${locationId}`,
        callbackurl: `${process.env.BASE_URL}/payment/webhook/${locationId}`,
        description: paymentData.items[0].name,
        operationtype: "1",
        codepage: "65001",
        returnvalue: paymentData.orderId
      };

      console.log('Sending request to Cardcom:', JSON.stringify(requestData, null, 2));

      // Create Low Profile request
      const response = await axios.post(this.baseUrl, null, {
        params: requestData
      });

      console.log('Cardcom response:', JSON.stringify(response.data, null, 2));

      // Check if we got a valid URL back
      if (!response.data || response.data.includes('Error')) {
        throw new Error(`Cardcom error: ${response.data || 'Unknown error'}`);
      }

      return {
        success: true,
        transactionId: paymentData.orderId,
        paymentUrl: response.data
      };
    } catch (error) {
      console.error('Error creating Low Profile:', error.response ? error.response.data : error.message);
      throw new Error(error.response?.data || error.message);
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
