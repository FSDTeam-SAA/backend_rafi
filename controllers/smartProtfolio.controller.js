const { default: axios } = require('axios');
const Protfolio = require('../models/protfolio.model');

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
const Olive = require('../models/stcoks.olive.model');
const protfolio = require('../models/protfolio.model');
const qualityStocks = require('../models/qualityStcoks.model');
const WatchList = require('../models/watchList.model');

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

// exports.getPortfolioOverview = async (req, res) => {
//   try {
//     const portfolio = req.body.holdings; // [{ symbol: "AAPL", shares: 10 }]
//     const {id} = req.body
//     let totalValue = 0, dailyChange = 0;
//     const protfolio = Protfolio.findById(id)
// const detailed = await Promise.all(
//   portfolio.map(async (holding) => {
//     try {
//       const companyProfile = await new Promise((resolve, reject) =>
//         finnhubClient.companyProfile2({ symbol: holding.symbol }, (err, data) =>
//           err ? reject(err) : resolve(data)
//         )
//       );


//       const quote = await new Promise((resolve, reject) =>
//         finnhubClient.quote(holding.symbol, (err, data) =>
//           err || !data || data.c === 0 ? reject(err || new Error('Invalid quote')) : resolve(data)
//         )
//       );
//               const olive = await Olive.findOne({ symbol: holding.symbol }).exec();

//         // Determine quadrant
//         let quadrant = '';
//         if (olive?.financial_health === "good" && olive?.compatitive_advantage === "good") quadrant = 'Olive Green';
//         else if (olive?.financial_health === "good" && olive?.compatitive_advantage === "bad") quadrant = 'Lime Green';
//         else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "good") quadrant = 'Orange';
//         else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "bad") quadrant = 'Yellow';


//         // Olive visuals
//         const olives = {
//           financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
//           competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
//           valuation: quote.c <= olive?.fair_value ? 'green' : 'gray',
//         };

//       const value = quote.c * holding.shares;
//       const change = quote.d * holding.shares;

//       totalValue += value;
//       dailyChange += change;

//       return {
//         logo: companyProfile.logo || '',
//         name: companyProfile.name || '',
//         symbol: holding.symbol,
//         shares: holding.shares,
//         price: quote.c,
//         change: quote.d,
//         percent: quote.dp,
//         value: value.toFixed(2),
//         olives
//       };
//     } catch (err) {
//       console.warn(`Skipping ${holding.symbol}:`, err.message);
//       return null;
//     }
//   })
// );

// const filteredDetailed = detailed.filter(Boolean);

//     res.status(200).json({
//       totalHoldings: totalValue.toFixed(2),
//       dailyReturn: dailyChange.toFixed(2),
//       dailyReturnPercent: ((dailyChange / totalValue) * 100).toFixed(2),
//       holdings: filteredDetailed,
//       cash: protfolio.cash
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Portfolio overview failed", detail: err.message });
//   }
// };


exports.getPortfolioOverview = async (req, res) => {
  try {
    const { id } = req.body;

    const portfolio = await Protfolio.findById(id);
    if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

    const today = moment().unix();
    const thirtyDaysAgo = moment().subtract(30, 'days').unix();

    let totalValue = 0, dailyChange = 0, startValue = 0;

    const detailed = await Promise.all(
      portfolio.stocks.map(async (holding) => {
        try {
          const [companyProfile, quote, candleData, olive] = await Promise.all([
            new Promise((resolve) =>
              finnhubClient.companyProfile2({ symbol: holding.symbol }, (err, data) =>
                resolve(err ? {} : data)
              )
            ),
            new Promise((resolve, reject) =>
              finnhubClient.quote(holding.symbol, (err, data) =>
                err || !data?.c ? reject(err || new Error('Invalid quote')) : resolve(data)
              )
            ),
            new Promise((resolve) =>
              finnhubClient.stockCandles(
                holding.symbol,
                'D',
                thirtyDaysAgo,
                today,
                (err, data) => resolve(err || data.s !== 'ok' ? {} : data)
              )
            ),
            Olive.findOne({ symbol: holding.symbol }).exec()
          ]);

          const quadrant = olive
            ? olive.financial_health === "good" && olive.compatitive_advantage === "good"
              ? 'Olive Green'
              : olive.financial_health === "good"
                ? 'Lime Green'
                : olive.compatitive_advantage === "good"
                  ? 'Orange'
                  : 'Yellow'
            : 'Unknown';

          const olives = {
            financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
            competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
            valuation: quote.c <= olive?.fair_value ? 'green' : 'gray',
          };

          const currentValue = quote.c * holding.quantity;
          const currentChange = quote.d * holding.quantity;
          const gainLossPercent = ((quote.c - holding.price) / holding.price) * 100;

          totalValue += currentValue;
          dailyChange += currentChange;

          let oneMonthReturn = '0.00%';
          if (candleData?.c && candleData.c.length) {
            const priceThen = candleData.c[0]; // closing price 30 days ago
            const holdingReturn = ((quote.c - priceThen) / priceThen) * 100;
            startValue += priceThen * holding.quantity;
            oneMonthReturn = `${holdingReturn.toFixed(2)}%`;
          }

          return {
            logo: companyProfile.logo || '',
            name: companyProfile.name || '',
            symbol: holding.symbol,
            shares: holding.quantity,
            holdingPrice: holding.price,
            holdingGain: gainLossPercent,
            price: quote.c,
            change: quote.d,
            percent: quote.dp,
            value: currentValue.toFixed(2),
            olives,
            quadrant,
            oneMonthReturn
          };
        } catch (err) {
          console.warn(`Skipping ${holding.symbol}:`, err.message);
          return null;
        }
      })
    );

    const filteredHoldings = detailed.filter(Boolean);
    const cash = portfolio.cash || 0;
    const monthlyReturn =
      startValue > 0 ? (((totalValue - startValue) / startValue) * 100).toFixed(2) : '0.00';

    res.status(200).json({
      totalHoldings: totalValue.toFixed(2),
      cash,
      totalValueWithCash: (totalValue + cash).toFixed(2),
      dailyReturn: dailyChange.toFixed(2),
      dailyReturnPercent: ((dailyChange / totalValue) * 100).toFixed(2),
      monthlyReturnPercent: monthlyReturn,
      holdings: filteredHoldings
    });
  } catch (err) {
    console.error("Portfolio overview error:", err);
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

exports.getDividends = async (req, res) => {
  const { symbol } = req.params;

  const from = moment().subtract(8, 'years').format('YYYY-MM-DD');
  const to = moment().format('YYYY-MM-DD');
  console.log(from, to);

  try {
    // Fetch dividend history
    const dividendRes = await axios.get(`https://finnhub.io/api/v1/stock/dividend`, {
      params: { symbol, from, to, token: process.env.FINHUB_API_KEY }
    });

    const dividends = dividendRes.data || [];

    // Calculate total dividends in last 12 months
    const lastYear = moment().subtract(1, 'year');
    const annualDividends = dividends
      .filter(d => moment(d.paymentDate).isAfter(lastYear))
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // Current Price
    const quoteRes = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: { symbol, token: process.env.FINHUB_API_KEY }
    });
    const currentPrice = quoteRes.data?.c || 0;

    const dividendYield = currentPrice ? (annualDividends / currentPrice) * 100 : null;

    // EPS from metrics
    const metricRes = await axios.get(`https://finnhub.io/api/v1/stock/metric`, {
      params: { symbol, metric: 'all', token: process.env.FINHUB_API_KEY }
    });

    const eps = metricRes.data.metric?.epsInclExtraItemsTTM || null;
    const payoutRatio = eps ? (annualDividends / eps) * 100 : null;

    // Dividend Growth (year-over-year)
    const grouped = {};
    for (const d of dividends) {
      const year = moment(d.payDate).year();
      grouped[year] = (grouped[year] || 0) + (d.amount || 0);
    }
    const years = Object.keys(grouped).sort();
    let dividendGrowth = null;
    if (years.length >= 2) {
      const prev = grouped[years[years.length - 2]];
      const curr = grouped[years[years.length - 1]];
      if (prev > 0) {
        dividendGrowth = ((curr - prev) / prev) * 100;
      }
    }

    // Chart data (yearly yield)
    const chartforAmmount = years.map(year => {
      const total = grouped[year];
      return {
        year,
        amount: total.toFixed(2)
      };
    });

    // Chart data (yearly yield)
    const chartforYeild = years.map(year => {
      const total = grouped[year];
      return {
        year,
        yield: currentPrice ? ((total / currentPrice) * 100).toFixed(2) : null,
      };
    });

    return res.json({
      symbol,
      currentPrice,
      annualDividends: annualDividends.toFixed(2),
      dividendYield: dividendYield?.toFixed(2),
      payoutRatio: payoutRatio?.toFixed(2),
      dividendGrowth: dividendGrowth?.toFixed(2),
      chartforYeild,
      chartforAmmount,
      rawDividends: dividends
    });

  } catch (error) {
    console.error('Dividend error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Error fetching dividend info' });
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
    console.log(error);
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

exports.createProtfolio = async (req, res) => {
  const { name } = req.body;
  const _portfolio = await Protfolio.create({ name, user: req.user._id });
  res.status(201).send({
    message: 'Portfolio created successfully',
    portfolio: _portfolio
  });
}

exports.updateProtfolio = async (req, res) => {
  const { name, cash } = req.body;
  const portfolioId = req.params.id;
  const _portfolio = await Protfolio.findByIdAndUpdate(portfolioId, { name, cash }, { new: true });
  res.status(201).send({
    message: 'Portfolio update successfully',
    portfolio: _portfolio
  });
}

exports.getProtfolio = async (req, res) => {
  const protofolio = await Protfolio.find({ user: req.user._id })
  return res.status(200).json(protofolio);
}

exports.getProtfolioById = async (req, res) => {
  const id = req.params.id;
  const protofolio = await Protfolio.findOne({ _id: id, user: req.user._id })
  return res.status(200).json(protofolio);
}

// exports.addStockProtfolio = async (req, res) => {
//   const { portfolioId, symbol, quantity,price } = req.body;

//   const portfolio = await Protfolio.findById(portfolioId);
//   if (!portfolio) {
//     return res.status(404).send({ message: 'Portfolio not found' });
//   }

//   const stockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol);

//   if (stockIndex !== -1) {
//     // Stock exists, update quantity
//     portfolio.stocks[stockIndex].quantity = quantity;
//     if(price) portfolio.stocks[stockIndex].price = price;
//   } else {
//     // Stock doesn't exist, add new entry
//     portfolio.stocks.push({ symbol, quantity,price });
//   }

//   await portfolio.save();

//   res.status(201).send({
//     message: stockIndex !== -1 ? 'Stock quantity updated' : 'Stock added to portfolio',
//     portfolio,
//   });
// };

exports.addStockProtfolio = async (req, res) => {
  const { portfolioId, symbol, quantity, price, symbols } = req.body;

  const portfolio = await Protfolio.findById(portfolioId);
  if (!portfolio) {
    return res.status(404).send({ message: 'Portfolio not found' });
  }

  if (symbols && Array.isArray(symbols) && symbols.length > 0) {
    // Batch add mode
    symbols.forEach((sym) => {
      const exists = portfolio.stocks.find((s) => s.symbol === sym.symbol);
      if (!exists) {
        portfolio.stocks.push({ symbol: sym.symbol, quantity: 1, price: sym.price });
      }
    });

    await portfolio.save();
    return res.status(201).send({
      message: 'Symbols added to portfolio',
      portfolio,
    });
  }

  if (!symbol) {
    return res.status(400).send({ message: 'Symbol is required for single stock add/update' });
  }

  const stockIndex = portfolio.stocks.findIndex((stock) => stock.symbol === symbol);

  if (stockIndex !== -1) {
    portfolio.stocks[stockIndex].quantity = quantity;
    if (price !== undefined) portfolio.stocks[stockIndex].price = price;
  } else {
    portfolio.stocks.push({ symbol, quantity, price });
  }

  await portfolio.save();

  res.status(201).send({
    message: stockIndex !== -1 ? 'Stock quantity updated' : 'Stock added to portfolio',
    portfolio,
  });
};



exports.deleteStockFromPortfolio = async (req, res) => {
  const { portfolioId, symbol } = req.body;

  const portfolio = await Protfolio.findById(portfolioId);
  if (!portfolio) {
    return res.status(404).send({ message: 'Portfolio not found' });
  }

  const stockIndex = portfolio.stocks.findIndex(s => s.symbol === symbol);
  if (stockIndex === -1) {
    return res.status(404).send({ message: 'Stock not found in portfolio' });
  }

  portfolio.stocks.splice(stockIndex, 1); // remove the stock
  await portfolio.save();

  res.status(200).send({
    message: 'Stock removed from portfolio',
    portfolio,
  });
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const from = moment().format('YYYY-MM-DD');
    const to = moment().add(3, 'months').format('YYYY-MM-DD');

    const [earningsRes, dividendsRes] = await Promise.all([
      axios.get('https://finnhub.io/api/v1/calendar/earnings', {
        params: { from, to, token: process.env.FINHUB_API_KEY }
      }),
      axios.get('https://finnhub.io/api/v1/calendar/dividends', {
        params: { from, to, token: process.env.FINHUB_API_KEY }
      })
    ]);

    const earnings = earningsRes.data.earningsCalendar || [];
    const dividends = dividendsRes.data.dividends || [];

    const formatEvent = (e, type) => ({

      symbol: e.symbol,
      type,
      date: e.date || e.exDate
    });

    const events = [
      ...earnings.map(e => formatEvent(e, 'Earnings Release')),
      ...dividends.map(e => formatEvent(e, 'Ex-Dividend Date'))
    ];

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ total: events.length, events });
  } catch (err) {
    console.error('Error fetching calendar events:', err.message);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};


// Helper to get S&P 500 index change over a period
async function getSNP500Return(period = '1M') {
  try {
    const to = moment().format('YYYY-MM-DD');
    const from = moment().subtract(1, 'month').format('YYYY-MM-DD');

    const { data } = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
      params: {
        symbol: '^GSPC',
        resolution: 'D',
        from: moment(from).unix(),
        to: moment(to).unix(),
        token: process.env.FINHUB_API_KEY,
      },
    });

    if (!data.c || data.c.length < 2) return 0;

    const start = data.c[0];
    const end = data.c[data.c.length - 1];
    return (((end - start) / start) * 100).toFixed(2);
  } catch (error) {
    console.error('S&P 500 fetch failed:', error.message);
    return 0;
  }
}

// exports.getPortfolioDashboard = async (req, res) => {
//   try {
//     const { portfolioId } = req.params;
//     const portfolio = await protfolio.findById(portfolioId).lean();
//     if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });

//     let totalInvested = 0;
//     let currentValue = 0;
//     const today = moment();
//     const creationDate = moment(portfolio.createdAt);
//     const monthsSinceCreated = today.diff(creationDate, 'months');

//     let mostProfitable = null;
//     let bestReturn = -Infinity;

//     const holdingResults = await Promise.all(
//       portfolio.stocks.map(async (item) => {
//         try {
//           const quote = await axios.get('https://finnhub.io/api/v1/quote', {
//             params: { symbol: item.symbol, token: process.env.FINHUB_API_KEY },
//           });

//           const olive = await Olive.findOne({ symbol: item.symbol });

//           const holdingCost = quote.data.c * item.quantity;
//           const holdingValue = quote.data.c * item.quantity;
//           const returnPct = ((holdingValue - holdingCost) / holdingCost) * 100;

//           totalInvested += holdingCost;
//           currentValue += holdingValue;

//           if (returnPct > bestReturn) {
//             mostProfitable = {
//               symbol: item.symbol,
//               openDate: portfolio.createdAt,
//               gain: returnPct.toFixed(2),
//             };
//             bestReturn = returnPct;
//           }

//           return {
//             symbol: item.symbol,
//             current: holdingValue,
//             cost: holdingCost,
//             returnPct,
//           };
//         } catch {
//           return null;
//         }
//       })
//     );

//     const filteredHoldings = holdingResults.filter(Boolean);
//     const totalReturn = (((currentValue - totalInvested) / totalInvested) * 100).toFixed(2);
//     const YTD = moment().startOf('year');

//     const oneMonthReturn = filteredHoldings.map(h => h.returnPct).reduce((acc, r) => acc + r, 0) / filteredHoldings.length;

//     const quality = await qualityStocks.find({ type: 'protfolio' });
//     const qualityReturns = await Promise.all(
//       quality.flatMap((q) => q.stocks).map(async (s) => {
//         try {
//           const quote = await axios.get('https://finnhub.io/api/v1/quote', {
//             params: { symbol: s.symbol, token: process.env.FINHUB_API_KEY },
//           });
//           const olive = await Olive.findOne({ symbol: s.symbol });
//           if (!olive || !olive.fair_value) return null;
//           return ((quote.data.c - olive.fair_value) / olive.fair_value) * 100;
//         } catch {
//           return null;
//         }
//       })
//     );

//     const averageMudarabah = (qualityReturns.filter(Boolean).reduce((a, b) => a + b, 0) / qualityReturns.length).toFixed(2);
//     const sp500Return = await getSNP500Return();

//      let stockValue = 0;

//   portfolio.stocks.forEach(stock => {
//     const quantity = stock.quantity || 0;
//     const price = stock.price || 0;
//     stockValue += quantity * price;
//   });

//   const totalValue = stockValue + (portfolio.cash || 0);

//     const transactionHistory = await Promise.all(
//       portfolio.stocks.map(async (s) => {
//         const profileRes = await axios.get(
//           `https://finnhub.io/api/v1/stock/profile2?symbol=${s.symbol}&token=${process.env.FINHUB_API_KEY}`
//         );

//         const profile = profileRes.data;

//         const currentQuote = await axios.get(
//           `https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${process.env.FINHUB_API_KEY}`
//         );

//         const currentPrice = currentQuote.data.c || 0;
//         const stockValue = s.price * s.quantity;

//         const portfolioPercentage = totalValue > 0
//           ? ((stockValue / totalValue) * 100).toFixed(2)
//           : '0.00';

//         return {
//           symbol: s.symbol,
//           companyName: profile.name,
//           logo: profile.logo,
//           sector: profile.finnhubIndustry,
//           currentPrice,
//           quantity: s.quantity,
//           holdingValue: stockValue.toFixed(2),
//           portfolioPercentage: `${portfolioPercentage}%`,
//           transactions: 1,
//           lastTransaction: 'Open',
//           date: moment(s.addedAt || portfolio.createdAt).format('ll'),
//         };
//       })
//     );

//     res.json({
//       overview: {
//         totalReturn: Number(totalReturn).toFixed(2),
//         totalReturnColor: totalReturn >= 0 ? 'green' : 'red',
//         oneMonthReturn: Number(oneMonthReturn).toFixed(2),
//         activeSince: creationDate.format('ll'),
//         riskProfile: 'Medium',
//         YTDReturn: totalReturn, // Simplified
//       },
//       rankings: {
//         successRate: '0%',
//         averageReturn: Number(totalReturn).toFixed(2),
//       },
//       mostProfitableTrade: mostProfitable,
//       returnsComparison: {
//         portfolio: totalReturn,
//         mudarabahAverage: averageMudarabah,
//         sp500: sp500Return,
//         months: monthsSinceCreated,
//       },
//       recentActivity: {
//         oneMonth: oneMonthReturn,
//         sixMonth: totalReturn,
//         twelveMonth: totalReturn,
//         ytd: totalReturn,
//         total: totalReturn,
//       },
//       transactionHistory: transactionHistory
//     });
//   } catch (err) {
//     console.error('Portfolio dashboard error:', err.message);
//     res.status(500).json({ error: 'Failed to generate portfolio dashboard' });
//   }
// };


exports.getPortfolioDashboard = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const portfolio = await protfolio.findById(portfolioId).lean();
    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });

    let totalInvested = 0;
    let currentValue = 0;
    const today = moment();
    const creationDate = moment(portfolio.createdAt);
    const monthsSinceCreated = today.diff(creationDate, 'months');

    let mostProfitable = null;
    let bestReturn = -Infinity;

    const holdingResults = await Promise.all(
      portfolio.stocks.map(async (item) => {
        try {
          const quote = await axios.get('https://finnhub.io/api/v1/quote', {
            params: { symbol: item.symbol, token: process.env.FINHUB_API_KEY },
          });

          const holdingCost = item.price * item.quantity;
          const holdingValue = quote.data.c * item.quantity;
          const returnPct = ((holdingValue - holdingCost) / holdingCost) * 100;

          totalInvested += holdingCost;
          currentValue += holdingValue;

          if (returnPct > bestReturn) {
            mostProfitable = {
              symbol: item.symbol,
              openDate: portfolio.createdAt,
              gain: returnPct.toFixed(2),
            };
            bestReturn = returnPct;
          }

          return {
            symbol: item.symbol,
            current: holdingValue,
            cost: holdingCost,
            returnPct,
          };
        } catch {
          return null;
        }
      })
    );

    const filteredHoldings = holdingResults.filter(Boolean);
    const totalReturn = (((currentValue - totalInvested) / totalInvested) * 100).toFixed(2);

    const oneMonthReturn = filteredHoldings.length > 0
      ? (filteredHoldings.reduce((acc, h) => acc + h.returnPct, 0) / filteredHoldings.length).toFixed(2)
      : '0.00';

    let stockValue = 0;
    portfolio.stocks.forEach(stock => {
      stockValue += (stock.quantity || 0) * (stock.price || 0);
    });
    const totalValue = stockValue + (portfolio.cash || 0);

    const transactionHistory = await Promise.all(
      portfolio.stocks.map(async (s) => {
        const profileRes = await axios.get(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${s.symbol}&token=${process.env.FINHUB_API_KEY}`
        );

        const profile = profileRes.data;

        const currentQuote = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${process.env.FINHUB_API_KEY}`
        );

        const currentPrice = currentQuote.data.c || 0;
        const stockVal = s.price * s.quantity;
        const portfolioPercentage = totalValue > 0 ? ((stockVal / totalValue) * 100).toFixed(2) : '0.00';

        return {
          symbol: s.symbol,
          companyName: profile.name,
          logo: profile.logo,
          sector: profile.finnhubIndustry,
          currentPrice,
          quantity: s.quantity,
          holdingValue: stockVal.toFixed(2),
          portfolioPercentage: `${portfolioPercentage}%`,
          transactions: 1,
          lastTransaction: 'Open',
          date: moment(s.addedAt || portfolio.createdAt).format('ll'),
        };
      })
    );

    const generateMonthlyComparison = async () => {
      const months = [];
      const now = moment().startOf('month');

      for (let i = 5; i >= 0; i--) {
        const monthStart = now.clone().subtract(i, 'months').startOf('month').unix();
        const monthEnd = now.clone().subtract(i, 'months').endOf('month').unix();
        const label = now.clone().subtract(i, 'months').format('MMM YYYY');

        let portfolioStartValue = 0;
        let portfolioEndValue = 0;
        let mudarabahStart = 0;
        let mudarabahEnd = 0;
        let mudarabahCount = 0;

        for (const stock of portfolio.stocks) {
          try {
            const candle = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
              params: {
                symbol: stock.symbol,
                resolution: 'D',
                from: monthStart,
                to: monthEnd,
                token: process.env.FINHUB_API_KEY,
              },
            });
            const c = candle.data.c;
            if (!c || c.length < 2) continue;
            portfolioStartValue += c[0] * stock.quantity;
            portfolioEndValue += c[c.length - 1] * stock.quantity;
          } catch {}
        }

        const quality = await qualityStocks.find({ type: 'protfolio' });
        for (const s of quality.flatMap(q => q.stocks)) {
          try {
            const candle = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
              params: {
                symbol: s.symbol,
                resolution: 'D',
                from: monthStart,
                to: monthEnd,
                token: process.env.FINHUB_API_KEY,
              },
            });
            const c = candle.data.c;
            if (!c || c.length < 2) continue;
            mudarabahStart += c[0];
            mudarabahEnd += c[c.length - 1];
            mudarabahCount++;
          } catch {}
        }

        let spStart = 0, spEnd = 0;
        try {
          const spCandle = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
            params: {
              symbol: '^GSPC',
              resolution: 'D',
              from: monthStart,
              to: monthEnd,
              token: process.env.FINHUB_API_KEY,
            },
          });
          const spClose = spCandle.data.c;
          if (spClose && spClose.length >= 2) {
            spStart = spClose[0];
            spEnd = spClose[spClose.length - 1];
          }
        } catch {}

        const monthlyReturn = portfolioStartValue > 0
          ? ((portfolioEndValue - portfolioStartValue) / portfolioStartValue) * 100
          : 0;
        const mudarabahReturn = mudarabahStart > 0
          ? ((mudarabahEnd - mudarabahStart) / mudarabahStart) * 100
          : 0;
        const sp500Return = spStart > 0
          ? ((spEnd - spStart) / spStart) * 100
          : 0;

        months.push({
          month: label,
          portfolio: Number(monthlyReturn.toFixed(2)),
          mudarabahAverage: Number(mudarabahReturn.toFixed(2)),
          sp500: Number(sp500Return.toFixed(2)),
        });
      }
      return months;
    };

    const returnsComparison = await generateMonthlyComparison();

    res.json({
      overview: {
        totalReturn: Number(totalReturn).toFixed(2),
        totalReturnColor: totalReturn >= 0 ? 'green' : 'red',
        oneMonthReturn: Number(oneMonthReturn).toFixed(2),
        activeSince: creationDate.format('ll'),
        riskProfile: 'Medium',
        YTDReturn: totalReturn,
      },
      rankings: {
        successRate: '0%',
        averageReturn: Number(totalReturn).toFixed(2),
      },
      mostProfitableTrade: mostProfitable,
      returnsComparison,
      recentActivity: {
        oneMonth: oneMonthReturn,
        sixMonth: totalReturn,
        twelveMonth: totalReturn,
        ytd: totalReturn,
        total: totalReturn,
      },
      transactionHistory
    });
  } catch (err) {
    console.error('Portfolio dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to generate portfolio dashboard' });
  }
};


const getStockMeta = async (symbol) => {
  try {
    const [profile, quote, recommendation, olive] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
      Olive.findOne({ symbol: symbol }).exec()
    ]);
    const quadrant = olive
      ? olive.financial_health === "good" && olive.compatitive_advantage === "good"
        ? 'Olive Green'
        : olive.financial_health === "good"
          ? 'Lime Green'
          : olive.compatitive_advantage === "good"
            ? 'Orange'
            : 'Yellow'
      : 'Unknown';

    const olives = {
      financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
      competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
      valuation: quote.c <= olive?.fair_value ? 'green' : 'gray',
    };

    const data = {
      symbol,
      name: profile.data.name,
      logo: profile.data.logo,
      sector: profile.data.finnhubIndustry,
      marketCap: profile.data.marketCapitalization,
      change: quote.data.dp, // percent change
      currentPrice: quote.data.c,
      consensus: recommendation.data?.[0]?.consensus || 'N/A',
      olives
    };
    return data;
  } catch (err) {
    console.error(`Error fetching data for ${symbol}:`, err.message);
    return null;
  }
};

// Add to watchlist
exports.addToWatchList = async (req, res) => {
  const user = req.user._id;
  const { symbol } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  let watchlist = await WatchList.findOne({ user });

  if (!watchlist) {
    watchlist = await WatchList.create({ user, stocks: [{ symbol }] });
  } else {
    const alreadyAdded = watchlist.stocks.find((stock) => stock.symbol === symbol);
    if (alreadyAdded) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }
    watchlist.stocks.push({ symbol });
    await watchlist.save();
  }

  res.status(200).json({ success: true, message: 'Added to watchlist' });
};

// Remove from watchlist
exports.removeFromWatchList = async (req, res) => {
  const user = req.user._id;
  const { symbol } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  const watchlist = await WatchList.findOne({ user });
  if (!watchlist) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }

  watchlist.stocks = watchlist.stocks.filter((s) => s.symbol !== symbol);
  await watchlist.save();

  res.status(200).json({ success: true, message: 'Removed from watchlist' });
};

// Fetch watchlist with live data
exports.getWatchList = async (req, res) => {
  const user = req.user._id;

  const watchlist = await WatchList.findOne({ user });
  if (!watchlist || watchlist.stocks.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  const enriched = await Promise.all(
    watchlist.stocks.map((s) => getStockMeta(s.symbol))
  );

  const filtered = enriched.filter(Boolean); // Remove failed lookups
  res.status(200).json({ success: true, data: filtered });
};