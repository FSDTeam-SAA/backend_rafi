const { PaymentInfo } = require("../models/payment.model")

const {
  generateClientToken,
  processTransaction,
} = require('../services/braintree.service')

// getClientToken
exports.getClientToken = async (_req, res) => {
  try {
    const { clientToken } = await generateClientToken()
    res.status(200).json({ clientToken })
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate token', error: err })
  }
}

// processTransaction
exports.makePayment = async (req, res) => {
  try {
    const { amount, paymentMethodNonce, userId, subscriptionId } = req.body

    const result = await processTransaction(amount, paymentMethodNonce)

    if (result.success) {
      const newPayment = await PaymentInfo.create({
        userId,
        subscriptionId,
        price: amount,
        paymentStatus: 'complete',
        transactionId: result.transaction.id,
        paymentMethodNonce,
        paymentMethod: result.transaction.paymentInstrumentType,
      })

      res.status(200).json({
        message: 'Payment successful',
        transactionId: result.transaction.id,
        payment: newPayment,
      })
      return
    } else {
      res.status(400).json({
        message: 'Payment failed',
        error: result.message,
      })
    }
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err })
  }
}
