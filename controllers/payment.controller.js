const Stripe = require('stripe')
const User = require('../models/user.model')
const paymentInfo = require('../models/payment.model.js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})
const moment = require('moment'); // You can use moment.js or native Date methods

exports.createPayment = async (req, res) => {
  const { userId, price, subscriptionId, duration } = req.body;

  if (!userId || !price ) {
    return res.status(400).json({
      error: 'userId, and amount are required.',
    })
  }

  try {
    // Calculate expiry date based on duration
    let expiryDate;
    if (duration === 'monthly') {
      expiryDate = moment().add(1, 'month').toDate(); // Add 1 month
    } else if (duration === 'yearly') {
      expiryDate = moment().add(1, 'year').toDate(); // Add 1 year
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Stripe expects the amount in cents
      currency: 'usd',
      metadata: {
        userId,
        subscriptionId,
        duration,
      },
    })

    // Save payment record with status 'pending' and calculated expiryDate
    const PaymentInfo = new paymentInfo({
      userId,
      subscriptionId,
      price,
      transactionId: paymentIntent.id,
      paymentStatus: 'pending',
      duration,
      expiryDate,
    })
    await PaymentInfo.save()

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      message: 'PaymentIntent created.',
    })
  } catch (error) {
    console.error('Error creating PaymentIntent:', error)
    res.status(500).json({
      error: 'Internal server error.',
    })
  }
}

exports.confirmPayment = async (req, res) => {
  const { paymentIntentId } = req.body

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'paymentIntentId is required.' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      await paymentInfo.findOneAndUpdate(
        { transactionId: paymentIntentId },
        { paymentStatus: 'failed' }
      )

      return res.status(400).json({ error: 'Payment was not successful.' })
    }

    const paymentRecord = await paymentInfo.findOneAndUpdate(
      { transactionId: paymentIntentId },
      { paymentStatus: 'complete' },
      { new: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Payment processed and transferred.',
      paymentIntent,
    })
  } catch (error) {
    console.error('Error confirming or transferring payment:', error)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

