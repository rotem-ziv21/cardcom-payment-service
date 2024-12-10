const axios = require('axios');

class CardcomService {
  constructor() {
    this.baseUrl = process.env.CARDCOM_ENVIRONMENT === 'test' 
      ? 'https://secure.cardcom.solutions/api/v11/LowProfile/Create'
      : 'https://secure.cardcom.co.il/api/v11/LowProfile/Create';
    
    this.terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER;
    this.apiName = process.env.CARDCOM_API_NAME;
  }

  async createLowProfile(locationId, {
    orderId,
    amount,
    customerName,
    customerEmail,
    items = [],
    language = 'he'
  }) {
    try {
      console.log('Creating low profile payment page with params:', {
        locationId,
        orderId,
        amount,
        customerName,
        customerEmail,
        items
      });

      // Calculate total amount from items if not provided directly
      const totalAmount = amount || items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

      const requestData = {
        TerminalNumber: parseInt(this.terminalNumber),
        ApiName: this.apiName,
        ReturnValue: orderId,
        Amount: parseFloat(totalAmount),
        SuccessRedirectUrl: `${process.env.BASE_URL}/payment/success/${locationId}`,
        FailedRedirectUrl: `${process.env.BASE_URL}/payment/failed/${locationId}`,
        WebHookUrl: `${process.env.BASE_URL}/payment/webhook/${locationId}`,
        Document: {
          To: customerName,
          Email: customerEmail,
          Products: items.map(item => ({
            Description: item.name,
            UnitCost: parseFloat(item.price),
            Quantity: item.quantity || 1
          }))
        }
      };

      console.log('Sending request to Cardcom:', JSON.stringify(requestData, null, 2));

      const response = await axios.post(this.baseUrl, requestData);
      console.log('Received response from Cardcom:', response.data);

      if (response.data && response.data.Url) {
        return {
          success: true,
          url: response.data.Url
        };
      } else {
        throw new Error('Invalid response from Cardcom');
      }

    } catch (error) {
      console.error('Error creating low profile payment:', error.response?.data || error.message);
      throw error;
    }
  }

  async handleWebhook(locationId, webhookData) {
    try {
      console.log('Received webhook for locationId:', locationId);
      console.log('Webhook data:', webhookData);

      // Process the webhook data and return appropriate response
      return {
        success: true,
        message: 'Webhook processed successfully'
      };

    } catch (error) {
      console.error('Error processing webhook:', error);
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

  async verifyPayment(paymentId) {
    try {
      const response = await axios.post('https://secure.cardcom.solutions/api/v11/LowProfile/QueryPayment', {
        TerminalNumber: parseInt(this.terminalNumber),
        ApiName: this.apiName,
        LowProfileId: paymentId
      });

      return {
        status: response.data.Status,
        transactionId: response.data.TransactionId,
        amount: response.data.Amount,
        currency: 'ILS',
        metadata: {
          cardcomStatus: response.data.Status,
          cardcomTransactionId: response.data.TransactionId
        }
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId, amount) {
    try {
      const response = await axios.post('https://secure.cardcom.solutions/api/v11/Transactions/ChargeRefund', {
        TerminalNumber: parseInt(this.terminalNumber),
        ApiName: this.apiName,
        TransactionId: paymentId,
        SumToBill: amount
      });

      return {
        success: response.data.ResponseCode === 0,
        refundId: response.data.RefundTransactionId,
        amount: amount,
        currency: 'ILS',
        metadata: {
          cardcomRefundId: response.data.RefundTransactionId
        }
      };
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  async checkSubscription(paymentId) {
    // קארדקום לא תומכת במנויים בממשק הנוכחי
    return {
      status: 'not_supported',
      message: 'Subscriptions are not supported in the current implementation'
    };
  }
}

module.exports = new CardcomService();
