const axios = require('axios')
require('dotenv').config()

/**
 * Fetches the balance sheet for a given stock symbol.
 * @param {string} symbol The stock symbol (e.g., "AAPL").
 * @param {string} frequency "annual" or "quarterly"
 * @returns {Promise<Object>} A promise that resolves to the balance sheet data.
 */
async function getBalanceSheet(symbol, frequency = 'annual') {
  try {
    const { data } = await axios.get(
      'https://finnhub.io/api/v1/stock/financials-reported',
      {
        params: {
          symbol,
          freq: frequency,
          token: process.env.FINHUB_API_KEY,
        },
      }
    )
    return data
  } catch (error) {
    console.error(`Error fetching balance sheet for ${symbol}:`, error.message)
    if (error.response) {
      throw new Error(
        `Finnhub API error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      )
    } else if (error.request) {
      throw new Error(`No response from Finnhub API: ${error.message}`)
    } else {
      throw new Error(
        `Error setting up request to Finnhub API: ${error.message}`
      )
    }
  }
}

/**
 * Fetches historical dividend data for a given stock symbol within a date range.
 * @param {string} symbol The stock ticker symbol (e.g., "AAPL").
 * @param {string} fromDate Start date in YYYY-MM-DD format.
 * @param {string} toDate End date in YYYY-MM-DD format.
 * @returns {Promise<Array>} A promise that resolves to an array of dividend objects.
 */
async function getDividends(symbol, fromDate, toDate) {
  try {
    const { data } = await axios.get(
      'https://finnhub.io/api/v1/stock/dividend',
      {
        params: {
          symbol,
          from: fromDate,
          to: toDate,
          token: process.env.FINHUB_API_KEY,
        },
      }
    )
    return data
  } catch (error) {
    console.error(`Error fetching dividends for ${symbol}:`, error.message)
    if (error.response) {
      throw new Error(
        `Finnhub API error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      )
    } else if (error.request) {
      throw new Error(`No response from Finnhub API: ${error.message}`)
    } else {
      throw new Error(
        `Error setting up request to Finnhub API: ${error.message}`
      )
    }
  }
}

module.exports = {
  getBalanceSheet,
  getDividends,
}
