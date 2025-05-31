const axios = require("axios");
const finnhub = require("finnhub");

// Configure Finnhub client
const api_key = finnhub.ApiClient.instance.authentications["api_key"];
api_key.apiKey = process.env.FINHUB_API_KEY;
const finnhubClient = new finnhub.DefaultApi();

const FINNHUB_API_KEY = process.env.FINHUB_API_KEY;
const MORNINGSTAR_API_KEY = process.env.MORNINGSTAR_API_KEY;

// Get dynamic trending stock symbols
async function getTrendingSymbols(limit = 5) {
    const { data: symbols } = await axios.get("https://finnhub.io/api/v1/stock/symbol", {
        params: {
            exchange: "US",
            token: process.env.FINHUB_API_KEY,
        },
    });

    // const sample = symbols.slice(0, 50); // or replace with fixed: [{ symbol: "AAPL" }, ...]
    const sample = [{ symbol: "AAPL" }, { symbol: "GOOG" }, { symbol: "AMZN" }, { symbol: "FB" }];
    const filtered = [];

    for (let stock of sample) {
        try {
            const { data: metrics } = await axios.get("https://finnhub.io/api/v1/stock/metric", {
                params: {
                    symbol: stock.symbol,
                    metric: "all",
                    token: process.env.FINHUB_API_KEY,
                },
            });

            const volume = metrics.metric["10DayAverageTradingVolume"] || 0;
            const marketCap = metrics.metric.marketCapitalization || 0;

            // if (volume > 5000000 && marketCap > 100000) {
            filtered.push(stock.symbol);
            // }

            if (filtered.length >= limit) break;
        } catch (e) {
            continue; // Ignore and continue
        }
    }

    return filtered;
}

// Get detailed quote, recommendation, and price target
async function getStockDetails(symbol) {
    return new Promise((resolve, reject) => {
        // Fetch quote
        finnhubClient.quote(symbol, async (err, quoteData) => {
            if (err) return reject(err);

            // Fetch recommendations and price targets
            try {
                const [recRes, targetRes] = await Promise.all([
                    axios.get("https://finnhub.io/api/v1/stock/recommendation", {
                        params: { symbol, token: process.env.FINHUB_API_KEY },
                    }),
                    axios.get("https://finnhub.io/api/v1/stock/price-target", {
                        params: { symbol, token: process.env.FINHUB_API_KEY },
                    }),
                ]);

                const rec = recRes.data[0] || {};
                const target = targetRes.data || {};
                const quote = quoteData;

                const upside =
                    target.targetMean && quote.c
                        ? (((target.targetMean - quote.c) / quote.c) * 100).toFixed(2)
                        : null;

                resolve({
                    symbol,
                    currentPrice: quote.c,
                    priceChange: quote.d,
                    percentChange: quote.dp,
                    buy: rec.buy || 0,
                    hold: rec.hold || 0,
                    sell: rec.sell || 0,
                    targetMean: target.targetMean || null,
                    upsidePercent: upside,
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Combined endpoint
exports.stocksSummary = async (req, res) => {
    try {
        const symbols = await getTrendingSymbols(5);
        const stockDetails = await Promise.all(symbols.map(getStockDetails));

        const topStocks = [...stockDetails]
            .filter((s) => s.upsidePercent !== null)
            .sort((a, b) => b.upsidePercent - a.upsidePercent)
            .slice(0, 5);

        res.status(200).json({
            success: true,
            message: "Stocks summary",
            trendingStocks: stockDetails,
            topStocks,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch stock summary" });
    }
};





// Map of exchange prefixes to country codes
const exchangeCountryMap = {
    'NASDAQ': 'US',
    'NYSE': 'US',
    'AMEX': 'US',
    'BATS': 'US',
    'TSX': 'CA',
    'LSE': 'GB',
    'FWB': 'DE',
    'TSE': 'JP',
    'HKEX': 'HK',
    'SSE': 'CN',
    'BSE': 'IN',
    'NSE': 'IN'
};

function getCountryFlag(exchange) {
    const countryCode = exchangeCountryMap[exchange] || 'US'; // fallback to US
    return `https://flagsapi.com/${countryCode}/flat/24.png`;
}

exports.searchStocks = async (req, res) => {
    const query = req.query.q;

    if (!query || query.trim().length < 1) {
        return res.status(400).json({ error: "Search query is required." });
    }

    try {
        // Step 1: Search for matching stock symbols
        const { data: searchResults } = await axios.get('https://finnhub.io/api/v1/search', {
            params: {
                q: query,
                token: process.env.FINHUB_API_KEY
            }
        });

        // Step 2: Filter and fetch quotes
        const topMatches = searchResults.result
            .filter(item => item.type === "Common Stock" || item.type === "Equity")
            .slice(0, 5); // Top 5 results
        console.log(topMatches);

        const enrichedResults = await Promise.all(topMatches.map(async (item) => {
            return new Promise((resolve, reject) => {
                finnhubClient.quote(item.symbol, (err, quote) => {
                    if (err || !quote || quote.c === 0) return resolve(null);

                    resolve({
                        symbol: item.symbol,
                        description: item.description,
                        exchange: item.exchange,
                        flag: getCountryFlag(item.exchange),
                        price: quote.c,
                        change: quote.d,
                        percentChange: quote.dp
                    });
                });
            });
        }));

        const filtered = enrichedResults.filter(Boolean);

        res.status(200).json({
            success: true,
            results: filtered
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch stock search results." });
    }
};




// Utility: format date to UNIX timestamps
const getUnixTimeRange = () => {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 60 * 60 * 60 * 6; // Last 6 hours for intraday (adjust as needed)
    return { from: oneDayAgo, to: now };
};

exports.getStockOverview = async (req, res) => {
    const symbol = req.query.symbol || 'AAPL';

    try {
        // 1. Company profile
        const companyProfile = await new Promise((resolve, reject) =>
            finnhubClient.companyProfile2({ symbol }, (err, data) => err ? reject(err) : resolve(data))
        );

        // 2. Quote
        const quote = await new Promise((resolve, reject) =>
            finnhubClient.quote(symbol, (err, data) => err ? reject(err) : resolve(data))
        );

        // 3. Candlestick chart
        const { from, to } = getUnixTimeRange();
        const candlesRes = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
            params: {
                symbol,
                resolution: '5',
                from,
                to,
                token: process.env.FINHUB_API_KEY
            }
        });
        // console.log( candlesRes.data);

        const candles = candlesRes.data && candlesRes.data.s === 'ok'
            ? candlesRes.data.t.map((timestamp, i) => ({
                time: timestamp * 1000,
                open: candlesRes.data.o[i],
                close: candlesRes.data.c[i],
                high: candlesRes.data.h[i],
                low: candlesRes.data.l[i],
                volume: candlesRes.data.v[i]
            }))
            : [];

        // 4. Earnings
        // const earnings = await new Promise((resolve, reject) =>
        //     finnhubClient.earnings(symbol, (err, data) => err ? reject(err) : resolve(data))
        // );
        const earningsRes = await axios.get(`https://finnhub.io/api/v1/stock/earnings`, {
            params: {
                symbol,
                token: process.env.FINHUB_API_KEY
            }
        });

        const earningsData = (earningsRes.data || []).map(e => ({
            actual: e.actual,
            estimate: e.estimate,
            period: e.period,
            surprise: e.surprise
        }));

        res.status(200).json({
            success: true,
            data: {
                company: {
                    name: companyProfile.name,
                    symbol: companyProfile.ticker,
                    exchange: companyProfile.exchange
                },
                priceInfo: {
                    currentPrice: quote.c,
                    change: quote.d,
                    percentChange: quote.dp
                },
                chart: candles,
                earnings: earningsData,
                actions: ['Price', 'Target', 'Cash Flow', 'Revenue', 'EPS', 'Earning'] // Optional UI buttons
            }
        });

    } catch (err) {
        console.error('Error in stock overview:', err.message);
        res.status(500).json({ error: 'Failed to fetch stock overview' });
    }
};



const FINNHUB_TOKEN = process.env.FINHUB_API_KEY;

exports.getDailyGainersLosers = async (req, res) => {
    try {
        // Step 1: Get list of US symbols (limit to 100 for speed)
        // const { data: allSymbols } = await axios.get('https://finnhub.io/api/v1/stock/symbol', {
        //     params: {
        //         exchange: 'US',
        //         token: FINNHUB_TOKEN
        //     }
        // });

        // const sample = allSymbols.slice(0, 100);
        const sample = [{ symbol: "AAPL" }, { symbol: "GOOG" }, { symbol: "AMZN" }, { symbol: "FB" }];

        // Step 2: Get quote data for each symbol
        const quotes = await Promise.all(sample.map(async (stock) => {
            try {
                const { data: quote } = await axios.get('https://finnhub.io/api/v1/quote', {
                    params: {
                        symbol: stock.symbol,
                        token: FINNHUB_TOKEN
                    }
                });

                const changePercent = quote.dp ?? 0;
                const change = quote.d ?? 0;

                return {
                    symbol: stock.symbol,
                    name: stock.description || '',
                    currentPrice: quote.c ?? 0,
                    changePercent: changePercent.toFixed(2),
                    change: change.toFixed(2),
                    isUp: changePercent >= 0
                };
            } catch (error) {
                return null;
            }
        }));

        const validQuotes = quotes.filter(Boolean);

        // Step 3: Sort top gainers and losers
        const gainers = validQuotes
            .filter(q => q.isUp)
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, 5);

        const losers = validQuotes
            .filter(q => !q.isUp)
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, 5);

        // Step 4: Return data
        res.json({
            success: true,
            gainers,
            losers
        });

    } catch (error) {
        console.error('Error in gainers/losers:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch daily gainers and losers'
        });
    }
};



exports.getStockScreenerByCountry = async (req, res) => {
  const { country = 'US' } = req.query;

  try {
    const { data } = await finnhubClient.stockScreener({
      marketCapitalizationMoreThan: 1000, // Example filter
      country
    });

    const stocks = await Promise.all(data.result.slice(0, 10).map(async (stock) => {
      const quote = await finnhubClient.quote(stock.symbol);
      return {
        symbol: stock.symbol,
        name: stock.description,
        marketCap: stock.marketCapitalization,
        price: quote.data.c,
        change: quote.data.d,
        changePercent: quote.data.dp
      };
    }));

    res.json({ country, stocks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock screener by country', detail: err.message });
  }
};



exports.getStockTargetPrice = async (req, res) => {
  try {
    const { symbol } = req.query;
    const { data } = await axios.get(`https://finnhub.io/api/v1/stock/price-target`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching target price' });
  }
};

exports.getStockCashFlow = async (req, res) => {
  try {
    const { symbol } = req.query;
    const { data } = await axios.get(`https://finnhub.io/api/v1/stock/cash-flow`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cash flow data' });
  }
};

exports.getStockEPS = async (req, res) => {
  try {
    const { symbol } = req.query;
    const { data } = await axios.get(`https://finnhub.io/api/v1/stock/earnings`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching EPS data' });
  }
};


exports.getStockEarningsSurprise = async (req, res) => {
  try {
    const { symbol } = req.query;
    const { data } = await axios.get(`https://finnhub.io/api/v1/stock/earnings`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching earnings surprise data' });
  }
};


exports.getOliveStockOverview = async (req, res) => {
  try {
    const { symbol } = req.query;

    // === Fetch Finnhub Data ===
    const [quote, earnings, metrics, profile] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
    ]);

    const currentPrice = quote.data.c;
    const fairValue = metrics.data.metric.fairValue || currentPrice; // fallback
    const capitalAllocationScore = metrics.data.metric.returnOnCapitalEmployed || 0;
    const moatProxy = metrics.data.metric.grossMargin || 0;

    // === Proxy Logic (no Morningstar) ===

    // Quadrant logic (approximation)
    let quadrant = 'Yellow';
    if (capitalAllocationScore > 15 && moatProxy > 60) quadrant = 'Olive Green';
    else if (capitalAllocationScore > 15 && moatProxy <= 60) quadrant = 'Lime Green';
    else if (capitalAllocationScore <= 15 && moatProxy > 60) quadrant = 'Orange';

    // Valuation bar
    const valuationDiff = ((currentPrice - fairValue) / fairValue) * 100;
    let valuationColor = 'yellow';
    if (valuationDiff < -10) valuationColor = 'green';
    else if (valuationDiff > 10) valuationColor = 'red';

    // Olive logic
    const olives = {
      financialHealth: capitalAllocationScore > 15 ? 'green' : 'gray',
      competitiveAdvantage: moatProxy > 60 ? 'green' : 'gray',
      valuation: currentPrice <= fairValue * 1.1 ? 'green' : 'gray'
    };

    const shariaCompliant = true; // Placeholder (add screening logic/API)

    return res.json({
      company: profile.data.name || symbol,
      quadrant,
      olives,
      shariaCompliant,
      valuationBar: {
        percent: valuationDiff.toFixed(2),
        color: valuationColor,
        currentPrice,
        fairValue
      },
      finnhub: {
        quote: quote.data,
        earnings: earnings.data,
        metrics: metrics.data,
        profile: profile.data
      }
    });

  } catch (err) {
    console.error('Stock overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch stock overview' });
  }
};




// exports.getRevenueBreakdown= async(req, res) =>{
//   const { symbol } = req.query;

//   if (!symbol) {
//     return res.status(400).json({ error: 'Missing required query parameter: symbol' });
//   }

//   try {
//     // Fetch revenue breakdown data from Finnhub
//     const response = await axios.get('https://finnhub.io/api/v1/stock/revenue-breakdown', {
//       params: {
//         symbol: symbol,
//         token: FINNHUB_API_KEY,
//       },
//     });

//     const data = response.data.data;

//     console.log( data)
//     // if (!data || !data.report || !data.report.length) {
//     //   return res.status(404).json({ error: 'Revenue breakdown data not found for the specified symbol.' });
//     // }

//     // Process the first report in the data
//     const report = data.report[0];
//     console.log(report.revenueBreakdown)

//     const sankeyData = [];

//     // Process revenue segments
//     if (report.revenue) {
//       const totalRevenue = report.revenueBreakdown.reduce((sum, item) => sum + item.value, 0);

//       report.revenue.forEach((item) => {
//         sankeyData.push({
//           source: 'Revenue',
//           target: item.label,
//           value: item.value,
//         });
//       });

//       // Add total revenue node
//       sankeyData.push({
//         source: 'Gross Profit',
//         target: 'Revenue',
//         value: totalRevenue,
//       });
//     }

//     // Process cost of revenue
//     if (report.costOfRevenue) {
//       const totalCost = report.costOfRevenue.reduce((sum, item) => sum + item.value, 0);

//       report.costOfRevenue.forEach((item) => {
//         sankeyData.push({
//           source: item.label,
//           target: 'Cost of Revenue',
//           value: item.value,
//         });
//       });

//       sankeyData.push({
//         source: 'Cost of Revenue',
//         target: 'Gross Profit',
//         value: totalCost,
//       });
//     }

//     // Process operating expenses
//     if (report.operatingExpenses) {
//       const totalOperatingExpenses = report.operatingExpenses.reduce((sum, item) => sum + item.value, 0);

//       report.operatingExpenses.forEach((item) => {
//         sankeyData.push({
//           source: item.label,
//           target: 'Operating Expenses',
//           value: item.value,
//         });
//       });

//       sankeyData.push({
//         source: 'Operating Expenses',
//         target: 'Gross Profit',
//         value: totalOperatingExpenses,
//       });
//     }

//     // Process net profit
//     if (report.netProfit) {
//       sankeyData.push({
//         source: 'Net Profit',
//         target: 'Gross Profit',
//         value: report.netProfit,
//       });
//     }

//     // Process tax
//     if (report.tax) {
//       sankeyData.push({
//         source: 'Tax',
//         target: 'Net Profit',
//         value: report.tax,
//       });
//     }

//     res.json(sankeyData);
//   } catch (error) {
//     console.error('Error fetching revenue breakdown:', error.message);
//     res.status(500).json({ error: 'An error occurred while fetching revenue breakdown data.' });
//   }
// }

// exports.getRevenueBreakdown = async (req, res) => {
//   const { symbol } = req.query;
//   if (!symbol) {
//     return res.status(400).json({ error: 'Missing query param: symbol' });
//   }

//   try {
//     const response = await axios.get('https://finnhub.io/api/v1/stock/revenue-breakdown', {
//       params: {
//         symbol,
//         token: FINNHUB_API_KEY,
//       },
//     });

//     const item = response.data.data?.[0]?.breakdown;
//     if (!item || !item.revenueBreakdown) {
//       return res.status(404).json({ error: 'Revenue breakdown not available' });
//     }

//     const revenue = item.value;
//     const sankeyData = [];

//     // Loop through revenueBreakdown and extract the Product breakdown
//     const productData = item.revenueBreakdown.find(r => r.axis === 'srt_ProductOrServiceAxis');
//     if (productData?.data?.length) {
//       productData.data.forEach(product => {
//         sankeyData.push({
//           source: 'Revenue',
//           target: product.label,
//           value: product.value,
//         });
//       });
//     }

//     // Add the total Revenue -> Gross Profit (for structure)
//     sankeyData.push({
//       source: 'Gross Profit',
//       target: 'Revenue',
//       value: revenue,
//     });

//     res.json(sankeyData);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Failed to fetch or process data' });
//   }
// };


exports.getRevenueBreakdown = async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  try {
    const url = `https://finnhub.io/api/v1/stock/revenue-breakdown?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`;
    const { data } = await axios.get(url);
    const breakdown = data?.data?.[0]?.breakdown;

    if (!breakdown || !breakdown.revenueBreakdown) {
      return res.status(404).json({ error: 'Revenue breakdown not available' });
    }

    const revenueTotal = breakdown.value || 0;
    const sankeyData = [];

    const breakdowns = breakdown.revenueBreakdown.filter(b => b.axis === 'srt_ProductOrServiceAxis');

    const grouped = breakdowns?.[0]; // Products vs Services
    const detailed = breakdowns?.[1]; // iPhone, iPad, etc.

    // Top-level: Revenue → Products / Services
    if (grouped?.data) {
      grouped.data.forEach(item => {
        sankeyData.push({
          source: 'Revenue',
          target: item.label,
          value: +(item.value / 1e9).toFixed(2)
        });
      });
    }

    // Mid-level: Products → iPhone, iPad, Mac, etc.
    if (detailed?.data) {
      detailed.data.forEach(item => {
        if (item.label !== 'Services') {
          sankeyData.push({
            source: 'Products',
            target: item.label,
            value: +(item.value / 1e9).toFixed(2)
          });
        } else {
          // Keep Services separate if it's also broken down
          sankeyData.push({
            source: 'Revenue',
            target: 'Services',
            value: +(item.value / 1e9).toFixed(2)
          });
        }
      });
    }

    // Region breakdown
    const region = breakdown.revenueBreakdown.find(b => b.axis === 'us-gaap_StatementBusinessSegmentsAxis');
    if (region?.data) {
      region.data.forEach(item => {
        sankeyData.push({
          source: 'Revenue by Region',
          target: item.label,
          value: +(item.value / 1e9).toFixed(2),
        });
      });

      sankeyData.push({
        source: 'Revenue',
        target: 'Revenue by Region',
        value: +(revenueTotal / 1e9).toFixed(2),
      });
    }

    // Gross Profit → Revenue
    sankeyData.push({
      source: 'Gross Profit',
      target: 'Revenue',
      value: +(revenueTotal / 1e9).toFixed(2),
    });

    res.json(sankeyData);
  } catch (error) {
    console.error('Error fetching revenue breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch revenue breakdown' });
  }
};


