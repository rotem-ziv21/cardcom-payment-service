const ApiContracts = require('authorizenet').APIContracts;
const ApiControllers = require('authorizenet').APIControllers;

class AuthorizeNetService {
  constructor() {
    this.merchantAuthentication = new ApiContracts.MerchantAuthenticationType();
    this.merchantAuthentication.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
    this.merchantAuthentication.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);
  }

  async processPayment(amount, cardInfo, billingInfo) {
    const creditCard = new ApiContracts.CreditCardType();
    creditCard.setCardNumber(cardInfo.cardNumber);
    creditCard.setExpirationDate(cardInfo.expirationDate);
    creditCard.setCardCode(cardInfo.cvv);

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(amount);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(this.merchantAuthentication);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          const transactionResponse = response.getTransactionResponse();
          resolve({
            success: true,
            transactionId: transactionResponse.getTransId(),
            authCode: transactionResponse.getAuthCode(),
            avsResponse: transactionResponse.getAvsResultCode()
          });
        } else {
          reject({
            success: false,
            error: response.getMessages().getMessage()[0].getText()
          });
        }
      });
    });
  }

  async processRefund(transactionId, amount) {
    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.REFUNDTRANSACTION);
    transactionRequestType.setRefTransId(transactionId);
    transactionRequestType.setAmount(amount);

    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(this.merchantAuthentication);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve({
            success: true,
            refundId: response.getTransactionResponse().getTransId()
          });
        } else {
          reject({
            success: false,
            error: response.getMessages().getMessage()[0].getText()
          });
        }
      });
    });
  }

  async verifyTransaction(transactionId) {
    const getRequest = new ApiContracts.GetTransactionDetailsRequest();
    getRequest.setMerchantAuthentication(this.merchantAuthentication);
    getRequest.setTransId(transactionId);

    const ctrl = new ApiControllers.GetTransactionDetailsController(getRequest.getJSON());

    return new Promise((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.GetTransactionDetailsResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          const transaction = response.getTransaction();
          resolve({
            success: true,
            status: transaction.getTransactionStatus(),
            amount: transaction.getSettleAmount()
          });
        } else {
          reject({
            success: false,
            error: response.getMessages().getMessage()[0].getText()
          });
        }
      });
    });
  }
}

module.exports = new AuthorizeNetService();
