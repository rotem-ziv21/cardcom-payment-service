const axios = require('axios');
const cardcomConfigService = require('./cardcomConfig');

class PaymentService {
  constructor() {
    this.baseUrl = 'https://secure.cardcom.solutions/Interface/BillGold.aspx';
  }

  async processPayment(locationId, paymentData) {
    try {
      const config = await cardcomConfigService.getConfig(locationId);
      
      const cardcomParams = {
        TerminalNumber: config.terminalNumber,
        UserName: config.username,
        APILevel: "10",
        ApiName: config.apiName,
        Operation: "1", // Regular transaction
        Amount: paymentData.amount,
        Currency: "1", // NIS
        Language: "he",
        ...this._buildPaymentParams(paymentData)
      };

      const response = await axios.post(this.baseUrl, cardcomParams);
      return this._handleCardcomResponse(response.data);
    } catch (error) {
      console.error(`Error processing payment for location ${locationId}:`, error);
      throw error;
    }
  }

  _buildPaymentParams(paymentData) {
    return {
      CoinID: "1", // NIS
      ProductName: paymentData.description || "Transaction",
      CodePage: "65001", // UTF-8
      ValidationDataType: "AutoGenerateByInternalToken"
    };
  }

  _handleCardcomResponse(response) {
    // Handle different response codes from Cardcom
    if (response.ResponseCode === "0") {
      return {
        success: true,
        transactionId: response.InternalDealNumber,
        authNumber: response.AuthNumber,
        cardMask: response.CardMask,
        message: "Transaction approved"
      };
    }

    throw new Error(`Transaction failed: ${response.ErrorMessage || 'Unknown error'}`);
  }
}

module.exports = new PaymentService();
