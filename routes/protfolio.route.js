const express = require('express');
const { getPortfolioOverview, getEarningsCalendar, getPerformanceBreakdown, getDividends, getAssetAllocation, getStockMetrics, getStockChart, getTopMovers, createProtfolio, addStockProtfolio, getProtfolio, deleteStockFromPortfolio, getProtfolioById, getCalendarEvents, getPortfolioDashboard, updateProtfolio, addToWatchList, removeFromWatchList, getWatchList, deleteProtfolio, deleteTransaction } = require('../controllers/smartProtfolio.controller');
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

router.get("/get-performance/:portfolioId",getPortfolioDashboard)

// Volatility, PE, Dividends, Beta
router.get('/portfolio/metrics/:symbol', getStockMetrics);

// Chart Historical Data
router.get('/portfolio/chart', getStockChart);
router.get('/portfolio/upcoming-event', getCalendarEvents);


router.get('/portfolio/get',protect, getProtfolio);
router.get('/portfolio/get/:id',protect, getProtfolioById);

router.post('/protfolio/create',protect,createProtfolio)
router.patch('/protfolio/:id',protect,updateProtfolio)
router.delete('/protfolio/:id',protect,deleteProtfolio)

router.post('/protfolio/add-stock',protect,addStockProtfolio)
router.post('/protfolio/delete-stock',protect,deleteStockFromPortfolio)
router.post('/protfolio/delete-transection',protect,deleteTransaction)



router.post('/protfolio/watchlist/add', protect, addToWatchList);
router.post('/protfolio/watchlist/remove', protect, removeFromWatchList);
router.get('/protfolio/watchlist/', protect, getWatchList);

module.exports = router;
