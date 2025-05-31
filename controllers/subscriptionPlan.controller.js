const SubscriptionPlan = require('../models/subscriptionPlan.models')

// Helper: Consistent response formatter
const sendResponse = (res, status, success, message, data = null) => {
  res.status(status).json({
    success,
    message,
    data,
  })
}

// Create a new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const newPlan = await SubscriptionPlan.create(req.body)
    sendResponse(
      res,
      201,
      true,
      'Subscription plan created successfully!',
      newPlan
    )
  } catch (err) {
    sendResponse(res, 400, false, err.message)
  }
}

// Get all subscription plans
exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find()
    sendResponse(res, 200, true, 'All subscription plans retrieved!', plans)
  } catch (err) {
    sendResponse(res, 500, false, 'Failed to fetch subscription plans')
  }
}

// Get a single subscription plan by ID
exports.getSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id)
    if (!plan) {
      return sendResponse(res, 404, false, 'Subscription plan not found')
    }
    sendResponse(
      res,
      200,
      true,
      'Subscription plan retrieved successfully!',
      plan
    )
  } catch (err) {
    sendResponse(res, 400, false, 'Invalid subscription plan ID')
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
      return sendResponse(res, 404, false, 'Subscription plan not found')
    }
    sendResponse(
      res,
      200,
      true,
      'Subscription plan updated successfully!',
      updatedPlan
    )
  } catch (err) {
    sendResponse(res, 400, false, err.message)
  }
}

// Delete a subscription plan
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const deletedPlan = await SubscriptionPlan.findByIdAndDelete(req.params.id)
    if (!deletedPlan) {
      return sendResponse(res, 404, false, 'Subscription plan not found')
    }
    sendResponse(res, 200, true, 'Subscription plan deleted successfully!')
  } catch (err) {
    sendResponse(res, 400, false, 'Invalid subscription plan ID')
  }
}
