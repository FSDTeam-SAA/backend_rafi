const express = require('express');
const { getPortfolioOverview, getEarningsCalendar, getPerformanceBreakdown, getDividends, getAssetAllocation, getStockMetrics, getStockChart, getTopMovers, createProtfolio, addStockProtfolio, getProtfolio, deleteStockFromPortfolio } = require('../controllers/smartProtfolio.controller');
const { protect } = require('../middlewares/auth.middleware');
const router = express.Router();

// Portfolio Overview
router.post('/portfolio/overview', getPortfolioOverview);


// Earnings Calendar
router.get('/portfolio/earnings-calendar', getEarningsCalendar);

router.post('/portfolio/topmovers',getTopMovers)

// Performance Breakdown
router.post('/portfolio/performance', getPerformanceBreakdown);

// Dividends Info
router.get('/portfolio/dividends/:symbol', getDividends);

// Asset Allocation
router.post('/portfolio/allocation', getAssetAllocation);

// Volatility, PE, Dividends, Beta
router.get('/portfolio/metrics/:symbol', getStockMetrics);

// Chart Historical Data
router.get('/portfolio/chart', getStockChart);


router.get('/portfolio/get',protect, getProtfolio);

router.post('/protfolio/create',protect,createProtfolio)

router.post('/protfolio/add-stock',protect,addStockProtfolio)
router.post('/protfolio/delete-stock',protect,deleteStockFromPortfolio)

module.exports = router;
