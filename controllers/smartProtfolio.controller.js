// // smartPortfolioController.js

// const finnhub = require('finnhub');
// const api_key = finnhub.ApiClient.instance.authentications['api_key'];
// api_key.apiKey = process.env.FINHUB_API_KEY;
// const finnhubClient = new finnhub.DefaultApi();

// Helper to fetch quote data for a list of symbols
async function getQuotes(symbols) {
  return await Promise.all(symbols.map(symbol => {
    return new Promise((resolve, reject) => {
      finnhubClient.quote(symbol, (error, data) => {
        if (error) return reject(error);
        resolve({ symbol, ...data });
      });
    });
  }));
}


// exports.getPortfolioOverview = async (req, res) => {
//   try {
//     const portfolio = req.body.holdings; // [{ symbol: "AAPL", shares: 10 }]
//     let totalValue = 0, dailyChange = 0;

//     const detailed = await Promise.all(portfolio.map(async holding => {
//       const { data: quote } = await finnhubClient.quote(holding.symbol);
//       const value = quote.c * holding.shares;
//       const change = quote.d * holding.shares;

//       totalValue += value;
//       dailyChange += change;

//       return {
//         symbol: holding.symbol,
//         shares: holding.shares,
//         price: quote.c,
//         change: quote.d,
//         percent: quote.dp,
//         value
//       };
//     }));

//     res.status(200).json({
//       totalHoldings: totalValue.toFixed(2),
//       dailyReturn: dailyChange.toFixed(2),
//       dailyReturnPercent: ((dailyChange / totalValue) * 100).toFixed(2),
//       holdings: detailed
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Portfolio overview failed", detail: err.message });
//   }
// };

// exports.getTopMovers = async (req, res) => {
//   const symbols = req.body.symbols;
//   try {
//     const results = await getQuotes(symbols);
//     const sorted = results.sort((a, b) => b.dp - a.dp);
//     res.status(200).json({
//       topGainers: sorted.slice(0, 3),
//       topLosers: sorted.slice(-3).reverse()
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching top movers", detail: err.message });
//   }
// };

// exports.getDetailedHoldings = async (req, res) => {
//   const symbols = req.body.symbols;
//   try {
//     const details = await Promise.all(symbols.map(async symbol => {
//       const [quote, rec, target, metric] = await Promise.all([
//         finnhubClient.quote(symbol),
//         finnhubClient.recommendationTrends(symbol),
//         finnhubClient.priceTarget(symbol),
//         finnhubClient.companyMetrics(symbol, 'all')
//       ]);

//       const consensus = rec.data[0]?.strongBuy >= 3 ? "Strong Buy" : "Hold";

//       return {
//         symbol,
//         price: quote.data.c,
//         change: quote.data.d,
//         percentChange: quote.data.dp,
//         consensus,
//         targetPrice: target.data.targetMean || null,
//         smartScore: metric.data.metric?.peNormalizedAnnual || "N/A"
//       };
//     }));

//     res.status(200).json({ holdings: details });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to get detailed holdings", detail: err.message });
//   }
// };

// exports.getChartData = async (req, res) => {
//   const { symbol, resolution, from, to } = req.query;
//   try {
//     const { data } = await finnhubClient.stockCandles(symbol, resolution, from, to);
//     res.status(200).json(data);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch chart data", detail: err.message });
//   }
// };

// exports.getEarningsCalendar = async (req, res) => {
//   const { from, to } = req.query;
//   try {
//     const { data } = await finnhubClient.earningsCalendar({ from, to });
//     res.status(200).json(data);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch earnings calendar", detail: err.message });
//   }
// };

// exports.getPerformanceBreakdown = async (req, res) => {
//   const portfolio = req.body.holdings;
//   try {
//     const breakdown = await Promise.all(portfolio.map(async holding => {
//       const { data: quote } = await finnhubClient.quote(holding.symbol);
//       const holdingValue = quote.c * holding.shares;
//       const gain = (quote.c - quote.pc) * holding.shares;

//       return {
//         symbol: holding.symbol,
//         holdingValue,
//         gain,
//         percentGain: ((gain / (quote.pc * holding.shares)) * 100).toFixed(2)
//       };
//     }));

//     res.status(200).json({ performance: breakdown });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch performance breakdown", detail: err.message });
//   }
// };




const finnhub = require('finnhub');
const moment = require('moment');

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = process.env.FINHUB_API_KEY;
const finnhubClient = new finnhub.DefaultApi();

// Portfolio Overview
// exports.getPortfolioOverview = async (req, res) => {
//   try {
//     const portfolio = req.body.holdings; // [{ symbol: "AAPL", shares: 10 }]
//     let totalValue = 0, dailyChange = 0;

//     const detailed = await Promise.all(portfolio.map(async holding => {
//       const { data: quote } = await finnhubClient.quote(holding.symbol);
//       console.log(quote)
//       const value = quote.c * holding.shares;
//       const change = quote.d * holding.shares;

//       totalValue += value;
//       dailyChange += change;

//       return {
//         symbol: holding.symbol,
//         shares: holding.shares,
//         price: quote.c,
//         change: quote.d,
//         percent: quote.dp,
//         value
//       };
//     }));

//     res.status(200).json({
//       totalHoldings: totalValue.toFixed(2),
//       dailyReturn: dailyChange.toFixed(2),
//       dailyReturnPercent: ((dailyChange / totalValue) * 100).toFixed(2),
//       holdings: detailed
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Portfolio overview failed", detail: err.message });
//   }
// };

exports.getPortfolioOverview = async (req, res) => {
  try {
    const portfolio = req.body.holdings; // [{ symbol: "AAPL", shares: 10 }]
    let totalValue = 0, dailyChange = 0;

    const detailed = await Promise.all(portfolio.map(holding => {
      return new Promise((resolve, reject) => {
        finnhubClient.quote(holding.symbol, (error, quote) => {
          if (error) return reject(error);

          const value = quote.c * holding.shares;
          const change = quote.d * holding.shares;

          totalValue += value;
          dailyChange += change;

          resolve({
            symbol: holding.symbol,
            shares: holding.shares,
            price: quote.c,
            change: quote.d,
            percent: quote.dp,
            value: value.toFixed(2)
          });
        });
      });
    }));

    res.status(200).json({
      totalHoldings: totalValue.toFixed(2),
      dailyReturn: dailyChange.toFixed(2),
      dailyReturnPercent: ((dailyChange / totalValue) * 100).toFixed(2),
      holdings: detailed
    });
  } catch (err) {
    res.status(500).json({ error: "Portfolio overview failed", detail: err.message });
  }
};


exports.getTopMovers = async (req, res) => {
  const symbols = req.body.symbols;
  try {
    const results = await getQuotes(symbols);
    const sorted = results.sort((a, b) => b.dp - a.dp);
    res.status(200).json({
      topGainers: sorted.slice(0, 3),
      topLosers: sorted.slice(-3).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching top movers", detail: err.message });
  }
};
// Earnings Calendar
exports.getEarningsCalendar = async (req, res) => {
  try {
    const from = moment().format('YYYY-MM-DD');
    const to = moment().add(30, 'days').format('YYYY-MM-DD');

    finnhubClient.earningsCalendar({ from, to }, (error, data) => {
      if (error) return res.status(500).json({ error });
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching earnings calendar' });
  }
};

// Portfolio Performance Breakdown
exports.getPerformanceBreakdown = async (req, res) => {
  const { symbols } = req.body;
  try {
    const performance = await Promise.all(
      symbols.map(async (symbol) => {
        const profile = await new Promise((resolve, reject) => {
          finnhubClient.companyProfile2({ symbol }, (error, data) => {
            if (error) reject(error);
            else resolve(data);
          });
        });

        const quote = await new Promise((resolve, reject) => {
          finnhubClient.quote(symbol, (error, data) => {
            if (error) reject(error);
            else resolve(data);
          });
        });

        return {
          symbol,
          name: profile.name,
          price: quote.c,
          change: quote.d,
          percent: quote.dp,
        };
      })
    );

    res.json({ performance });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching performance breakdown' });
  }
};

// Dividends Info
exports.getDividends = async (req, res) => {
  const { symbol } = req.params;
  try {
    const from = moment().subtract(1, 'year').format('YYYY-MM-DD');
    const to = moment().format('YYYY-MM-DD');

    finnhubClient.stockDividends(symbol, from, to, (error, data) => {
      if (error) return res.status(500).json({ error });
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dividend info' });
  }
};

// Asset Allocation (mock breakdown from profile)
exports.getAssetAllocation = async (req, res) => {
  const { symbols } = req.body;
  try {
    const allocation = await Promise.all(
      symbols.map(async (symbol) => {
        const profile = await new Promise((resolve, reject) => {
          finnhubClient.companyProfile2({ symbol }, (error, data) => {
            if (error) reject(error);
            else resolve(data);
          });
        });

        return {
          symbol,
          sector: profile.finnhubIndustry,
          country: profile.country,
        };
      })
    );
    res.json({ allocation });
  } catch (error) {
    console.log( error);
    res.status(500).json({ error: 'Error fetching asset allocation' });
  }
};

// Volatility & PE (Beta & metrics)
exports.getStockMetrics = async (req, res) => {
  const { symbol } = req.params;
  try {
    finnhubClient.companyBasicFinancials(symbol, 'all', (error, data) => {
      if (error) return res.status(500).json({ error });

      const metrics = {
        beta: data.metric.beta,
        peRatio: data.metric.peInclExtraTTM,
        dividendYield: data.metric.dividendYieldIndicatedAnnual,
      };
      res.json(metrics);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching metrics' });
  }
};

// Chart Historical Prices
exports.getStockChart = async (req, res) => {
  const { symbol, resolution, from, to } = req.query;
  try {
    finnhubClient.stockCandles(symbol, resolution, from, to, (error, data) => {
      if (error) return res.status(500).json({ error });
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chart data' });
  }
};
