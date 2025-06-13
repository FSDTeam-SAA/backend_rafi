const mongoose = require('mongoose')

const protfolioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
      },
    userId: {
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

        }
    ]
  },
  {
    timestamps: true,
  }
)

const protfolio = mongoose.model('protfolioSchema', protfolioSchema)
module.exports = protfolio
