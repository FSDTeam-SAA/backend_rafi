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
const { sendSubscribeMessage } = require('../utils/finnhubSocket');
// const { finnhubSocket } = require('../app');

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


// exports.getPortfolioOverview = async (req, res) => {
//   try {
//     const { id } = req.body;

//     const portfolio = await Protfolio.findById(id);
//     if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

//     const today = moment().unix();
//     const thirtyDaysAgo = moment().subtract(30, 'days').unix();

//     let totalValue = 0, dailyChange = 0, startValue = 0;

//     const detailed = await Promise.all(
//       portfolio.stocks.map(async (holding) => {
//         try {
//           const [companyProfile, quote, candleData, olive] = await Promise.all([
//             new Promise((resolve) =>
//               finnhubClient.companyProfile2({ symbol: holding.symbol }, (err, data) =>
//                 resolve(err ? {} : data)
//               )
//             ),
//             new Promise((resolve, reject) =>
//               finnhubClient.quote(holding.symbol, (err, data) =>
//                 err || !data?.c ? reject(err || new Error('Invalid quote')) : resolve(data)
//               )
//             ),
//             new Promise((resolve) =>
//               finnhubClient.stockCandles(
//                 holding.symbol,
//                 'D',
//                 thirtyDaysAgo,
//                 today,
//                 (err, data) => resolve(err || data.s !== 'ok' ? {} : data)
//               )
//             ),
//             Olive.findOne({ symbol: holding.symbol }).exec()
//           ]);

//           const quadrant = olive
//             ? olive.financial_health === "good" && olive.compatitive_advantage === "good"
//               ? 'Olive Green'
//               : olive.financial_health === "good"
//                 ? 'Lime Green'
//                 : olive.compatitive_advantage === "good"
//                   ? 'Orange'
//                   : 'Yellow'
//             : 'Unknown';

//           const olives = {
//             financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
//             competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
//             valuation: quote.c <= olive?.fair_value ? 'green' : 'gray',
//           };

//           const currentValue = quote.c * holding.quantity;
//           const currentChange = quote.d * holding.quantity;
//           const gainLossPercent = ((quote.c - holding.price) / holding.price) * 100;

//           totalValue += currentValue;
//           dailyChange += currentChange;

//           let oneMonthReturn = '0.00%';
//           if (candleData?.c && candleData.c.length) {
//             const priceThen = candleData.c[0]; // closing price 30 days ago
//             const holdingReturn = ((quote.c - priceThen) / priceThen) * 100;
//             startValue += priceThen * holding.quantity;
//             oneMonthReturn = `${holdingReturn.toFixed(2)}%`;
//           }

//           return {
//             logo: companyProfile.logo || '',
//             name: companyProfile.name || '',
//             symbol: holding.symbol,
//             shares: holding.quantity,
//             holdingPrice: holding.price,
//             holdingGain: gainLossPercent,
//             price: quote.c,
//             change: quote.d,
//             percent: quote.dp,
//             value: currentValue.toFixed(2),
//             olives,
//             quadrant,
//             oneMonthReturn
//           };
//         } catch (err) {
//           console.warn(`Skipping ${holding.symbol}:`, err.message);
//           return null;
//         }
//       })
//     );

//     const filteredHoldings = detailed.filter(Boolean);
//     const cash = portfolio.cash || 0;
//     const monthlyReturn =
//       startValue > 0 ? (((totalValue - startValue) / startValue) * 100).toFixed(2) : '0.00';

//     res.status(200).json({
//       totalHoldings: totalValue.toFixed(2),
//       cash,
//       totalValueWithCash: (totalValue + cash).toFixed(2),
//       dailyReturn: dailyChange.toFixed(2),
//       dailyReturnPercent: ((dailyChange / totalValue) * 100).toFixed(2),
//       monthlyReturnPercent: monthlyReturn,
//       holdings: filteredHoldings
//     });
//   } catch (err) {
//     console.error("Portfolio overview error:", err);
//     res.status(500).json({ error: "Portfolio overview failed", detail: err.message });
//   }
// };


// exports.getPortfolioOverview = async (req, res) => {
//   try {
//     const { id } = req.body;

//     const portfolio = await Protfolio.findById(id);
//     if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });
//     // console.log( portfolio );

//     const today = moment().unix();
//     const thirtyDaysAgo = moment().subtract(30, 'days').unix();

//     let totalValue = 0, dailyChange = 0, startValue = 0;
//     let totalInvested = 0;
//     let totalRealizedEarnings = 0;

//     const detailed = await Promise.all(
//       portfolio.stocks.map(async (holding) => {
//         try {
//           //  console.log( holding)
//           // Calculate net quantity and average buy price
//           let netQuantity = 0;
//           let totalCost = 0;

//           // holding.transection.forEach(tx => {
//           //   console.log(tx.event)
//           //   if (tx.event === 'buy') {
//           //     netQuantity += tx.quantity;
//           //     totalCost += tx.price * tx.quantity;
//           //   } else if (tx.event === 'sell') {
//           //     netQuantity -= tx.quantity;
//           //     // Optional: remove from cost basis if you want weighted average
//           //   }
//           // });

//           holding.transection.forEach(tx => {
//             if (tx.event === 'buy') {
//               netQuantity += tx.quantity;
//               totalCost += tx.price * tx.quantity;
//               totalInvested += tx.price * tx.quantity; // track total invested
//             } else if (tx.event === 'sell') {
//               netQuantity -= tx.quantity;
//               totalRealizedEarnings += tx.price * tx.quantity; // track realized earnings
//             }
//           });


//           // console.log( netQuantity );

//           // if (netQuantity <= 0) return null; // skip fully sold stocks

//           const avgBuyPrice = totalCost / netQuantity;


//           const [companyProfile, quote, candleData, olive, priceTarget] = await Promise.all([
//             new Promise((resolve) =>
//               finnhubClient.companyProfile2({ symbol: holding.symbol }, (err, data) =>
//                 resolve(err ? {} : data)
//               )
//             ),
//             new Promise((resolve, reject) =>
//               finnhubClient.quote(holding.symbol, (err, data) =>
//                 err || !data?.c ? reject(err || new Error('Invalid quote')) : resolve(data)
//               )
//             ),
//             new Promise((resolve) =>
//               finnhubClient.stockCandles(
//                 holding.symbol,
//                 'D',
//                 thirtyDaysAgo,
//                 today,
//                 (err, data) => resolve(err || data.s !== 'ok' ? {} : data)
//               )
//             ),
//             Olive.findOne({ symbol: holding.symbol }).exec(),
//             new Promise((resolve) =>
//               finnhubClient.priceTarget(holding.symbol, (err, data) =>
//                 resolve(err ? {} : data)
//               )
//             ),
//           ]);

//           const quadrant = olive
//             ? olive.financial_health === "good" && olive.compatitive_advantage === "good"
//               ? 'Olive Green'
//               : olive.financial_health === "good"
//                 ? 'Lime Green'
//                 : olive.compatitive_advantage === "good"
//                   ? 'Orange'
//                   : 'Yellow'
//             : 'Unknown';

//           const olives = {
//             financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
//             competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
//             valuation: quote.c <= olive?.fair_value ? 'green' : 'gray',
//           };

//           const currentValue = quote.c * netQuantity;
//           const currentChange = quote.d * netQuantity;
//           const gainLossPercent = ((quote.c - avgBuyPrice) / avgBuyPrice) * 100;

//           totalValue += currentValue;
//           dailyChange += currentChange;

//           let oneMonthReturn = '0.00%';
//           if (candleData?.c && candleData.c.length) {
//             const priceThen = candleData.c[0]; // price 30 days ago
//             const holdingReturn = ((quote.c - priceThen) / priceThen) * 100;
//             startValue += priceThen * netQuantity;
//             oneMonthReturn = `${holdingReturn.toFixed(2)}%`;
//           }

//           return {
//             logo: companyProfile.logo || '',
//             name: companyProfile.name || '',
//             symbol: holding.symbol,
//             shares: netQuantity,
//             avgBuyPrice,
//             costBasis: avgBuyPrice * netQuantity,
//             holdingPrice: avgBuyPrice.toFixed(2),
//             holdingGain: gainLossPercent.toFixed(2),
//             price: quote.c,
//             change: quote.d,
//             percent: quote.dp,
//             value: currentValue.toFixed(2),
//             unrealized: currentValue.toFixed(2) - (avgBuyPrice * netQuantity),
//             pL: ((currentValue.toFixed(2) - (avgBuyPrice * netQuantity)) / (avgBuyPrice * netQuantity)) * 100,
//             olives,
//             quadrant: olive?.fair_value,
//             oneMonthReturn,
//             priceTarget: {
//               high: priceTarget.targetHigh || null,
//               low: priceTarget.targetLow || null,
//               mean: priceTarget.targetMean || null
//             }
//           };
//         } catch (err) {
//           console.warn(`Skipping ${holding.symbol}:`, err.message);
//           return null;
//         }
//       })
//     );

//     const filteredHoldings = detailed.filter(Boolean);
//     const cash = portfolio.cash || 0;
//     const monthlyReturn =
//       startValue > 0 ? (((totalValue - startValue) / startValue) * 100).toFixed(2) : '0.00';
//     const unrealizedGains = totalValue - (totalInvested - totalRealizedEarnings);
//     const overallReturn = totalInvested > 0
//       ? ((totalRealizedEarnings + unrealizedGains) / totalInvested) * 100
//       : 0;

//     res.status(200).json({
//       totalHoldings: totalValue.toFixed(2),
//       cash,
//       totalValueWithCash: (totalValue + cash).toFixed(2),
//       dailyReturn: dailyChange.toFixed(2),
//       dailyReturnPercent: ((dailyChange / totalValue) * 100).toFixed(2),
//       monthlyReturnPercent: monthlyReturn,
//       holdings: filteredHoldings,
//       unrealizedGains: unrealizedGains.toFixed(2),
//       overallReturnPercent: overallReturn.toFixed(2),
//     });
//   } catch (err) {
//     console.error("Portfolio overview error:", err);
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
    const todayStart = moment().startOf('day').unix(); // for pre-market candles

    let totalValue = 0, dailyChange = 0, startValue = 0;
    let totalInvested = 0;
    let totalRealizedEarnings = 0;

    const detailed = await Promise.all(
      portfolio.stocks.map(async (holding) => {
        try {
          let netQuantity = 0;
          let totalCost = 0;

          holding.transection.forEach(tx => {
            if (tx.event === 'buy') {
              netQuantity += tx.quantity;
              totalCost += tx.price * tx.quantity;
              totalInvested += tx.price * tx.quantity;
            } else if (tx.event === 'sell') {
              netQuantity -= tx.quantity;
              totalRealizedEarnings += tx.price * tx.quantity;
            }
          });

          // if (netQuantity <= 0) return null;
          const avgBuyPrice = totalCost / netQuantity;

          const [companyProfile, quote, candleData, olive, priceTarget, preMarketCandles] = await Promise.all([
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
            Olive.findOne({ symbol: holding.symbol }).exec(),
            new Promise((resolve) =>
              finnhubClient.priceTarget(holding.symbol, (err, data) =>
                resolve(err ? {} : data)
              )
            ),
            new Promise((resolve) =>
              finnhubClient.stockCandles(
                holding.symbol,
                '1', // 1-minute resolution
                todayStart,
                today,
                (err, data) => resolve(err || data.s !== 'ok' ? {} : data)
              )
            ),
          ]);

          // const preMarketPrice = preMarketCandles?.c?.length ? preMarketCandles.c[0] : null;
          const preMarketPrice = preMarketCandles?.c?.length ? preMarketCandles.c[0] : null;
          const previousClose = quote?.pc || null;

          let preMarketChangePercent = null;
          if (preMarketPrice && previousClose) {
            preMarketChangePercent = ((preMarketPrice - previousClose) / previousClose) * 100;
          }

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

          const currentValue = quote.c * netQuantity;
          const currentChange = quote.d * netQuantity;
          const gainLossPercent = ((quote.c - avgBuyPrice) / avgBuyPrice) * 100;

          totalValue += currentValue;
          dailyChange += currentChange;

          let oneMonthReturn = '0.00%';
          if (candleData?.c && candleData.c.length) {
            const priceThen = candleData.c[0];
            const holdingReturn = ((quote.c - priceThen) / priceThen) * 100;
            startValue += priceThen * netQuantity;
            oneMonthReturn = `${holdingReturn.toFixed(2)}%`;
          }

          return {
            logo: companyProfile.logo || '',
            name: companyProfile.name || '',
            symbol: holding.symbol,
            shares: netQuantity,
            avgBuyPrice : avgBuyPrice || 0,
            costBasis: avgBuyPrice * netQuantity || 0,
            holdingPrice: parseFloat(avgBuyPrice) || 0,
            holdingGain: parseFloat(gainLossPercent) || 0,
            price: quote.c,
            preMarketPrice: parseFloat(preMarketPrice) || 0,
            preMarketChangePercent: parseFloat(preMarketChangePercent) ? parseFloat(preMarketChangePercent.toFixed(2)) : 0,
            change: quote.d,
            percent: quote.dp ,
            value: currentValue || 0,
            unrealized: (currentValue - avgBuyPrice * netQuantity) || 0,
            pL: (((currentValue - avgBuyPrice * netQuantity) / (avgBuyPrice * netQuantity)) * 100) || 0,
            olives,
            quadrant: olive?.fair_value,
            oneMonthReturn,
            priceTarget: {
              high: priceTarget.targetHigh || 0,
              low: priceTarget.targetLow || 0,
              mean: priceTarget.targetMean || 0
            }
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
    const unrealizedGains = totalValue - (totalInvested - totalRealizedEarnings);
    const overallReturn = totalInvested > 0
      ? ((totalRealizedEarnings + unrealizedGains) / totalInvested) * 100
      : 0;

    res.status(200).json({
      totalHoldings: Number(totalValue.toFixed(2)) || 0,
      cash,
      totalValueWithCash: Number((totalValue + cash).toFixed(2)) || 0,
      dailyReturn: Number(dailyChange.toFixed(2)) || 0,
      dailyReturnPercent: Number(((dailyChange / totalValue) * 100).toFixed(2)) || 0,
      monthlyReturnPercent: Number(monthlyReturn),
      holdings: filteredHoldings,
      unrealizedGains: Number(unrealizedGains.toFixed(2)) || 0,
      overallReturnPercent: Number(overallReturn.toFixed(2)) || 0,
    });
  } catch (err) {
    console.error("Portfolio overview error:", err);
    res.status(500).json({ error: "Portfolio overview failed", detail: err.message });
  }
};


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

exports.getTopMovers = async (req, res) => {
  const symbols = req.body.symbols;

  try {
    const results = await getQuotes(symbols);

    // Filter valid quotes with numeric dp
    const validQuotes = results.filter(q => typeof q.dp === 'number' && !isNaN(q.dp));

    // Separate gainers and losers
    const gainers = validQuotes.filter(q => q.dp > 0).sort((a, b) => b.dp - a.dp);
    const losers = validQuotes.filter(q => q.dp < 0).sort((a, b) => a.dp - b.dp); // more negative first

    res.status(200).json({
      topGainers: gainers.slice(0, 3),
      topLosers: losers.slice(0, 3)
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
// exports.getAssetAllocation = async (req, res) => {
//   const { symbols } = req.body;
//   try {
//     const allocation = await Promise.all(
//       symbols.map(async (symbol) => {
//         const profile = await new Promise((resolve, reject) => {
//           finnhubClient.companyProfile2({ symbol }, (error, data) => {
//             if (error) reject(error);
//             else resolve(data);
//           });
//         });

//         return {
//           symbol,
//           sector: profile.finnhubIndustry,
//           country: profile.country,
//         };
//       })
//     );
//     res.json({ allocation });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: 'Error fetching asset allocation' });
//   }
// };

exports.getAssetAllocation = async (req, res) => {
  try {
    const { portfolioId } = req.query;
    if (!portfolioId) {
      return res.status(400).json({ error: "Portfolio ID is required" });
    }

    const portfolio = await Protfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const FINNHUB_TOKEN = process.env.FINHUB_API_KEY;
    const holdings = portfolio.stocks;
    const symbols = holdings.map(s => s.symbol);

    let totalStockValue = 0;
    const sectorBreakdown = {};
    const detailedStats = [];

    for (const stock of holdings) {
      const symbol = stock.symbol;

      const [profileRes, quoteRes, metricRes] = await Promise.all([
        axios.get('https://finnhub.io/api/v1/stock/profile2', {
          params: { symbol, token: FINNHUB_TOKEN }
        }),
        axios.get('https://finnhub.io/api/v1/quote', {
          params: { symbol, token: FINNHUB_TOKEN }
        }),
        axios.get('https://finnhub.io/api/v1/stock/metric', {
          params: { symbol, metric: 'all', token: FINNHUB_TOKEN }
        })
      ]);

      const profile = profileRes.data;
      const quote = quoteRes.data;
      const metrics = metricRes.data.metric;

      const currentValue = quote.c * stock.quantity;
      totalStockValue += currentValue;

      // Sector calculation
      const sector = profile.finnhubIndustry || 'Unknown';
      sectorBreakdown[sector] = (sectorBreakdown[sector] || 0) + currentValue;

      detailedStats.push({
        symbol,
        name: profile.name,
        sector,
        currentValue,
        beta: metrics.beta || 0,
        peRatio: metrics.peBasicExclExtraTTM || 0,
        dividendYield: metrics.dividendYieldIndicatedAnnual || 0,
        warning: (metrics.evToEbitda || 0) > 25 || (metrics.peBasicExclExtraTTM || 0) > 40
      });
    }

    const cash = portfolio.cash || 0;
    const totalValue = totalStockValue + cash;

    // Asset Allocation: Only Stocks and Cash
    const assetAllocation = {
      stocks: ((totalStockValue / totalValue) * 100) || 0,
      cash: ((cash / totalValue) * 100) || 0
    };

    // Sector chart breakdown
    const holdingsBySector = Object.entries(sectorBreakdown).map(([sector, value]) => ({
      sector,
      percent: ((value / totalStockValue) * 100) || 0
    }));

    // Portfolio-level metrics
    const totalBeta = detailedStats.reduce((sum, s) => sum + s.beta, 0);
    const totalPE = detailedStats.reduce((sum, s) => sum + s.peRatio, 0);
    const totalDiv = detailedStats.reduce((sum, s) => sum + s.dividendYield, 0);
    const warnings = detailedStats.filter(s => s.warning);

    const metrics = {
      beta: (totalBeta / detailedStats.length).toFixed(2),
      peRatio: (totalPE / detailedStats.length).toFixed(2),
      dividendYield: (totalDiv / detailedStats.length).toFixed(2),
      warnings: warnings.map(w => ({
        symbol: w.symbol,
        name: w.name
      }))
    };

    return res.status(200).json({
      assetAllocation,
      holdingsBySector,
      metrics
    });

  } catch (err) {
    console.error("Error in getPortfolioMetrics:", err.message);
    res.status(500).json({ error: "Failed to load portfolio metrics", detail: err.message });
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
exports.deleteProtfolio = async (req, res) => {
  const portfolioId = req.params.id;
  const _portfolio = await Protfolio.findByIdAndDelete(portfolioId);
  res.status(201).send({
    message: 'Portfolio Delete successfully',
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

// exports.addStockProtfolio = async (req, res) => {
//   const { portfolioId, symbol, quantity, price, symbols } = req.body;

//   const portfolio = await Protfolio.findById(portfolioId);
//   if (!portfolio) {
//     return res.status(404).send({ message: 'Portfolio not found' });
//   }

//   if (symbols && Array.isArray(symbols) && symbols.length > 0) {
//     // Batch add mode
//     symbols.forEach((sym) => {
//       const exists = portfolio.stocks.find((s) => s.symbol === sym.symbol);
//       if (!exists) {
//         portfolio.stocks.push({ symbol: sym.symbol, quantity: 1, price: sym.price });
//       }
//     });

//     await portfolio.save();
//     return res.status(201).send({
//       message: 'Symbols added to portfolio',
//       portfolio,
//     });
//   }

//   if (!symbol) {
//     return res.status(400).send({ message: 'Symbol is required for single stock add/update' });
//   }

//   const stockIndex = portfolio.stocks.findIndex((stock) => stock.symbol === symbol);

//   if (stockIndex !== -1) {
//     portfolio.stocks[stockIndex].quantity = quantity;
//     if (price !== undefined) portfolio.stocks[stockIndex].price = price;
//   } else {
//     portfolio.stocks.push({ symbol, quantity, price });
//   }

//   await portfolio.save();

//   res.status(201).send({
//     message: stockIndex !== -1 ? 'Stock quantity updated' : 'Stock added to portfolio',
//     portfolio,
//   });
// };

exports.addStockProtfolio = async (req, res) => {
  const { portfolioId, symbol, quantity, price, symbols, event, date } = req.body;

  const portfolio = await Protfolio.findById(portfolioId);
  if (!portfolio) {
    return res.status(404).send({ message: 'Portfolio not found' });
  }

  if (symbols && Array.isArray(symbols) && symbols.length > 0) {
    // Batch add mode
    symbols.forEach((sym) => {
      // console.log( sym)
      const exists = portfolio.stocks.find((s) => s.symbol === sym.symbol);
      const transactionEntry = {
        event: sym.event,
        quantity: sym.quantity,
        price: sym.price,
        date: sym.date
      };
      // console.log("ffddf")

      if (!exists) {
        portfolio.stocks.push({
          symbol: sym.symbol,
          quantity: sym.quantity,
          price: sym.price,
          transection: [transactionEntry],
        });
      } else {
        exists.quantity ? exists.quantity += sym.quantity : exists.quantity = sym.quantity;
        // exists.price = sym.price;
        exists.transection.push(transactionEntry);
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

  const stock = portfolio.stocks.find((s) => s.symbol === symbol);
  const transactionEntry = {
    event: event,
    quantity,
    price,
    date
  };

  if (stock) {
    if (event == 'buy') stock.quantity += quantity;
    else if (event == 'sell') stock.quantity -= quantity;

    // if (price !== undefined) stock.price = price;
    stock.transection.push(transactionEntry);
  } else {
    portfolio.stocks.push({
      symbol,
      quantity,
      price,
      transection: [transactionEntry],
    });
  }

  await portfolio.save();

  res.status(201).send({
    message: stock ? 'Stock updated with transaction' : 'New stock added with transaction',
    portfolio,
  });
};


// exports.deleteStockFromPortfolio = async (req, res) => {
//   const { portfolioId, symbol } = req.body;

//   const portfolio = await Protfolio.findById(portfolioId);
//   if (!portfolio) {
//     return res.status(404).send({ message: 'Portfolio not found' });
//   }

//   const stockIndex = portfolio.stocks.findIndex(s => s.symbol === symbol);
//   if (stockIndex === -1) {
//     return res.status(404).send({ message: 'Stock not found in portfolio' });
//   }

//   portfolio.stocks.splice(stockIndex, 1); // remove the stock
//   await portfolio.save();

//   res.status(200).send({
//     message: 'Stock removed from portfolio',
//     portfolio,
//   });
// };


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

exports.deleteTransaction = async (req, res) => {
  const { portfolioId, symbol, transactionId } = req.body;

  const portfolio = await Protfolio.findById(portfolioId);
  if (!portfolio) {
    return res.status(404).json({ message: 'Portfolio not found' });
  }

  const stock = portfolio.stocks.find(s => s.symbol === symbol);
  if (!stock) {
    return res.status(404).json({ message: 'Stock not found in portfolio' });
  }

  const exists = stock.transection.some(t => t._id.toString() === transactionId);
  if (!exists) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  // ✅ Remove the transaction by filtering it out
  stock.transection = stock.transection.filter(
    t => t._id.toString() !== transactionId
  );
  // console.log(stock.transection)

  // ✅ Recalculate quantity
  stock.quantity = stock.transection.reduce((sum, t) => {
    return t.event === 'buy' ? sum + t.quantity : sum - t.quantity;
  }, 0);

  await portfolio.save();

  return res.status(200).json({
    message: 'Transaction deleted successfully',
    updatedStock: stock,
  });
};


// exports.getCalendarEvents = async (req, res) => {
//   try {
//     const from = moment().format('YYYY-MM-DD');
//     const to = moment().add(3, 'months').format('YYYY-MM-DD');

//     const [earningsRes, dividendsRes] = await Promise.all([
//       axios.get('https://finnhub.io/api/v1/calendar/earnings', {
//         params: { from, to, token: process.env.FINHUB_API_KEY }
//       }),
//       axios.get('https://finnhub.io/api/v1/calendar/dividends', {
//         params: { from, to, token: process.env.FINHUB_API_KEY }
//       })
//     ]);

//     const earnings = earningsRes.data.earningsCalendar || [];
//     const dividends = dividendsRes.data.dividends || [];

//     const formatEvent = (e, type) => ({

//       symbol: e.symbol,
//       type,
//       date: e.date || e.exDate
//     });

//     const events = [
//       ...earnings.map(e => formatEvent(e, 'Earnings Release')),
//       ...dividends.map(e => formatEvent(e, 'Ex-Dividend Date'))
//     ];

//     events.sort((a, b) => new Date(a.date) - new Date(b.date));

//     res.json({ total: events.length, events });
//   } catch (err) {
//     console.error('Error fetching calendar events:', err.message);
//     res.status(500).json({ error: 'Failed to fetch calendar events' });
//   }
// };


// Helper to get S&P 500 index change over a period


exports.getCalendarEvents = async (req, res) => {
  try {
    let { portfolioId, from, to } = req.query;

    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    const portfolio = await Protfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const symbolsInPortfolio = portfolio.stocks.map((s) => s.symbol);
    // console.log(symbolsInPortfolio);
    if (!from && !to) {
      from = moment().format('YYYY-MM-DD');
      to = moment().add(3, 'months').format('YYYY-MM-DD');
    }


    // console.log(from, "dfcdsfc", to);

    const [earningsRes, dividendsRes] = await Promise.all([
      axios.get('https://finnhub.io/api/v1/calendar/earnings', {
        params: { from, to, token: process.env.FINHUB_API_KEY }
      }),
      axios.get('https://finnhub.io/api/v1/calendar/dividends', {
        params: { from, to, token: process.env.FINHUB_API_KEY }
      })
    ]);


    const earnings = (earningsRes.data.earningsCalendar || []).filter(e =>
      symbolsInPortfolio.includes(e.symbol)
    );

    const dividends = (dividendsRes.data.dividends || []).filter(d =>
      symbolsInPortfolio.includes(d.symbol)
    );
    // console.log( earningsRes.data.earningsCalendar);

    const formatEvent = (e, type) => ({
      symbol: e.symbol,
      type,
      date: e.date || e.exDate
    });

    const events = [
      ...earnings.map(e => formatEvent(e, 'Earnings Release')),
      ...dividends.map(d => formatEvent(d, 'Ex-Dividend Date')),
    ];

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ total: events.length, events });
  } catch (err) {
    console.error('Error fetching calendar events:', err.message);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};



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
              gain: returnPct  || 0,
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
    const totalReturn = (((currentValue - totalInvested) / totalInvested) * 100) || 0;

    const oneMonthReturn = filteredHoldings.length > 0
      ? (filteredHoldings.reduce((acc, h) => acc + h.returnPct, 0) / filteredHoldings.length)
      : 0.00;

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
        const portfolioPercentage = totalValue > 0 ? ((stockVal / totalValue) * 100) : 0.00;

        const monthlyGains = {};

        if (s.transection && s.transection.length) {
          s.transection.forEach((t) => {
            const monthKey = moment(t.date).format('MMM YYYY');
            if (!monthlyGains[monthKey]) {
              monthlyGains[monthKey] = { buy: 0, sell: 0 };
            }
            if (t.event === 'buy') {
              monthlyGains[monthKey].buy += t.price * t.quantity;
            } else if (t.event === 'sell') {
              monthlyGains[monthKey].sell += t.price * t.quantity;
            }
          });
        }

        let totalBuy = 0;
        let totalSell = 0;

        Object.values(monthlyGains).forEach(({ buy, sell }) => {
          totalBuy += buy;
          totalSell += sell;
        });

        const netGain = totalSell - totalBuy;
        const gainPercent = totalBuy > 0 ? ((netGain / totalBuy) * 100) : 0.00;

        return {
          symbol: s.symbol,
          companyName: profile.name,
          logo: profile.logo,
          sector: profile.finnhubIndustry,
          currentPrice,
          quantity: s.quantity,
          holdingValue: stockVal || 0,
          portfolioPercentage: `${portfolioPercentage}%`,
          transactions: (s.transection?.length - 1) || 0,
          alltransection: s.transection,
          lastTransaction: s.transection?.slice(-1)[0]?.event || 'Open',
          date: moment(s.addedAt || portfolio.createdAt).format('ll'),
          monthlyGains: gainPercent
        };
      })
    );

    // const generateMonthlyComparison = async () => {
    //   const months = [];
    //   const now = moment().startOf('month');

    //   for (let i = 0; i <= 5; i++) {
    //     const monthStart = now.clone().subtract(i, 'months').startOf('month').unix();
    //     const monthEnd = now.clone().subtract(i, 'months').endOf('month').unix();
    //     const label = now.clone().subtract(i, 'months').format('MMM YYYY');

    //     let portfolioStartValue = 0;
    //     let portfolioEndValue = 0;
    //     let mudarabahStart = 0;
    //     let mudarabahEnd = 0;
    //     let mudarabahCount = 0;

    //     for (const stock of portfolio.stocks) {
    //       try {
    //         const candle = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
    //           params: {
    //             symbol: stock.symbol,
    //             resolution: 'D',
    //             from: monthStart,
    //             to: monthEnd,
    //             token: process.env.FINHUB_API_KEY,
    //           },
    //         });
    //         const c = candle.data.c;
    //         if (!c || c.length < 2) continue;
    //         portfolioStartValue += c[0] * stock.quantity;
    //         portfolioEndValue += c[c.length - 1] * stock.quantity;
    //       } catch { }
    //     }

    //     const quality = await qualityStocks.find({ type: 'protfolio' });
    //     for (const s of quality.flatMap(q => q.stocks)) {
    //       try {
    //         const candle = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
    //           params: {
    //             symbol: s.symbol,
    //             resolution: 'D',
    //             from: monthStart,
    //             to: monthEnd,
    //             token: process.env.FINHUB_API_KEY,
    //           },
    //         });
    //         const c = candle.data.c;
    //         if (!c || c.length < 2) continue;
    //         mudarabahStart += c[0];
    //         mudarabahEnd += c[c.length - 1];
    //         mudarabahCount++;
    //       } catch { }
    //     }

    //     let spStart = 0, spEnd = 0;
    //     try {
    //       const spCandle = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
    //         params: {
    //           symbol: '^GSPC',
    //           resolution: 'D',
    //           from: monthStart,
    //           to: monthEnd,
    //           token: process.env.FINHUB_API_KEY,
    //         },
    //       });
    //       const spClose = spCandle.data.c;
    //       if (spClose && spClose.length >= 2) {
    //         spStart = spClose[0];
    //         spEnd = spClose[spClose.length - 1];
    //       }
    //     } catch { }

    //     const monthlyReturn = portfolioStartValue > 0
    //       ? ((portfolioEndValue - portfolioStartValue) / portfolioStartValue) * 100
    //       : 0;
    //     const mudarabahReturn = mudarabahStart > 0
    //       ? ((mudarabahEnd - mudarabahStart) / mudarabahStart) * 100
    //       : 0;
    //     const sp500Return = spStart > 0
    //       ? ((spEnd - spStart) / spStart) * 100
    //       : 0;

    //     months.push({
    //       month: label,
    //       portfolio: Number(monthlyReturn.toFixed(2)),
    //       mudarabahAverage: Number(mudarabahReturn.toFixed(2)),
    //       sp500: Number(sp500Return.toFixed(2)),
    //     });
    //   }
    //   return months;
    // };


    const generateMonthlyComparison = async () => {
      const months = [];
      const now = moment().startOf('month');
      const createdAt = moment(portfolio.createdAt).startOf('month');

      const monthDiff = now.diff(createdAt, 'months');

      for (let i = 0; i <= monthDiff; i++) {
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
          } catch { }
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
          } catch { }
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
        } catch { }

        const monthlyReturn = portfolioStartValue > 0
          ? ((portfolioEndValue - portfolioStartValue) / portfolioStartValue) * 100
          : 0;
        const mudarabahReturn = mudarabahStart > 0
          ? ((mudarabahEnd - mudarabahStart) / mudarabahStart) * 100
          : 0;
        const sp500Return = spStart > 0
          ? ((spEnd - spStart) / spStart) * 100
          : 0;

        months.unshift({ // unshift to keep chronological order (oldest first)
          month: label,
          portfolio: Number(monthlyReturn.toFixed(2)),
          mudarabahAverage: Number(mudarabahReturn.toFixed(2)),
          sp500: Number(sp500Return.toFixed(2)),
        });
      }
      return months;
    };
    const returnsComparison = await generateMonthlyComparison();
    const performanceChart = {
      labels: returnsComparison.map((item) => item.month),
      datasets: [
        {
          label: 'My Portfolio',
          data: returnsComparison.map((item) => item.portfolio),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.3,
        },
        {
          label: 'S&P 500',
          data: returnsComparison.map((item) => item.sp500),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.3,
        }
      ]
    };

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
      transactionHistory,
      performanceChart
    });
  } catch (err) {
    console.error('Portfolio dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to generate portfolio dashboard' });
  }
};


const getStockMeta = async (symbol) => {
  try {
    const [profile, quote, recommendation, ptRes, olive] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
      axios.get('https://finnhub.io/api/v1/stock/price-target', {
        params: { symbol: symbol, token: process.env.FINHUB_API_KEY },
      }),
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
    // console.log( quote.c)

    const olives = {
      financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
      competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
      valuation: quote.data.c <= olive?.fair_value ? 'green' : 'gray',
    };
    const priceTarget = ptRes.data || {};

    const data = {
      symbol,
      name: profile.data.name,
      logo: profile.data.logo,
      sector: profile.data.finnhubIndustry,
      marketCap: profile.data.marketCapitalization,
      change: quote.data.dp, // percent change
      currentPrice: quote.data.c,
      analystTarget: `$${priceTarget.targetMean?.toFixed(2) || '0.00'} (${priceTarget.targetPercent?.toFixed(2) || '0.00'}%)`,
      olives,
      ratingTrend: {
        buy: recommendation.data[0].buy || 0,
        hold: recommendation.data[0].hold || 0,
        sell: recommendation.data[0].sell || 0,
      },
      // lastRatingDate:
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
  // Create Finnhub WebSocket
  // const finnhubSocket = new WebSocket(`wss://ws.finnhub.io?token=${process.env.FINHUB_API_KEY}`);
  sendSubscribeMessage(symbol)


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