const express = require('express')
const router = express.Router()
const financialStatementsController = require('../controllers/financialStatements.controller')

// Helper function to validate YYYY-MM-DD format
function isValidDate(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString))
}

/**
 * GET /api/financial-statements/balance-sheet
 */
router.get('/financial-statements/balance-sheet', async (req, res) => {
  const { symbol, frequency } = req.query

  if (!symbol) {
    return res.status(400).json({ error: 'Stock symbol is required.' })
  }

  const validFrequencies = ['annual', 'quarterly']
  if (frequency && !validFrequencies.includes(frequency.toLowerCase())) {
    return res
      .status(400)
      .json({ error: "Invalid frequency. Use 'annual' or 'quarterly'." })
  }

  try {
    const balanceSheetData =
      await financialStatementsController.getBalanceSheet(
        symbol.toUpperCase(),
        frequency ? frequency.toLowerCase() : 'annual'
      )
    res.json(balanceSheetData)
  } catch (error) {
    console.error(
      `Error in /api/financial-statements/balance-sheet route: ${error.message}`
    )
    res.status(500).json({
      error: 'Failed to retrieve balance sheet data.',
      details: error.message,
    })
  }
})

/**
 * GET /api/financial-statements/dividends
 */
router.get('/financial-statements/dividends', async (req, res) => {
  const { symbol, fromDate, toDate } = req.query

  if (!symbol || !fromDate || !toDate) {
    return res
      .status(400)
      .json({ error: 'Stock symbol, fromDate, and toDate are required.' })
  }

  if (!isValidDate(fromDate) || !isValidDate(toDate)) {
    return res
      .status(400)
      .json({ error: 'Invalid date format. Use YYYY-MM-DD.' })
  }

  if (new Date(fromDate) > new Date(toDate)) {
    return res.status(400).json({ error: 'fromDate cannot be after toDate.' })
  }

  try {
    const dividendsData = await financialStatementsController.getDividends(
      symbol.toUpperCase(),
      fromDate,
      toDate
    )
    res.json(dividendsData)
  } catch (error) {
    console.error(
      `Error in /api/financial-statements/dividends route: ${error.message}`
    )
    res.status(500).json({
      error: 'Failed to retrieve dividend data.',
      details: error.message,
    })
  }
})

module.exports = router
