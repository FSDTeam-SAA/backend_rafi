const axios = require("axios");
const finnhub = require("finnhub");
const Olive = require("../models/stcoks.olive.model");
const qualityStocks = require("../models/qualityStcoks.model");
const moment = require("moment");

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

  const sample = symbols.slice(0, 50); // or replace with fixed: [{ symbol: "AAPL" }, ...]
  // const sample = [{ symbol: "AAPL" }, { symbol: "GOOG" }, { symbol: "AMZN" }, { symbol: "FB" }];
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
        // console.log(recRes.data, "adsjfhdsf", targetRes.data)

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

exports.stocksSummary = async (req, res) => {
  try {
    const symbols = await getTrendingSymbols(10);

    const stockDetails = await Promise.all(
      symbols.map(async (symbol) => {
        const basicDetails = await getStockDetails(symbol);
        const quotePrice = basicDetails.quote?.data?.c;
        const olive = await Olive.findOne({ symbol }).exec();

        // Determine quadrant
        let quadrant = '';
        if (olive?.financial_health === "good" && olive?.compatitive_advantage === "good") quadrant = 'Olive Green';
        else if (olive?.financial_health === "good" && olive?.compatitive_advantage === "bad") quadrant = 'Lime Green';
        else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "good") quadrant = 'Orange';
        else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "bad") quadrant = 'Yellow';
        // console.log("dsfds" ,quadrant)

        // Valuation analysis
        let valuationColor = 'yellow';
        if (olive?.fair_value && quotePrice) {
          const valuationDiff = ((quotePrice - olive.fair_value) / olive.fair_value) * 100;
          if (valuationDiff < -10) valuationColor = 'green';
          else if (valuationDiff > 10) valuationColor = 'red';
        }

        // Olive visuals
        const olives = {
          financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
          competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
          valuation: quotePrice <= olive?.fair_value ? 'green' : 'gray',
        };

        return {
          ...basicDetails,
          symbol,
          quadrant,
          valuationColor,
          olives,
        };
      })
    );

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
    // console.log(topMatches);

    const enrichedResults = await Promise.all(
      topMatches.map(async (item) => {
        try {
          const companyProfile = await new Promise((resolve, reject) =>
            finnhubClient.companyProfile2({ symbol: item.symbol }, (err, data) =>
              err ? reject(err) : resolve(data)
            )
          );
          // console.log(companyProfile);

          const quote = await new Promise((resolve, reject) =>
            finnhubClient.quote(item.symbol, (err, data) =>
              err || !data || data.c === 0 ? reject(err || new Error('No quote')) : resolve(data)
            )
          );
          const getStockdetailsData = await getStockDetails(item.symbol)

          return {
            logo: companyProfile.logo,
            symbol: item.symbol,
            description: item.description,
            exchange: companyProfile.exchange,
            flag: getCountryFlag(companyProfile.exchange),
            price: quote.c,
            change: quote.d,
            percentChange: quote.dp,
            getStockdetailsData: getStockdetailsData
          };
        } catch (err) {
          console.warn(`Skipping ${item.symbol} due to error:`, err.message);
          return null; // Skip this item if any error
        }
      })
    );


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


exports.filterStocks = async (req, res) => {
  try {
    const { q } = req.query;
    const olives = await Olive.find();

    const results = await Promise.all(olives.map(async (olive) => {
      const quote = await new Promise((resolve, reject) =>
        finnhubClient.quote(olive.symbol, (err, data) =>
          err || !data?.c ? reject(err || new Error("No price")) : resolve(data)
        )
      );
      console.log(olive)

      const colorMap = {
        financialHealth: olive.financial_health === 'good' ? 'green' : 'gray',
        competitiveAdvantage: olive.compatitive_advantage === 'good' ? 'green' : 'gray',
        valuation: quote.c <= olive.fair_value ? 'green' : 'gray',
      };

      const greenCount = Object.values(colorMap).filter(color => color === 'green').length;

      // let category = v ||'Zero Olive';//oneOlive
      // if (greenCount === 3) category = 'Three Olive';//threeOlive
      // else if (greenCount === 2) category = 'Two Olive';//twoOlive


      let category = 'oneOlive' || 'Zero Olive';//oneOlive
      if (greenCount === 3) category = 'threeOlive' || 'Three Olive';//threeOlive
      else if (greenCount === 2) category = 'twoOlive' || 'Two Olive';//twoOlive

      return {
        symbol: olive.symbol,
        fair_value: olive.fair_value,
        current_price: quote.c,
        olives: colorMap,
        category
      };
    }));

    const threeOlive = results.filter(stock => stock.category === q);

    res.status(200).json({
      status: true,
      message: 'Stocks categorized by Olive status',
      data: {
        threeOlive,
        twoOlive,
        zeroOlive
      }
    });
  } catch (err) {
    console.error("Error filtering stocks:", err);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: err.message
    });
  }
};



// Utility: format date to UNIX timestamps
// const getUnixTimeRange = () => {
//   const now = Math.floor(Date.now() / 1000);
//   const oneDayAgo = now - 60 * 60 * 60 * 6; // Last 6 hours for intraday (adjust as needed)
//   return { from: oneDayAgo, to: now };
// };

// Utility: format date to UNIX timestamps (last 5 years)
const getUnixTimeRange = (range) => {
  const now = Math.floor(Date.now() / 1000); // seconds
  let from, resolution;

  switch (range) {
    case 'Day': {
      const now = Math.floor(Date.now() / 1000); // current timestamp in seconds

      // Create a Date object for today
      let start = new Date();
      start.setHours(9, 30, 0, 0); // set to 9:30 AM today

      // If now is earlier than 9:30 AM, shift start to yesterday's 9:30 AM
      if (now < Math.floor(start.getTime() / 1000)) {
        start.setDate(start.getDate() - 1);
      }

      // from = 24h before "now", but anchored at last 9:30 AM
      let from = Math.floor(start.getTime() / 1000);

      resolution = '30'; // 30-minute candles
      break;
    }
    case 'Week':
      from = now - 60 * 60 * 24 * 10;
      resolution = 'D'; // 30-minute intervals
      break;
    case 'Month':
      from = now - 60 * 60 * 24 * 30;
      resolution = 'W'; // 1-hour intervals
      break;
    case 'Year':
      from = now - 60 * 60 * 24 * 365;
      resolution = 'M'; // Daily
      break;
    case '5Year':
    default:
      from = now - 60 * 60 * 24 * 365 * 5;
      resolution = 'W'; // Weekly
      break;
  }

  return { from, to: now, resolution };
};

// exports.getStockOverview = async (req, res) => {
//   const symbol = req.query.symbol || 'AAPL';

//   try {
//     // 1. Company profile
//     const companyProfile = await new Promise((resolve, reject) =>
//       finnhubClient.companyProfile2({ symbol }, (err, data) => err ? reject(err) : resolve(data))
//     );
//     // console.log(companyProfile)

//     // 2. Quote
//     const quote = await new Promise((resolve, reject) =>
//       finnhubClient.quote(symbol, (err, data) => err ? reject(err) : resolve(data))
//     );

//     // 3. Candlestick chart
//     const { from, to } = getUnixTimeRange();
//     const candlesRes = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
//       params: {
//         symbol,
//         resolution: '5',
//         from,
//         to,
//         token: process.env.FINHUB_API_KEY
//       }
//     });
//     // console.log( candlesRes.data);

//     const candles = candlesRes.data && candlesRes.data.s === 'ok'
//       ? candlesRes.data.t.map((timestamp, i) => ({
//         time: timestamp * 1000,
//         open: candlesRes.data.o[i],
//         close: candlesRes.data.c[i],
//         high: candlesRes.data.h[i],
//         low: candlesRes.data.l[i],
//         volume: candlesRes.data.v[i]
//       }))
//       : [];

//     // 4. Earnings
//     // const earnings = await new Promise((resolve, reject) =>
//     //     finnhubClient.earnings(symbol, (err, data) => err ? reject(err) : resolve(data))
//     // );
//     const earningsRes = await axios.get(`https://finnhub.io/api/v1/stock/earnings`, {
//       params: {
//         symbol,
//         token: process.env.FINHUB_API_KEY
//       }
//     });

//     const earningsData = (earningsRes.data || []).map(e => ({
//       actual: e.actual,
//       estimate: e.estimate,
//       period: e.period,
//       surprise: e.surprise
//     }));

//     res.status(200).json({
//       success: true,
//       data: {
//         company: {
//           name: companyProfile.name,
//           symbol: companyProfile.ticker,
//           exchange: companyProfile.exchange,
//           logo: companyProfile.logo,
//         },
//         priceInfo: {
//           currentPrice: quote.c,
//           change: quote.d,
//           percentChange: quote.dp
//         },
//         chart: candles,
//         earnings: earningsData,
//         actions: ['Price', 'Target', 'Cash Flow', 'Revenue', 'EPS', 'Earning'] // Optional UI buttons
//       }
//     });

//   } catch (err) {
//     console.error('Error in stock overview:', err.message);
//     res.status(500).json({ error: 'Failed to fetch stock overview' });
//   }
// };


exports.getStockOverview = async (req, res) => {
  const symbol = req.query.symbol || 'AAPL';
  const range = req.query.range || '5year'; // 'daily', 'weekly', 'monthly', etc.

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
    const { from, to, resolution } = getUnixTimeRange(range);
    const candlesRes = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
      params: {
        symbol,
        resolution,
        from,
        to,
        token: process.env.FINHUB_API_KEY
      }
    });

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
          exchange: companyProfile.exchange,
          logo: companyProfile.logo,
        },
        priceInfo: {
          currentPrice: quote.c,
          change: quote.d,
          percentChange: quote.dp
        },
        chart: candles,
        earnings: earningsData,
        actions: ['Price', 'Target', 'Cash Flow', 'Revenue', 'EPS', 'Earning'],
        usedRange: range
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
    const sample = [{ symbol: "AAPL" }, { symbol: "GOOG" }, { symbol: "AMZN" }, { symbol: "MSFT" }];

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



// exports.getStockTargetPrice = async (req, res) => {
//   try {
//     const { symbol } = req.query;
//     const { data } = await axios.get(`https://finnhub.io/api/v1/stock/price-target`, {
//       params: { symbol, token: FINNHUB_API_KEY }
//     });
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: 'Error fetching target price' });
//   }
// };



// exports.getStockTargetPrice = async (req, res) => {
//   try {
//     const { symbol } = req.query;
//     if (!symbol) return res.status(400).json({ error: "Symbol is required" });

//     // 1. Fetch price targets
//     const { data: targetData } = await axios.get(
//       `https://finnhub.io/api/v1/stock/price-target`,
//       { params: { symbol, token: FINNHUB_API_KEY } }
//     );

//     // 2. Fetch recommendation summary
//     const { data: recommendation } = await axios.get(
//       `https://finnhub.io/api/v1/stock/recommendation`,
//       { params: { symbol, token: FINNHUB_API_KEY } }
//     );
//     const latestRec = recommendation?.[0] || {};

//     // 3. Fetch actual historical prices (12 months of monthly data)
//     const now = moment();
//     const from = now.clone().subtract(12, "months").unix();
//     const to = now.unix();

//     const { data: candles } = await axios.get(
//       `https://finnhub.io/api/v1/stock/candle`,
//       {
//         params: {
//           symbol,
//           resolution: "M", // Monthly data
//           from,
//           to,
//           token: FINNHUB_API_KEY,
//         },
//       }
//     );

//     let labels = [];
//     let pastPrices = [];

//     if (candles.s === "ok") {
//       labels = candles.t.map((ts) =>
//         moment.unix(ts).format("MMM")
//       );
//       pastPrices = candles.c.map((c) => Number(c.toFixed(2)));
//     }

//     const lastClose = pastPrices.at(-1);
//     const forecastAvg = parseFloat(targetData.targetMean || 0);
//     const forecastHigh = parseFloat(targetData.targetHigh || 0);
//     const forecastLow = parseFloat(targetData.targetLow || 0);

//     const forecastData = {
//       average: [],
//       high: [],
//       low: [],
//     };

//     if (lastClose && forecastAvg && forecastHigh && forecastLow) {
//       for (let i = 0; i < 12; i++) {
//         forecastData.average.push(
//           Number(lastClose + ((forecastAvg - lastClose) / 12) * i).toFixed(2)
//         );
//         forecastData.high.push(
//           Number(lastClose + ((forecastHigh - lastClose) / 12) * i).toFixed(2)
//         );
//         forecastData.low.push(
//           Number(lastClose + ((forecastLow - lastClose) / 12) * i).toFixed(2)
//         );
//       }
//     }

//     res.json({
//       currentPrice: lastClose ? `$${lastClose.toFixed(2)}` : "N/A",
//       upside:
//         lastClose && forecastAvg
//           ? `${(((forecastAvg - lastClose) / lastClose) * 100).toFixed(1)}% Upside`
//           : "N/A",
//       chart: {
//         labels,
//         pastPrices,
//         forecast: forecastData,
//       },
//       targets: {
//         high: `$${forecastHigh.toFixed(2)}`,
//         average: `$${forecastAvg.toFixed(2)}`,
//         low: `$${forecastLow.toFixed(2)}`,
//       },
//       analysts: {
//         buy: latestRec.buy || 0,
//         hold: latestRec.hold || 0,
//         sell: latestRec.sell || 0,
//         total:
//           (latestRec.buy || 0) +
//           (latestRec.hold || 0) +
//           (latestRec.sell || 0),
//       },
//     });
//   } catch (err) {
//     console.error("Target price error:", err.message);
//     res.status(500).json({ error: "Failed to load stock target price data" });
//   }
// };

exports.getStockTargetPrice = async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "Symbol is required" });

    // 1. Fetch price targets
    const { data: targetData } = await axios.get(
      `https://finnhub.io/api/v1/stock/price-target`,
      { params: { symbol, token: FINNHUB_API_KEY } }
    );

    // 2. Fetch recommendation summary
    const { data: recommendation } = await axios.get(
      `https://finnhub.io/api/v1/stock/recommendation`,
      { params: { symbol, token: FINNHUB_API_KEY } }
    );
    const latestRec = recommendation?.[0] || {};

    // 3. Fetch actual historical prices (12 months of monthly data)
    const now = moment();
    const from = now.clone().subtract(12, "months").unix();
    const to = now.unix();

    const { data: candles } = await axios.get(
      `https://finnhub.io/api/v1/stock/candle`,
      {
        params: {
          symbol,
          resolution: "M", // Monthly data
          from,
          to,
          token: FINNHUB_API_KEY,
        },
      }
    );

    let labels = [];
    let pastPrices = [];

    if (candles.s === "ok") {
      labels = candles.t.map((ts) => moment.unix(ts).format("MMM"));
      pastPrices = candles.c.map((c) => Number(c.toFixed(2)));
    }

    // 4. Fetch latest quote for accurate current price
    const { data: quote } = await axios.get(
      `https://finnhub.io/api/v1/quote`,
      { params: { symbol, token: FINNHUB_API_KEY } }
    );
    const lastClose = quote.c || pastPrices.at(-1) || null;

    const forecastAvg = parseFloat(targetData.targetMean || 0);
    const forecastHigh = parseFloat(targetData.targetHigh || 0);
    const forecastLow = parseFloat(targetData.targetLow || 0);

    // ✅ Only return this month’s target (not 12 months)
    const forecastData = {
      average: forecastAvg ? [forecastAvg.toFixed(2)] : [],
      high: forecastHigh ? [forecastHigh.toFixed(2)] : [],
      low: forecastLow ? [forecastLow.toFixed(2)] : [],
    };

    res.json({
      currentPrice: lastClose ? `$${lastClose.toFixed(2)}` : "N/A",
      upside:
        lastClose && forecastAvg
          ? `${(((forecastAvg - lastClose) / lastClose) * 100).toFixed(1)}% Upside`
          : "N/A",
      chart: {
        labels,
        pastPrices,
        forecast: forecastData, // only this month’s targets
      },
      targets: {
        high: `$${forecastHigh.toFixed(2)}`,
        average: `$${forecastAvg.toFixed(2)}`,
        low: `$${forecastLow.toFixed(2)}`,
      },
      analysts: {
        buy: latestRec.buy || 0,
        hold: latestRec.hold || 0,
        sell: latestRec.sell || 0,
        total:
          (latestRec.buy || 0) +
          (latestRec.hold || 0) +
          (latestRec.sell || 0),
      },
    });
  } catch (err) {
    console.error("Target price error:", err.message);
    res.status(500).json({ error: "Failed to load stock target price data" });
  }
};




// exports.getStockCashFlow = async (req, res) => {
//   try {
//     const { symbol } = req.query;
//     if (!symbol) return res.status(400).json({ error: 'Missing symbol parameter' });

//     const { data } = await axios.get('https://finnhub.io/api/v1/stock/financials-reported', {
//       params: {
//         symbol,
//         token: FINNHUB_API_KEY
//       }
//     });

//     const reports = data.data || [];

//     // Extract cash flow items from the latest report
//     const cashFlowReport = reports.find(report => {
//       return report.report?.ic && Object.keys(report.report.ic).length > 0;
//     });

//     res.json({
//       symbol,
//       cashFlow: cashFlowReport || null
//     });
//   } catch (err) {
//     console.error('Error fetching cash flow:', err.message);
//     res.status(500).json({ error: 'Failed to fetch cash flow data' });
//   }
// };

exports.getStockCashFlow = async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol parameter' });

  try {
    // Fetch standardized cash flow statement (uses /financials endpoint with cf)
    const { data } = await axios.get('https://finnhub.io/api/v1/stock/financials', {
      params: { symbol, statement: 'cf', freq: 'annual', token: process.env.FINHUB_API_KEY }
    });

    if (!data || !data.financials?.length) {
      return res.status(404).json({ error: 'No cash flow data available' });
    }
    // console.log(data.financials)

    // Map and format each year's cash flow data
    const cashFlows = data.financials.map(entry => ({
      year: entry.year,
      operatingCashFlow: entry.netOperatingCashFlow || null,
      investingCashFlow: entry.netInvestingCashFlow || null,
      financingCashFlow: entry.netCashFinancingActivities || null,
      // freeCashFlow: entry.annual.freeCashflow || null,
      // endCash: entry.annual.cashAndCashEquivalents || null
    }));

    res.json({ symbol: symbol.toUpperCase(), cashFlows });

  } catch (err) {
    console.error('Error fetching cash flow detailed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch detailed cash flow data' });
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


// exports.getOliveStockOverview = async (req, res) => {
//   try {
//     const { symbol } = req.query;

//     // === Fetch Finnhub Data ===
//     const [quote, earnings, metrics, profile] = await Promise.all([
//       axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
//       axios.get(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
//       axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`),
//       axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
//     ]);

//     const currentPrice = quote.data.c;
//     const fairValue = metrics.data.metric.fairValue || currentPrice; // fallback
//     const capitalAllocationScore = metrics.data.metric.returnOnCapitalEmployed || 0;
//     const moatProxy = metrics.data.metric.grossMargin || 0;

//     // === Proxy Logic (no Morningstar) ===

//     // Quadrant logic (approximation)
//     let quadrant = 'Yellow';
//     if (capitalAllocationScore > 15 && moatProxy > 60) quadrant = 'Olive Green';
//     else if (capitalAllocationScore > 15 && moatProxy <= 60) quadrant = 'Lime Green';
//     else if (capitalAllocationScore <= 15 && moatProxy > 60) quadrant = 'Orange';

//     // Valuation bar
//     const valuationDiff = ((currentPrice - fairValue) / fairValue) * 100;
//     let valuationColor = 'yellow';
//     if (valuationDiff < -10) valuationColor = 'green';
//     else if (valuationDiff > 10) valuationColor = 'red';

//     // Olive logic
//     const olives = {
//       financialHealth: capitalAllocationScore > 15 ? 'green' : 'gray',
//       competitiveAdvantage: moatProxy > 60 ? 'green' : 'gray',
//       valuation: currentPrice <= fairValue * 1.1 ? 'green' : 'gray'
//     };

//     const shariaCompliant = true; // Placeholder (add screening logic/API)

//     return res.json({
//       company: profile.data.name || symbol,
//       logo: profile.data.logo || '',
//       exchange: profile.data.exchange || '',
//       quadrant,
//       olives,
//       shariaCompliant,
//       valuationBar: {
//         percent: valuationDiff.toFixed(2),
//         color: valuationColor,
//         currentPrice,
//         fairValue
//       },
//       finnhub: {
//         quote: quote.data,
//         earnings: earnings.data,
//         metrics: metrics.data,
//         profile: profile.data
//       }
//     });

//   } catch (err) {
//     console.error('Stock overview error:', err);
//     return res.status(500).json({ error: 'Failed to fetch stock overview' });
//   }
// };




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


exports.getOliveStockOverview = async (req, res) => {
  try {
    const { symbol } = req.query;

    // === Fetch Finnhub Data ===
    const [quote, profile] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
    ]);

    const olive = await Olive.findOne({ symbol: symbol }).exec();
    // if (!olive) {
    //   return res.status(404).json({ error: 'this stocks is not in our database' });
    //   }

    const currentPrice = quote.data.c;
    // Quadrant logic (approximation)
    let quadrant = '';
    if (olive?.financial_health === "good" && olive?.compatitive_advantage === "good") quadrant = 'Olive Green';
    else if (olive?.financial_health === "good" && olive?.compatitive_advantage === "bad") quadrant = 'Lime Green';
    else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "good") quadrant = 'Orange';
    else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "bad") quadrant = 'Yellow';

    // Valuation bar
    const valuationDiff = ((currentPrice - olive?.fair_value) / olive?.fair_value) * 100;
    let valuationColor = 'yellow';
    if (valuationDiff < -10) valuationColor = 'green';
    else if (valuationDiff > 10) valuationColor = 'red';
    // console.log(currentPrice)

    // Olive logic
    const olives = {
      financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
      competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
      valuation: currentPrice <= olive?.fair_value ? 'green' : 'gray'
    };

    const shariaCompliant = olive?.ComplianceStatus === "Compliant" ? true : false; // Placeholder (add screening logic/API)
    const reason = olive?.QuantitativeReason

    //     // === Zoya Shariah Screening ===
    // const { data: zoya } = await axios.get(`https://api.zoya.finance/v1/shariah-screening`, {
    //   params: { symbol },
    //   headers: { Authorization: `Bearer ${process.env.ZOYA_API_KEY}` }
    // });

    // const shariaCompliant = zoya?.data?.isShariahCompliant ?? null;

    return res.json({
      company: profile.data.name || symbol,
      logo: profile.data.logo || '',
      exchange: profile.data.exchange || '',
      quadrant,
      olives,
      shariaCompliant,
      reason: reason,
      valuationBar: {
        percent: valuationDiff.toFixed(2),
        color: valuationColor,
        currentPrice,
        fairValue: olive?.fair_value
      },
    });

  } catch (err) {
    console.error('Stock overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch stock overview' });
  }
};

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
    const links = [];
    const nodeSet = new Set();

    const breakdowns = breakdown.revenueBreakdown.filter(b => b.axis === 'srt_ProductOrServiceAxis');

    const grouped = breakdowns?.[0]; // Products vs Services
    const detailed = breakdowns?.[1]; // iPhone, iPad, etc.

    if (grouped?.data) {
      grouped.data.forEach(item => {
        links.push({
          source: 'Revenue',
          target: item.label,
          value: +(item.value / 1e9).toFixed(2),
        });
        nodeSet.add('Revenue');
        nodeSet.add(item.label);
      });
    }

    if (detailed?.data) {
      detailed.data.forEach(item => {
        if (item.label !== 'Services') {
          links.push({
            source: 'Products',
            target: item.label,
            value: +(item.value / 1e9).toFixed(2),
          });
          nodeSet.add('Products');
          nodeSet.add(item.label);
        } else {
          links.push({
            source: 'Revenue',
            target: 'Services',
            value: +(item.value / 1e9).toFixed(2),
          });
          nodeSet.add('Revenue');
          nodeSet.add('Services');
        }
      });
    }

    // const region = breakdown.revenueBreakdown.find(b => b.axis === 'us-gaap_StatementBusinessSegmentsAxis');
    // if (region?.data) {
    //   region.data.forEach(item => {
    //     links.push({
    //       source: 'Revenue by Region',
    //       target: item.label,
    //       value: +(item.value / 1e9).toFixed(2),
    //     });
    //     nodeSet.add('Revenue by Region');
    //     nodeSet.add(item.label);
    //   });

    //   links.push({
    //     source: 'Revenue',
    //     target: 'Revenue by Region',
    //     value: +(revenueTotal / 1e9).toFixed(2),
    //   });
    //   nodeSet.add('Revenue');
    //   nodeSet.add('Revenue by Region');
    // }

    links.push({
      source: 'Gross Profit',
      target: 'Revenue',
      value: +(revenueTotal / 1e9).toFixed(2),
    });
    nodeSet.add('Gross Profit');
    nodeSet.add('Revenue');

    const nodes = Array.from(nodeSet).map(name => ({ name }));

    res.json({ nodes, links });
  } catch (error) {
    console.error('Error fetching revenue breakdown:', error.message);
    res.status(500).json({ error: 'Failed to fetch revenue breakdown' });
  }
};

exports.getStockOfTheMonth = async (req, res) => {
  try {
    const monthName = new Date().toLocaleString('default', { month: 'long' });
    const now = moment();
    const oneMonthAgo = moment().subtract(30, 'days');

    const stocks = await Olive.find({ financial_health: 'good', compatitive_advantage: 'good' })
      .sort({ fair_value: 1 }); // most undervalued at the top

    if (!stocks.length) return res.status(404).json({ error: 'No matching records' });

    const enrichedStocks = await Promise.all(
      stocks.map(async (stock) => {
        try {
          // Fetch data in parallel
          const [profileRes, recRes, ptRes, candleRes] = await Promise.all([
            axios.get('https://finnhub.io/api/v1/stock/profile2', {
              params: { symbol: stock.symbol, token: process.env.FINHUB_API_KEY },
            }),
            axios.get('https://finnhub.io/api/v1/stock/recommendation', {
              params: { symbol: stock.symbol, token: process.env.FINHUB_API_KEY },
            }),
            axios.get('https://finnhub.io/api/v1/stock/price-target', {
              params: { symbol: stock.symbol, token: process.env.FINHUB_API_KEY },
            }),
            axios.get('https://finnhub.io/api/v1/stock/candle', {
              params: {
                symbol: stock.symbol,
                resolution: 'D',
                from: Math.floor(oneMonthAgo.valueOf() / 1000),
                to: Math.floor(now.valueOf() / 1000),
                token: process.env.FINHUB_API_KEY,
              },
            }),
          ]);
          // console.log( profileRes)

          const profile = profileRes.data;
          const recommendation = recRes.data[0] || {};
          const priceTarget = ptRes.data || {};
          const candles = candleRes.data;

          // Calculate 1-month return
          const closes = candles?.c || [];
          const oneMonthReturn = (closes.length >= 2)
            ? (((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2)
            : '0.00';

          // Olive logic
          const olive = await Olive.findOne({ symbol: stock.symbol });
          let quadrant = 'Yellow';
          let valuationColor = 'yellow';

          const quotePrice = closes[closes.length - 1] || 0;
          const fairValue = olive?.fair_value || quotePrice;

          if (olive?.financial_health === "good" && olive?.compatitive_advantage === "good") quadrant = 'Olive Green';
          else if (olive?.financial_health === "good") quadrant = 'Lime Green';
          else if (olive?.compatitive_advantage === "good") quadrant = 'Orange';

          const valuationDiff = ((quotePrice - fairValue) / fairValue) * 100;
          if (valuationDiff < -10) valuationColor = 'green';
          else if (valuationDiff > 10) valuationColor = 'red';

          const olives = {
            financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
            competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
            valuation: quotePrice <= fairValue * 1.1 ? 'green' : 'gray',
          };

          return {
            symbol: stock.symbol,
            companyName: profile.name || '',
            logo: profile.logo || '',
            sector: profile.finnhubIndustry || 'N/A',
            marketCap: profile.marketCapitalization
              ? `$${Number(profile.marketCapitalization).toLocaleString()}`
              : '$0',
            oneMonthReturn: `${oneMonthReturn}%`,
            stockRating: recommendation.rating || 'N/A',
            analystTarget: `$${priceTarget.targetMean?.toFixed(2) || '0.00'} (${priceTarget.targetPercent?.toFixed(2) || '0.00'}%)`,
            ratingTrend: {
              buy: recommendation.buy || 0,
              hold: recommendation.hold || 0,
              sell: recommendation.sell || 0,
            },
            quadrant,
            valuationColor,
            olives,
            month: monthName,
          };
        } catch (err) {
          console.warn(`Failed to fetch data for`, err.message, " ", stock.symbol);
          return null;
        }
      })
    );

    const filteredStocks = enrichedStocks.filter(stock => stock !== null && stock !== undefined);

    res.json({ stockOfTheMonth: filteredStocks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stocks of the month' });
  }
};


// exports.getQualityStocks = async (req, res) => {
//   try {
//     const docs = await qualityStocks.findOne({ type: 'quality' });
//     console.log(docs)

//     const results = await Promise.all(docs.stocks.map(async stock => {
//       const [rec, pt] = await Promise.all([
//         axios.get('https://finnhub.io/api/v1/stock/recommendation', { params: { symbol: stock.symbol, token: process.env.FINHUB_API_KEY } }),
//         axios.get('https://finnhub.io/api/v1/stock/price-target', { params: { symbol: stock.symbol, token: process.env.FINHUB_API_KEY } })
//       ]);
//       const latestRec = rec.data[0] || {};
//       const latestPt = pt.data || {};
//               const basicDetails = await getStockDetails({symbol:stock.symbol});
//         const quotePrice = basicDetails.quote?.data?.c;
//       const olive = await Olive.findOne({ symbol: stock.symbol }).exec();

//       // Determine quadrant
//       let quadrant = '';
//       if (olive?.financial_health === "good" && olive?.compatitive_advantage === "good") quadrant = 'Olive Green';
//       else if (olive?.financial_health === "good" && olive?.compatitive_advantage === "bad") quadrant = 'Lime Green';
//       else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "good") quadrant = 'Orange';
//       else if (olive?.financial_health === "bad" && olive?.compatitive_advantage === "bad") quadrant = 'Yellow';

//       // Valuation analysis
//       let valuationColor = 'yellow';
//       if (olive?.fair_value && quotePrice) {
//         const valuationDiff = ((quotePrice - olive.fair_value) / olive.fair_value) * 100;
//         if (valuationDiff < -10) valuationColor = 'green';
//         else if (valuationDiff > 10) valuationColor = 'red';
//       }
//       console.log()

//       // Olive visuals
//       const olives = {
//         financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
//         competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
//         valuation: quotePrice <= olive?.fair_value ? 'green' : 'gray',
//       };

//       return {
//         symbol: stock.symbol,
//         stockRating: latestRec.rating || 'N/A',
//         analystTarget: `$${latestPt.targetMean?.toFixed(2) || '0.00'} (${latestPt.targetPercent?.toFixed(2) || '0.00'}%)`,
//         ratingTrend: {
//           buy: latestRec.buy || 0,
//           hold: latestRec.hold || 0,
//           sell: latestRec.sell || 0
//         },
//         oneMonthReturn: stock.oneMonthReturn || '0.00%', // if stored
//         marketCap: stock.marketCap || '$0',
//         lastRatingDate: stock.updatedAt || '-',
//         sector: stock.sector || 'N/A',
//         quadrant,
//         valuationColor,
//         olives,
//       };
//     }));

//     res.json({ qualityStocks: results });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch quality stocks' });
//   }
// };


exports.getQualityStocks = async (req, res) => {
  try {
    const docs = await qualityStocks.findOne({ type: 'quality' });

    const now = moment();
    const oneMonthAgo = moment().subtract(30, 'days');

    const results = await Promise.all(docs.stocks.map(async (stockEntry) => {
      const symbol = stockEntry.symbol;

      try {
        // Fetch data in parallel
        const [quote, profileRes, recRes, ptRes, candleRes] = await Promise.all([
          axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
          axios.get('https://finnhub.io/api/v1/stock/profile2', {
            params: { symbol, token: process.env.FINHUB_API_KEY },
          }),
          axios.get('https://finnhub.io/api/v1/stock/recommendation', {
            params: { symbol, token: process.env.FINHUB_API_KEY },
          }),
          axios.get('https://finnhub.io/api/v1/stock/price-target', {
            params: { symbol, token: process.env.FINHUB_API_KEY },
          }),
          axios.get('https://finnhub.io/api/v1/stock/candle', {
            params: {
              symbol,
              resolution: 'D',
              from: Math.floor(oneMonthAgo.valueOf() / 1000),
              to: Math.floor(now.valueOf() / 1000),
              token: process.env.FINHUB_API_KEY,
            },
          }),
        ]);
        // console.log( profileRes)

        const profile = profileRes.data;
        const recommendation = recRes.data[0] || {};
        const priceTarget = ptRes.data || {};
        const candles = candleRes.data;

        // Calculate 1-month return
        const closes = candles?.c || [];
        const oneMonthReturn = (closes.length >= 2)
          ? (((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2)
          : '0.00';

        // Olive logic
        const olive = await Olive.findOne({ symbol });
        let quadrant = 'Yellow';
        let valuationColor = 'yellow';

        const quotePrice = closes[closes.length - 1] || 0;
        const fairValue = olive?.fair_value || quotePrice;

        if (olive?.financial_health === "good" && olive?.compatitive_advantage === "good") quadrant = 'Olive Green';
        else if (olive?.financial_health === "good") quadrant = 'Lime Green';
        else if (olive?.compatitive_advantage === "good") quadrant = 'Orange';

        const valuationDiff = ((quotePrice - fairValue) / fairValue) * 100;
        if (valuationDiff < -10) valuationColor = 'green';
        else if (valuationDiff > 10) valuationColor = 'red';

        const olives = {
          financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
          competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
          valuation: quotePrice <= fairValue * 1.1 ? 'green' : 'gray',
        };

        return {
          symbol,
          companyName: profile.name || '',
          logo: profile.logo || '',
          sector: profile.finnhubIndustry || 'N/A',
          marketCap: profile.marketCapitalization
            ? `$${Number(profile.marketCapitalization).toLocaleString()}`
            : '$0',
          oneMonthReturn: `${oneMonthReturn}%`,
          currentPrice: quote.data.c,
          stockRating: recommendation.rating || 'N/A',
          analystTarget: `$${priceTarget.targetMean?.toFixed(2) || '0.00'} (${priceTarget.targetPercent?.toFixed(2) || '0.00'}%)`,
          ratingTrend: {
            buy: recommendation.buy || 0,
            hold: recommendation.hold || 0,
            sell: recommendation.sell || 0,
          },
          lastRatingDate: docs.updatedAt || '-',
          quadrant,
          valuationColor,
          olives,
        };
      } catch (err) {
        console.warn(`Failed to fetch data for ${stockEntry.symbol}`, err.message);
        return null;
      }
    }));

    const filtered = results.filter(r => r !== null);
    res.json({ qualityStocks: filtered });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quality stocks' });
  }
};



exports.oliveStcoksProfolio = async (req, res) => {
  try {
    const docs = await qualityStocks.findOne({ type: 'protfolio' });

    const now = moment();
    const oneMonthAgo = moment().subtract(30, 'days');

    const results = await Promise.all(docs.stocks.map(async (stockEntry) => {
      const symbol = stockEntry.symbol;

      try {
        // Fetch data in parallel
        const [quote, profileRes, recRes, ptRes, candleRes] = await Promise.all([
          axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINHUB_API_KEY}`),
          axios.get('https://finnhub.io/api/v1/stock/profile2', {
            params: { symbol, token: process.env.FINHUB_API_KEY },
          }),
          axios.get('https://finnhub.io/api/v1/stock/recommendation', {
            params: { symbol, token: process.env.FINHUB_API_KEY },
          }),
          axios.get('https://finnhub.io/api/v1/stock/price-target', {
            params: { symbol, token: process.env.FINHUB_API_KEY },
          }),
          axios.get('https://finnhub.io/api/v1/stock/candle', {
            params: {
              symbol,
              resolution: 'D',
              from: Math.floor(oneMonthAgo.valueOf() / 1000),
              to: Math.floor(now.valueOf() / 1000),
              token: process.env.FINHUB_API_KEY,
            },
          }),
        ]);
        // console.log( profileRes)

        const profile = profileRes.data;
        const recommendation = recRes.data[0] || {};
        const priceTarget = ptRes.data || {};
        const candles = candleRes.data;

        // Calculate 1-month return
        const closes = candles?.c || [];
        const oneMonthReturn = (closes.length >= 2)
          ? (((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2)
          : '0.00';

        // Olive logic
        const olive = await Olive.findOne({ symbol });
        let quadrant = 'Yellow';
        let valuationColor = 'yellow';

        const quotePrice = closes[closes.length - 1] || 0;
        const fairValue = olive?.fair_value || quotePrice;

        if (olive?.financial_health === "good" && olive?.compatitive_advantage === "good") quadrant = 'Olive Green';
        else if (olive?.financial_health === "good") quadrant = 'Lime Green';
        else if (olive?.compatitive_advantage === "good") quadrant = 'Orange';

        const valuationDiff = ((quotePrice - fairValue) / fairValue) * 100;
        if (valuationDiff < -10) valuationColor = 'green';
        else if (valuationDiff > 10) valuationColor = 'red';

        const olives = {
          financialHealth: olive?.financial_health === "good" ? 'green' : 'gray',
          competitiveAdvantage: olive?.compatitive_advantage === "good" ? 'green' : 'gray',
          valuation: quotePrice <= fairValue ? 'green' : 'gray',
        };

        return {
          symbol,
          companyName: profile.name || '',
          logo: profile.logo || '',
          currentPrice: quote.data.c,
          sector: profile.finnhubIndustry || 'N/A',
          marketCap: profile.marketCapitalization
            ? `$${Number(profile.marketCapitalization).toLocaleString()}`
            : '$0',
          oneMonthReturn: `${oneMonthReturn}%`,
          stockRating: recommendation.rating || 'N/A',
          analystTarget: `$${priceTarget.targetMean?.toFixed(2) || '0.00'} (${priceTarget.targetPercent?.toFixed(2) || '0.00'}%)`,
          ratingTrend: {
            buy: recommendation.buy || 0,
            hold: recommendation.hold || 0,
            sell: recommendation.sell || 0,
          },
          lastRatingDate: docs.updatedAt || '-',
          quadrant,
          valuationColor,
          olives,
        };
      } catch (err) {
        console.warn(`Failed to fetch data for ${stockEntry.symbol}`, err.message);
        return null;
      }
    }));

    const filtered = results.filter(r => r !== null);
    res.json({ OliveStocks: filtered });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quality stocks' });
  }
}


exports.getFinancialOverview = async (req, res) => {
  try {
    const { symbol } = req.params;
    const token = process.env.FINHUB_API_KEY;

    const { data } = await axios.get('https://finnhub.io/api/v1/stock/financials-reported', {
      params: { symbol, token }
    });

    if (!data?.data?.length) {
      return res.status(404).json({ error: 'No financial data found' });
    }

    const reports = data.data.slice(0, 5); // last 5 quarters or years

    const structured = {
      symbol,
      dates: [],
      incomeStatement: {},
      balanceSheet: {},
      cashFlow: {}
    };
    // console.log( reports[0].report)

    for (const report of reports) {
      const period = moment(report.filedDate).format('MMM YY');
      structured.dates.push(period);

      const sections = [
        { type: 'incomeStatement', source: report.report?.ic || [] },
        { type: 'balanceSheet', source: report.report?.bs || [] },
        { type: 'cashFlow', source: report.report?.cf || [] }
      ];

      sections.forEach(({ type, source }) => {
        for (const item of source) {
          const label = item.label || item.concept;
          if (!structured[type][label]) {
            structured[type][label] = [];
          }
          structured[type][label].push(item.value);
        }
      });
    }

    res.json(structured);

  } catch (err) {
    console.error('Financial overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch financial overview' });
  }
};



exports.getOwnershipOverview = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const breakdown = {
      insiders: 0,
      mutualFunds: 0,
      otherInstitutions: 0,
      publicRetail: 100,
    };

    const topShareHolders = [];
    const topMutualFundHolders = [];
    const topETFHolders = [];

    // === Institutional Ownership (primary)
    const { data: instOwnership } = await axios.get(`https://finnhub.io/api/v1/institutional/ownership`, {
      params: { symbol, token: FINNHUB_API_KEY },
    });
    // console.log( instOwnership.data[0] );

    if (Array.isArray(instOwnership.data)) {
      instOwnership.data.forEach((entry) => {
        // console.log(entry)
        const name = entry.name?.toLowerCase() || '';
        const percent = entry.percent || 0;
        const record = {
          holder: entry.name,
          shares: entry.shares || 0,
          percent: `${percent.toFixed(2)}%`,
          value: `$${Number(entry.marketValue || 0).toLocaleString()}`,
        };

        if (name.includes('etf')) {
          breakdown.otherInstitutions += percent;
          topETFHolders.push({ ...record, type: 'ETF' });
        } else if (name.includes('fund') || name.includes('vanguard') || name.includes('fidelity')) {
          breakdown.mutualFunds += percent;
          topMutualFundHolders.push({ ...record, type: 'Mutual Fund' });
        } else {
          breakdown.otherInstitutions += percent;
          topShareHolders.push({ ...record, type: 'Institutional' });
        }
      });
    }

    breakdown.publicRetail = Math.max(0, 100 - (breakdown.insiders + breakdown.mutualFunds + breakdown.otherInstitutions));

    // === Insider Trades
    const from = moment().subtract(12, 'months').format('YYYY-MM-DD');
    const to = moment().format('YYYY-MM-DD');
    const { data: insiderData } = await axios.get(`https://finnhub.io/api/v1/stock/insider-transactions`, {
      params: { symbol, from, to, token: FINNHUB_API_KEY },
    });
    // console.log( insiderData );

    const insiderTrades = (insiderData.data || []).slice(0, 10).map(trade => ({
      date: moment(trade.transactionDate).format('ll'),
      name: trade.name,
      activity: trade.transactionCode,
      value: `$${Number(trade.transactionPrice || 0).toLocaleString()}`,
    }));

    // === Hedge Fund Ownership (13F)
    const { data: hfOwnership } = await axios.get(`https://finnhub.io/api/v1/stock/ownership`, {
      params: { symbol, token: FINNHUB_API_KEY },
    });
    // console.log( hfOwnership)

    const hedgeFundActivity = (hfOwnership.ownership || []).slice(0, 10).map(h => ({
      date: moment(h.filingDate).format('ll'),
      name: h.name,
      activity: 'Reported',
      value: `$${Number(h.change || 0).toLocaleString()}`,
    }));

    res.json({
      breakdown,
      insiderTrades,
      hedgeFundActivity,
      topShareHolders,
      topMutualFundHolders,
      topETFHolders,
    });
  } catch (err) {
    console.error('Ownership overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch ownership overview' });
  }
};


exports.getOptionsChain = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    // Get available expiration dates
    const { data: expiryData } = await axios.get(
      `https://finnhub.io/api/v1/stock/option-chain`,
      {
        params: { symbol, token: FINNHUB_API_KEY },
      }
    );

    const expirations = expiryData.data?.map((item) => item.expirationDate);
    // console.log(expirations);
    if (!Array.isArray(expiryData.data) || !expiryData.data.length) {
      return res.status(404).json({ error: "No option data available" });
    }

    // Collect formatted output for each expiration
    const optionsByExpiry = await Promise.all(
      expiryData.data.slice(0, 10).map(async (exp) => {
        // console.log(exp);
        // const { expirationDate } = exp;

        // // Fetch full chain data for each expiry
        // const { data: chain } = await axios.get(
        //   `https://finnhub.io/api/v1/stock/option-chain`,
        //   {
        //     params: { symbol, expiration: expirationDate, token: FINNHUB_API_KEY },
        //   }
        // );
        console

        const calls = exp.options.CALL;
        const puts = exp.options.PUT;

        return {
          expirationDate: exp.expirationDate,
          calls: calls.map((opt) => ({
            lastPrice: `$${opt.lastPrice.toFixed(2)}`,
            percentChange: `${opt.changePercent.toFixed(2)}%`,
            volume: opt.volume,
            openInterest: opt.openInterest,
            lastTrade: moment(opt.lastTradeDate).format("MM/DD/YYYY, hh:mm A"),
            strike: opt.strike,
          })),
          puts: puts.map((opt) => ({
            lastPrice: `$${opt.lastPrice.toFixed(2)}`,
            percentChange: `${opt.changePercent.toFixed(2)}%`,
            volume: opt.volume,
            openInterest: opt.openInterest,
            lastTrade: moment(opt.lastTradeDate).format("MM/DD/YYYY, hh:mm A"),
            strike: opt.strike,
          })),
        };
      })
    );

    res.json({
      symbol,
      expirations: expirations || [],
      data: optionsByExpiry,
    });
  } catch (err) {
    console.error("Options chain fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch options data" });
  }
};


// exports.getSimilarStocksAndPerformance = async (req, res) => {
//   try {
//     const { symbol } = req.params;
//     if (!symbol) return res.status(400).json({ error: "Symbol is required" });

//     // 1. Fetch similar companies
//     const { data: similarSymbols } = await axios.get(
//       `https://finnhub.io/api/v1/stock/peers`,
//       {
//         params: { symbol, token: FINNHUB_API_KEY },
//       }
//     );

//     if (!similarSymbols.length)
//       return res.status(404).json({ error: "No similar stocks found" });

//     // Limit to 5-10 for performance
//     const symbols = similarSymbols.slice(0, 5);

//     const results = await Promise.all(
//       symbols.map(async (sym) => {
//         try {
//           const [
//             { data: quote },
//             { data: profile },
//             { data: metrics },
//             { data: recommendation },
//           ] = await Promise.all([
//             axios.get("https://finnhub.io/api/v1/quote", {
//               params: { symbol: sym, token: FINNHUB_API_KEY },
//             }),
//             axios.get("https://finnhub.io/api/v1/stock/profile2", {
//               params: { symbol: sym, token: FINNHUB_API_KEY },
//             }),
//             axios.get("https://finnhub.io/api/v1/stock/metric", {
//               params: { symbol: sym, metric: "all", token: FINNHUB_API_KEY },
//             }),
//             axios.get("https://finnhub.io/api/v1/stock/recommendation", {
//               params: { symbol: sym, token: FINNHUB_API_KEY },
//             }),
//           ]);

//           const analyst = recommendation?.[0] || {};

//           return {
//             ticker: sym,
//             companyName: profile.name,
//             price: quote.c?.toFixed(2),
//             marketCap: metrics.metric?.marketCapitalization
//               ? `$${Number(metrics.metric.marketCapitalization).toFixed(2)}B`
//               : "-",
//             peRatio: metrics.metric?.peNormalizedAnnual?.toFixed(2) || "-",
//             yearlyGain: ((quote.c - quote.pc) / quote.pc * 100).toFixed(2) + "%",
//             analystConsensus: analyst.recommendation || "N/A",
//             analystPriceTarget:
//               analyst.targetMean ? `$${analyst.targetMean.toFixed(2)}` : "-",
//             topAnalystPriceTarget:
//               analyst.targetHigh ? `$${analyst.targetHigh.toFixed(2)}` : "-",
//             change: (quote.c - quote.pc).toFixed(2),
//             percentChange: (((quote.c - quote.pc) / quote.pc) * 100).toFixed(2) + "%",
//           };
//         } catch (error) {
//           console.warn(`Failed fetching for ${sym}`, error.message);
//           return null;
//         }
//       })
//     );

//     const cleaned = results.filter(Boolean);

//     res.json({
//       similarStocks: cleaned,
//       performanceComparison: cleaned.map((s) => ({
//         ticker: s.ticker,
//         companyName: s.companyName,
//         price: s.price,
//         change: s.change,
//         percentChange: s.percentChange,
//       })),
//     });
//   } catch (err) {
//     console.error("Similar stocks fetch error:", err.message);
//     res.status(500).json({ error: "Failed to fetch similar stocks" });
//   }
// };






const getHistoricalPrice = async (symbol, from) => {
  const now = Math.floor(Date.now() / 1000);
  const fromSec = Math.floor(from / 1000);
  try {
    const { data } = await axios.get("https://finnhub.io/api/v1/stock/candle", {
      params: {
        symbol,
        resolution: "D",
        from: fromSec,
        to: now,
        token: FINNHUB_API_KEY,
      },
    });

    if (data.s !== "ok" || !data.c.length) return null;

    return {
      old: data.c[0],
      latest: data.c[data.c.length - 1],
      labels: data.t.map((ts) => new Date(ts * 1000).toISOString().split("T")[0]),
      prices: data.c,
    };
  } catch (err) {
    console.error(`Error getting historical for ${symbol}:`, err.message);
    return null;
  }
};

exports.getSimilarStocksAndPerformance = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = "2y" } = req.query;

    if (!symbol) return res.status(400).json({ error: "Symbol is required" });

    const now = Date.now();
    const durations = {
      "3M": moment(now).subtract(3, "months").toDate().getTime(),
      "6M": moment(now).subtract(6, "months").toDate().getTime(),
      "1Y": moment(now).subtract(1, "year").toDate().getTime(),
      "2Y": moment(now).subtract(2, "years").toDate().getTime(),
    };

    const { data: peers } = await axios.get("https://finnhub.io/api/v1/stock/peers", {
      params: { symbol, token: FINNHUB_API_KEY },
    });

    const symbols = peers.slice(0, 5);

    const fullData = await Promise.all(
      symbols.map(async (sym) => {
        try {
          const [quote, profile, metrics, recs] = await Promise.all([
            axios.get("https://finnhub.io/api/v1/quote", {
              params: { symbol: sym, token: FINNHUB_API_KEY },
            }),
            axios.get("https://finnhub.io/api/v1/stock/profile2", {
              params: { symbol: sym, token: FINNHUB_API_KEY },
            }),
            axios.get("https://finnhub.io/api/v1/stock/metric", {
              params: { symbol: sym, metric: "all", token: FINNHUB_API_KEY },
            }),
            axios.get("https://finnhub.io/api/v1/stock/recommendation", {
              params: { symbol: sym, token: FINNHUB_API_KEY },
            }),
          ]);

          const analyst = recs?.data?.[0] || {};
          const history = {};
          const chartData = await getHistoricalPrice(sym, durations[period.toUpperCase()] || durations["2Y"]);

          for (const [label, from] of Object.entries(durations)) {
            const result = await getHistoricalPrice(sym, from);
            if (result) {
              const { old, latest } = result;
              const change = latest - old;
              const percent = ((change / old) * 100).toFixed(2);
              history[label] = { change: change.toFixed(2), percent: `${percent}%` };
            } else {
              history[label] = { change: "-", percent: "-" };
            }
          }

          return {
            ticker: sym,
            companyName: profile.data.name,
            price: quote.data.c?.toFixed(2),
            marketCap: metrics.data.metric?.marketCapitalization
              ? `$${Number(metrics.data.metric.marketCapitalization).toFixed(2)}B`
              : "-",
            peRatio: metrics.data.metric?.peNormalizedAnnual?.toFixed(2) || "-",
            yearlyGain: history["1Y"]?.percent || "-",
            analystConsensus: analyst.recommendation || "N/A",
            analystPriceTarget: analyst.targetMean ? `$${analyst.targetMean.toFixed(2)}` : "-",
            topAnalystPriceTarget: analyst.targetHigh ? `$${analyst.targetHigh.toFixed(2)}` : "-",
            // performanceComparison: history,
            chartRawPrices: chartData?.prices || [],
            chartPercentReturns: chartData?.prices.map((p) =>
              (((p - chartData.prices[0]) / chartData.prices[0]) * 100).toFixed(2)
            ) || [],
            chartLabels: chartData?.labels || [],
          };
        } catch (err) {
          console.error(`Error loading stock ${sym}:`, err.message);
          return null;
        }
      })
    );

    const valid = fullData.filter(Boolean);

    const labels = valid[0]?.chartLabels || [];
    const rawPriceChart = valid.map((s) => ({
      label: s.ticker,
      data: s.chartRawPrices,
    }));
    const percentReturnChart = valid.map((s) => ({
      label: s.ticker,
      data: s.chartPercentReturns,
    }));

    res.json({
      similarStocks: valid.map((s) => ({
        ticker: s.ticker,
        companyName: s.companyName,
        price: s.price,
        marketCap: s.marketCap,
        peRatio: s.peRatio,
        yearlyGain: s.yearlyGain,
        analystConsensus: s.analystConsensus,
        analystPriceTarget: s.analystPriceTarget,
        topAnalystPriceTarget: s.topAnalystPriceTarget,
        performanceComparison: s.performanceComparison,
      })),
      chartData: {
        labels,
        rawPriceChart,
        percentReturnChart,
      },
    });
  } catch (err) {
    console.error("Full similar stocks error:", err.message);
    res.status(500).json({ error: "Failed to load full similar stocks data" });
  }
};
