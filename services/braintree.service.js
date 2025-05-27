const { gateway } = require('../config/paypalBraintree') 

export const generateClientToken = async () => {
  return gateway.clientToken.generate({})
}

export const processTransaction = async (
  amount,
  paymentMethodNonce
) => {
  return gateway.transaction.sale({
    amount,
    paymentMethodNonce,
    options: {
      submitForSettlement: true,
    },
  })
}
