const express = require('express');
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const { stocksSummary, searchStocks, getStockOverview, getDailyGainersLosers, getStockTargetPrice, getStockCashFlow, getStockEPS, getStockEarningsSurprise, getOliveStockOverview, getRevenueBreakdown, getQualityStocks, getStockOfTheMonth, oliveStcoksProfolio, getFinancialOverview, getOwnershipOverview, getOptionsChain, getSimilarStocksAndPerformance, filterStocks } = require('../controllers/stock.controller');

const router = express.Router();

router.get('/stock-summary', stocksSummary);
router.get("/search",searchStocks);
router.get("/search/filter",filterStocks);
router.get("/stocks-overview",getStockOverview)
router.get( "/daily-gainner-loser",getDailyGainersLosers)
router.get( "/get-stock-overview",getOliveStockOverview)

router.get("/revenue-breakdown",getRevenueBreakdown)

router.get('/stock/target-price', getStockTargetPrice);
router.get('/stock/cash-flow', getStockCashFlow);
router.get('/stock/eps', getStockEPS);
router.get('/stock/earnings-surprise', getStockEarningsSurprise);

router.get('/quality-stocks', getQualityStocks);
router.get('/stock-of-month', getStockOfTheMonth);
router.get('/olive-stock-protfolio', oliveStcoksProfolio);

router.get('/financial-overview/:symbol', getFinancialOverview);
router.get('/ownership/:symbol', getOwnershipOverview);
router.get("/options/:symbol", getOptionsChain);
router.get("/similar/:symbol", getSimilarStocksAndPerformance);

module.exports = router;