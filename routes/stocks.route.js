const express = require('express');
const { createAd, getAllAds, getSingleAd, updateAd, deleteAd } = require("../controllers/ads.controller");
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const { stocksSummary, searchStocks, getStockOverview, getDailyGainersLosers } = require('../controllers/stock.controller');

const router = express.Router();

router.get('/stock-summary', stocksSummary);
router.get("/search",searchStocks);
router.get("/stocks-overview",getStockOverview)
router.get( "/daily-gainner-loser",getDailyGainersLosers)
module.exports = router;