const gateway = require('../config/paypalBraintree')
module.exports = {
  generateClientToken: async () => {
    return gateway.clientToken.generate({})
  },
  processTransaction: async (amount, paymentMethodNonce) => {
    return gateway.transaction.sale({
      amount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true,
      },
    })
  },
}
