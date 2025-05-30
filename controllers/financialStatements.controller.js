// controllers/financialStatements.controller.js
const axios = require('axios')
const finnhub = require('finnhub')
require('dotenv').config()

// Configure Finnhub client
const api_key = finnhub.ApiClient.instance.authentications['api_key']
api_key.apiKey = process.env.FINHUB_API_KEY
// const finnhubClient = new finnhub.DefaultApi(); // Not directly used with axios calls here

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
          symbol: symbol,
          freq: frequency, // "annual" or "quarterly"
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

// Export the function(s) you want to use in your routes
module.exports = {
  getBalanceSheet,
  // If you decide to expose getTrendingSymbols as an API endpoint,
  // you would also export it here and create a route for it.
  // getTrendingSymbols, // If you plan to use it in routes
}

// You can keep the main() example usage for testing this controller file directly if needed,
// but it won't be used when this file is required by the router.
/*
async function main() {
  const symbol = 'AAPL';
  try {
    const annualBalanceSheet = await getBalanceSheet(symbol, 'annual');
    console.log(`Annual Balance Sheet for ${symbol}:`, JSON.stringify(annualBalanceSheet, null, 2));

    const quarterlyBalanceSheet = await getBalanceSheet(symbol, 'quarterly');
    console.log(`Quarterly Balance Sheet for ${symbol}:`, JSON.stringify(quarterlyBalanceSheet, null, 2));
  } catch (e) {
    console.error('Failed to retrieve balance sheet:', e);
  }
}
// main();
*/

// Your existing getTrendingSymbols function (can be kept here or moved to a separate utility file)
// Note: This function is not exported and therefore not accessible via module.exports above.
async function getTrendingSymbols(limit = 5) {
  // ... (your trending symbols logic) ...
  // This part is not relevant to the balance sheet route itself.
  // I'm assuming you want to keep it in this file for now.
  const { data: symbols } = await axios.get(
    'https://finnhub.io/api/v1/stock/symbol',
    {
      params: {
        exchange: 'US',
        token: process.env.FINHUB_API_KEY,
      },
    }
  )

  const sample = [
    { symbol: 'AAPL' },
    { symbol: 'GOOG' },
    { symbol: 'AMZN' },
    { symbol: 'MSFT' },
  ]
  const filtered = []

  for (let stock of sample) {
    try {
      const { data: metrics } = await axios.get(
        'https://finnhub.io/api/v1/stock/metric',
        {
          params: {
            symbol: stock.symbol,
            metric: 'all',
            token: process.env.FINHUB_API_KEY,
          },
        }
      )

      const volume = metrics.metric['10DayAverageTradingVolume'] || 0
      const marketCap = metrics.metric.marketCapitalization || 0

      filtered.push(stock.symbol)

      if (filtered.length >= limit) break
    } catch (e) {
      continue
    }
  }

  return filtered
}
