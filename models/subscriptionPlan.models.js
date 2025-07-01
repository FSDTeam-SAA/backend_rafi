const mongoose = require('mongoose')

const featureSchema = new mongoose.Schema(
  {
    featuresType: {
      type: String,
      default: '',
    },
    type: [{
      name: {
        type: String,
      },
      active:{
        type:Boolean,
      }
    }

    ],
  },
  { _id: false }
)

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
    monthly_price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    yearly_price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    features: [featureSchema],
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
