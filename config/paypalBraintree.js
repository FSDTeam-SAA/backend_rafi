const braintree = require('braintree')

// Check for required env vars
const { MERCHANT_ID, PUBLIC_KEY, PRIVATE_KEY } = process.env

if (!MERCHANT_ID || !PUBLIC_KEY || !PRIVATE_KEY) {
  console.error(
    '❌ Missing Braintree environment variables. Please check your .env file.'
  )
  process.exit(1)
}

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: MERCHANT_ID,
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
})

module.exports = { gateway }
