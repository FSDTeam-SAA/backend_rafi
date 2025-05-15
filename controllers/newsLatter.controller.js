
const { sendMail } = require('../config/mailer') 
const newsLatter = require('../models/newsLatter.model')

// Subscribe
 const subscribe = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' })
      return
    }
    const existing = await newsLatter.findOne({ email })
    if (existing) {
      res.status(400).json({ success: false, message: 'Already subscribed' })
      return
    }
    await newsLatter.create({ email })
    res.status(201).json({ success: true, message: 'Subscribed successfully' })
  } catch (err) {
    next(err)
  }
}
// Unsubscribe (POST /api/newsletter/unsubscribe)
 const unsubscribe = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' })
      return
    }
    const deleted = await newsLatter.findOneAndDelete({ email })
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Email not found' })
      return
    }
    res.json({ success: true, message: 'Unsubscribed successfully' })
  } catch (err) {
    next(err)
  }
}

// Send email to all subscribers (POST /api/newsletter/send)
 const sendToAll = async (
  req,
  res,
  next
) => {
  try {
    const { subject, html } = req.body
    if (!subject || !html) {
      res
        .status(400)
        .json({ success: false, message: 'Subject and html are required' })
      return
    }
    const subscribers = await newsLatter.find()
    console.log('subscribers', subscribers)
    const emails = subscribers.map((sub) => sub.email)
    for (const email of emails) {
      await sendMail(email, subject, html)
    }
    res.json({ success: true, message: 'Emails sent to all subscribers' })
  } catch (err) {
    next(err)
  }
}

module.exports = { subscribe, unsubscribe, sendToAll }