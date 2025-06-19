const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const WebSocket = require('ws');

const app = express();

//Server Create For Socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//auth 
const authRouter = require("./routes/auth.route");
const userRouter = require("./routes/user.route");

//admin route
const youtubeVideosAdminRouter = require("./routes/youtubeVideosAdmin.route");
const newsLatterRouter = require('./routes/newsLatter.route');
const errorMiddleware = require('./middlewares/error.middlewares')
const adsAdminRouter = require("./routes/ads.route");
const newsRouter = require("./routes/news.route");
const blogRouter = require("./routes/blog.route");
const influencerRouter = require("./routes/influencer.route");
const stocksAdminRouter = require("./routes/stocks.route");
const paymentRouter = require("./routes/payments.route")
const subscriptionRouter = require("./routes/subscriptionPlan.route");

const portfolioRoutes = require("./routes/protfolio.route");
const financialStatementsRoutes = require("./routes/financialStatements.route");
const oliveRoutes = require("./routes/olive.route");
const { default: axios } = require("axios");



// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

// routes
app.get("/", (req, res) => {
  return res.status(200).json({
    status: true,
    message: "Welcome to the server, mr. rafi!",
  });
});

// auth routes
app.use("/api/v1/auth", authRouter);

//admin dashboard 
app.use("/api/v1/admin/youtubeVideos", youtubeVideosAdminRouter);

// newsletter 
app.use("/api/v1", newsLatterRouter)

// ads
app.use('/api/v1/admin/ads', adsAdminRouter)

//news
app.use("/api/v1/admin/news", newsRouter);

//blog
app.use("/api/v1/admin/blog", blogRouter);

//influencer
app.use("/api/v1/admin/influencer", influencerRouter);

// subscriptionPlan 
app.use("/api/v1", subscriptionRouter)

// payments APIs
app.use('/api/v1',paymentRouter)

// financial statements
app.use('/api/v1', financialStatementsRoutes)


//stocks
app.use("/api/v1/stocks", stocksAdminRouter);

//smart Protfolio
app.use('/api/v1', portfolioRoutes);

app.use("/api/v1",oliveRoutes)

app.use('/api/v1/user',userRouter)




const FINNHUB_TOKEN = process.env.FINHUB_API_KEY; // Replace with your real key

// Map to store open prices
const openPrices = new Map();

// Create Finnhub WebSocket
const finnhubSocket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_TOKEN}`);

// Subscribe to symbol updates
const subscribeSymbol = (symbol) => {
  finnhubSocket.send(JSON.stringify({ type: 'subscribe', symbol }));
};

// Get open price via REST API
const fetchOpenPrice = async (symbol) => {
  try {
    const { data } = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: { symbol, token: FINNHUB_TOKEN }
    });
        const { data:data2 } = await axios.get(`https://finnhub.io/api/v1/stock/profile2`, {
      params: { symbol, token: FINNHUB_TOKEN }
    });
    // console.log(data, symbol)
    const profile = {
      pc: data.pc,
      logo: data2.logo,
      name: data2.name,
    }
    if (data && data.pc) {
      openPrices.set(symbol, profile);
    }
    io.emit("stockUpdate",{
        symbol,
        currentPrice : data.c,
        change: data.d,
        percent: data.dp,
        logo: data2.logo,
        name: data2.name

    })
  } catch (err) {
    console.error(`Failed to fetch open price for ${symbol}:`, err.message);
  }
};

// WebSocket message from Finnhub
finnhubSocket.on('message', (data) => {
  const parsed = JSON.parse(data);
  console.log(parsed)
  if (parsed.type === 'trade') {
    parsed.data.forEach((trade) => {
      const symbol = trade.s;
      const currentPrice = trade.p;
      const openPrice = openPrices.get(symbol);


      if (!openPrice) return;

      const change = (currentPrice - openPrice.pc).toFixed(2);
      const percent = ((change / openPrice.pc) * 100).toFixed(2);

      io.emit('stockUpdate', {
        symbol,
        currentPrice,
        change,
        percent,
        logo: openPrice.logo,
        name: openPrice.name
      });
    });
  }
});

// Socket.IO connection
io.on('connection', async (socket) => {
  console.log('User connected:', socket.id);

  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA','AMZN']; // Add your stock symbols here

  // Fetch opening prices once at connection
  for (const symbol of symbols) {
    await fetchOpenPrice(symbol);
    subscribeSymbol(symbol);
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});



// Error handler middleware
app.use(errorMiddleware)

module.exports = { app, server, io };
