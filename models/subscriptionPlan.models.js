const mongoose = require('mongoose')

const subscriptionPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    features: {
      featuresType: {
        type: String,
        default: '',
      },
      type: [
        {
          type: String,
        },
      ],
    },
    duration: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: [true, 'Duration is required'],
    },
  },
  {
    timestamps: true,
  }
)

const SubscriptionPlan = mongoose.model(
  'SubscriptionPlan',
  subscriptionPlanSchema
)

module.exports = SubscriptionPlan
