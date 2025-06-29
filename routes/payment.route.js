const express = require('express')
const {
  //   getClientToken,
  //   makePayment,
  createPayment,
  confirmPayment,
} = require('../controllers/payment.controller.js')


const router = express.Router()

// Create Payment
router.post("/create-payment", createPayment);

// Capture Payment
router.post("/confirm-payment", confirmPayment)




module.exports = router

