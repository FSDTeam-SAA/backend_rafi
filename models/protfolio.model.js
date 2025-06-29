const mongoose = require('mongoose')

const protfolioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    stocks: [
      {
        symbol: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
        },
        date: {
          type: Date,
          default: Date.now(),
        },
        transection: [{
          event: {
            type: String,
            enum: ['buy', 'sell'],
          },
          price: {
            type: Number,
          },
          quantity: {
            type: Number,
          },
          date: {
            type: Date,
            },
        }]

      }
    ],
    cash: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
)

const protfolio = mongoose.model('protfolioSchema', protfolioSchema)
module.exports = protfolio
