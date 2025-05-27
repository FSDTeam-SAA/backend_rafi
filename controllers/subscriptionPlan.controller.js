const SubscriptionPlan = require('../models/subscriptionPlan.models')

// Create a new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const newPlan = await SubscriptionPlan.create(req.body)
    res.status(201).json({ success: true,message: "Subscription plan created successfully!", data: newPlan })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// Get all subscription plans
exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find()
    res.status(200).json({ success: true,message: "All subscription plans!", data: plans })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// Get a single subscription plan
exports.getSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id)
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' })
    }
    res.status(200).json({ success: true, data: plan })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// Update a subscription plan
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!updatedPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found' })
    }
    res.status(200).json({ success: true,message: "Subscription plan successfully updated!", data: updatedPlan })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// Delete a subscription plan
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const deletedPlan = await SubscriptionPlan.findByIdAndDelete(req.params.id)
    if (!deletedPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found' })
    }
    res
      .status(200)
      .json({ success: true, message: 'Plan deleted successfully' })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}
