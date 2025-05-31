const express = require('express')
const {
  getClientToken,
  makePayment,
 
} = require('../controllers/payment.controller')

const router = express.Router()

// Generate client token for Braintree
router.get('/payments/client-token', getClientToken)

// Process payment
router.post('/payments/checkout', makePayment)


module.exports = router
