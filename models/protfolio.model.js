const mongoose = require('mongoose')

const protfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    ticker: [
        {
            symbol: {
                type: String,
            }

        }
    ]
  },
  {
    timestamps: true,
  }
)

const protfolio = mongoose.model('protfolioSchema', protfolioSchema)
module.exports = protfolio
