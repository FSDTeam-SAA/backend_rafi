const express = require('express')
const router = express.Router()
const subscriptionPlanController = require('../controllers/subscriptionPlan.controller')

// Create
router.post('/create/subscription', subscriptionPlanController.createSubscriptionPlan)

// Read all
router.get('/subscription', subscriptionPlanController.getAllSubscriptionPlans)

// Read single
router.get('/subscriptions/:id', subscriptionPlanController.getSubscriptionPlan)

// Update
router.put(
  '/subscriptions/:id',
  subscriptionPlanController.updateSubscriptionPlan
)

// Delete
router.delete(
  '/subscriptions/:id',
  subscriptionPlanController.deleteSubscriptionPlan
)

module.exports = router
