const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
    },
    features: {
      featuresType: {
        type: String
      },
      type: [{
        type: String
      }]
    },
    duration: {
        type: String,
        enum:['monthly', 'yearly']
    },
   
  },  {
    timestamps: true,
  }
)

const subscriptionPlan = mongoose.model(
  'subscriptionPlan',
  subscriptionPlanSchema
)
module.exports = subscriptionPlan