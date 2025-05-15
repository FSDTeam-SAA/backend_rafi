const mongoose = require('mongoose')

const newsLatterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      require: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const newsLatter = mongoose.model('newslatter', newsLatterSchema)
module.exports = newsLatter
