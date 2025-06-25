const mongoose = require('mongoose')

const watchListSchema = new mongoose.Schema(
  {
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
        }
    ],
  },
  {
    timestamps: true,
  }
)

const WatchList = mongoose.model('watchList', watchListSchema)
module.exports = WatchList
