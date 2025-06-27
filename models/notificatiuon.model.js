const { Schema, default: mongoose } = require("mongoose")

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['news', 'trade'],
      required: true 
    },
    related: {type: String},
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
)

const notification = mongoose.model('notification', NotificationSchema)
module.exports = notification
