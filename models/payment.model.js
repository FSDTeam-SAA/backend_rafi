const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subscription',
    },
    price: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'complete', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
    },
    paymentMethodNonce: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

const PaymentInfo = mongoose.model('paymentInfo', paymentSchema)
module.exports = PaymentInfo
