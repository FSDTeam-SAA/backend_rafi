const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();

//Server Create For Socket.io
const server = createServer(app);
const io = new Server(server);

//auth 
const authRouter = require("./routes/auth.route");

//admin route
const youtubeVideosAdminRouter = require("./routes/youtubeVideosAdmin.route");
const newsLatterRouter = require('./routes/newsLatter.route');
const errorMiddleware = require('./middlewares/error.middlewares')
const adsAdminRouter = require("./routes/ads.route");
const newsRouter = require("./routes/news.route");
const blogRouter = require("./routes/blog.route");
const influencerRouter = require("./routes/influencer.route");
const stocksAdminRouter = require("./routes/stocks.route");
const portfolioRoutes = require("./routes/protfolio.route");


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






//stocks
app.use("/api/v1/stocks", stocksAdminRouter);

//smart Protfolio
app.use('/api/v1', portfolioRoutes);




//Configure the Socket Event and handle the connection
io.on("connection", (socket) => {
  console.log("a user connected",socket.id);
  // Handle disconnect
  socket.on("disconnect", () =>
    console.log("a user disconnected")
  );
  // Handle message
  socket.on("message", (message) =>
    console.log(message)
  );
  // Handle join
  socket.on("join", (room) =>
    console.log(`User joined room ${room}`)
  );
  // Handle leave
  socket.on("leave", (room) =>
    console.log(`User left room ${room}`)
  );
  // // Handle typing
  // socket.on("typing", (room) =>
  //   console.log(`User is typing in room ${room}`)
  // );
  // // Handle stopTyping
  // socket.on("stopTyping", (room) =>
  //   console.log(`User stopped typing in room ${room}`)
  // );
});



// Error handler middleware
app.use(errorMiddleware)

module.exports = { app, server, io };
