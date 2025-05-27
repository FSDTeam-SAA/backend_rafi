const { PaymentInfo } = require('../models/paymentInfo.model')

const {
  generateClientToken,
  processTransaction,
} = require('../services/braintree.service')

// JSON validation middleware
const validateJsonBody = (err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload',
      details: err.message,
    })
  }
  next()
}

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
    const { amount, paymentMethodNonce, userId, bookingId, seasonId } = req.body

    const result = await processTransaction(amount, paymentMethodNonce)

    if (result.success) {
      const newPayment = await PaymentInfo.create({
        userId,
        bookingId,
        seasonId,
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
