const mongoose = require('mongoose')

const oliveSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    fair_value: { type: Number, required: true },
    financial_health: {type: String, required: true },
    compatitive_advantage: {type: String, required: true },
  },
  {
    timestamps: true,
  }
)

const Olive = mongoose.model('Olive', oliveSchema)
module.exports = Olive
