const express = require('express');
const { getPortfolioOverview, getEarningsCalendar, getPerformanceBreakdown, getDividends, getAssetAllocation, getStockMetrics, getStockChart, getTopMovers, createProtfolio, addStockProtfolio } = require('../controllers/smartProtfolio.controller');
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

router.post('/protfolio/create',createProtfolio)

router.post('/protfolio/add-stock',addStockProtfolio)

module.exports = router;
