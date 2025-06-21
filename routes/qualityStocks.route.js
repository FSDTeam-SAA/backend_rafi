const express = require('express');
const router = express.Router();
const {
  addStockToType,
  deleteStockFromType
} = require('../controllers/qualityStocks.controller');

router.post('/quality-stocks', addStockToType);
router.delete('/quality-stocks', deleteStockFromType);

module.exports = router;
