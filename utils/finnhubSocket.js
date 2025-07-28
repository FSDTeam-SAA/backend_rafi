const WebSocket = require('ws');
const { EventEmitter } = require ('events');
EventEmitter.defaultMaxListeners = 50; // Avoid MaxListeners warning
const WatchList = require('../models/watchList.model');
const FINNHUB_TOKEN = process.env.FINHUB_API_KEY;

const finnhubSocket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_TOKEN}`);

function sendSubscribeMessage(symbol) {
  if (finnhubSocket.readyState === WebSocket.OPEN) {
    console.log( `Sending subscribe message for ${symbol}` );
    finnhubSocket.send(JSON.stringify({ type: 'subscribe-news', symbol }));
  } else {
    finnhubSocket.on('open', () => {
        // console.log(symbol)
      finnhubSocket.send(JSON.stringify({ type: 'subscribe-news', symbol }));
    });
  }
}

const subscribeSymbol = (symbol) => {
  finnhubSocket.send(JSON.stringify({ type: 'subscribe', symbol }));
};

async function subscribeAllDistinctSymbols() {
  try {
    // Step 1: Flatten all stock symbols from all watchlists
    const allWatchlists = await WatchList.find({}, { stocks: 1 });

    const allSymbols = allWatchlists
      .flatMap(w => w.stocks.map(stock => stock.symbol))
      .filter(Boolean); // Remove undefined/null

    // Step 2: Get unique symbols
    const uniqueSymbols = [...new Set(allSymbols)];

    // Step 3: Subscribe each unique symbol to Finnhub socket
    uniqueSymbols.forEach(symbol => {
      sendSubscribeMessage(symbol);
    });

    console.log(`✅ Subscribed to ${uniqueSymbols.length} unique symbols`);
  } catch (error) {
    console.error("Error subscribing to distinct symbols:", error);
  }
}

module.exports = {
  sendSubscribeMessage,
  finnhubSocket,
  subscribeSymbol,
  subscribeAllDistinctSymbols
};
