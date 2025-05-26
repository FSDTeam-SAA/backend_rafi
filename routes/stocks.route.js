const express = require('express');
const { createAd, getAllAds, getSingleAd, updateAd, deleteAd } = require("../controllers/ads.controller");
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const { stocksSummary, searchStocks, getStockOverview, getDailyGainersLosers } = require('../controllers/stock.controller');

const router = express.Router();

router.get('/stock-summary',protect, stocksSummary);
router.get("/search",protect,searchStocks);
router.get("/stocks-overview",protect,getStockOverview)
router.get( "/daily-gainner-loser",getDailyGainersLosers)
module.exports = router;