// routes/financialStatements.routes.js
const express = require('express')
const router = express.Router()
// Correctly import the controller functions
const financialStatementsController = require('../controllers/financialStatements.controller')
const getBalanceSheet = require("../controllers/financialStatements.controller")
/**
 * @swagger
 * /api/financial-statements/balance-sheet:
 * get:
 * summary: Retrieve a company's financial statement balance sheet.
 * description: Fetches annual or quarterly balance sheet data for a given stock symbol from Finnhub.
 * parameters:
 * - in: query
 * name: symbol
 * schema:
 * type: string
 * required: true
 * description: The stock ticker symbol (e.g., AAPL, MSFT).
 * - in: query
 * name: frequency
 * schema:
 * type: string
 * enum: [annual, quarterly]
 * required: false
 * default: annual
 * description: The frequency of the financial report (annual or quarterly).
 * responses:
 * 200:
 * description: Successfully retrieved balance sheet data.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * symbol:
 * type: string
 * example: AAPL
 * financials:
 * type: array
 * items:
 * type: object
 * properties:
 * reportFrequency:
 * type: string
 * example: annual
 * bs:
 * type: object
 * properties:
 * cashAndCashEquivalents:
 * type: number
 * example: 38400000000
 * totalAssets:
 * type: number
 * example: 352583000000
 * totalLiabilities:
 * type: number
 * example: 293375000000
 * 400:
 * description: Invalid request parameters.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: Stock symbol is required.
 * 500:
 * description: Internal server error, or an error from the Finnhub API.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: Failed to retrieve balance sheet data.
 * details:
 * type: string
 * example: Finnhub API error: 400 - {"error":"Invalid stock symbol"}
 */
router.get('/financial-statement/balance-sheet', async (req, res) => {
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
        // <--- Call the function from the imported controller
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

// If you had other routes for financial statements, they would go here
// router.get('/income-statement', financialStatementsController.getIncomeStatement);

module.exports = router // Export the router instance
