const { Router } = require('express')
const { subscribe, unsubscribe, sendToAll } = require('../controllers/newsLatter.controller')

const router = Router()

router.post('/newsletter/subscribe', subscribe)
router.post('/newsletter/unsubscribe', unsubscribe)
router.post('/newsletter/send', sendToAll)

module.exports = router
