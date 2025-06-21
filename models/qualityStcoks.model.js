const mongoose = require('mongoose')

const qualityStocksSchema = new mongoose.Schema(
  {
    type : {type : String, enum: ['quality', 'protfolio']},
    stocks: [
        {
            symbol: {
                type: String,
            },

        }
    ]
  },
  {
    timestamps: true,
  }
)

const qualityStocks = mongoose.model('qualityStocks', qualityStocksSchema)
module.exports = qualityStocks
