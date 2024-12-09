const axios = require('axios');

class CardcomService {
  constructor() {
    this.baseUrl = process.env.CARDCOM_ENVIRONMENT === 'production'
      ? 'https://secure.cardcom.solutions/Interface/BillGold.asmx'
      : 'https://secure.cardcom.solutions/Interface/BillGold.asmx';
  }

  async processPayment(amount, cardInfo, billingInfo) {
    try {
      const response = await axios.post(this.baseUrl + '/Bill_CreateWithToken', {
        terminalnumber: process.env.CARDCOM_TERMINAL_NUMBER,
        username: process.env.CARDCOM_USERNAME,
        ApiName: process.env.CARDCOM_API_NAME,
        TokenToCharge: cardInfo.token,
        SumToBill: amount,
        CoinID: 1, // 1 for ILS
        Language: 'he',
        CardValidityMonth: cardInfo.expirationMonth,
        CardValidityYear: cardInfo.expirationYear,
        CardOwnerName: billingInfo.name,
        CardOwnerEmail: billingInfo.email,
        CardOwnerPhone: billingInfo.phone,
        IdentityNumber: billingInfo.id
      });

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          transactionId: response.data.InternalDealNumber,
          authCode: response.data.AuthNum
        };
      } else {
        throw new Error(response.data.Description);
      }
    } catch (error) {
      console.error('Cardcom payment error:', error);
      throw error;
    }
  }

  async processRefund(transactionId, amount) {
    try {
      const response = await axios.post(this.baseUrl + '/Bill_CancelByInternalNumber', {
        terminalnumber: process.env.CARDCOM_TERMINAL_NUMBER,
        username: process.env.CARDCOM_USERNAME,
        ApiName: process.env.CARDCOM_API_NAME,
        InternalDealNumber: transactionId,
        SumToRefund: amount
      });

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          refundId: response.data.CancelNumber
        };
      } else {
        throw new Error(response.data.Description);
      }
    } catch (error) {
      console.error('Cardcom refund error:', error);
      throw error;
    }
  }

  async verifyTransaction(transactionId) {
    try {
      const response = await axios.post(this.baseUrl + '/Bill_GetByInternalNumber', {
        terminalnumber: process.env.CARDCOM_TERMINAL_NUMBER,
        username: process.env.CARDCOM_USERNAME,
        ApiName: process.env.CARDCOM_API_NAME,
        InternalDealNumber: transactionId
      });

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          status: response.data.StatusDescription,
          amount: response.data.SumDeals
        };
      } else {
        throw new Error(response.data.Description);
      }
    } catch (error) {
      console.error('Cardcom verification error:', error);
      throw error;
    }
  }

  async createPaymentToken(cardNumber, expirationMonth, expirationYear, cvv) {
    try {
      const response = await axios.post(this.baseUrl + '/Token_CreateToken', {
        terminalnumber: process.env.CARDCOM_TERMINAL_NUMBER,
        username: process.env.CARDCOM_USERNAME,
        ApiName: process.env.CARDCOM_API_NAME,
        CardNumber: cardNumber,
        CardValidityMonth: expirationMonth,
        CardValidityYear: expirationYear,
        ThreeDigits: cvv
      });

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          token: response.data.Token
        };
      } else {
        throw new Error(response.data.Description);
      }
    } catch (error) {
      console.error('Cardcom token creation error:', error);
      throw error;
    }
  }
}

module.exports = new CardcomService();
