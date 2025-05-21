const express = require("express");
const cors = require("cors");

const app = express();
//auth 
const authRouter = require("./routes/auth.route");

//admin route
const youtubeVideosAdminRouter = require("./routes/youtubeVideosAdmin.route");
const newsLatterRouter = require('./routes/newsLatter.route');
const errorMiddleware = require('./middlewares/error.middlewares')
const adsAdminRouter = require("./routes/ads.route");
const newsRouter = require("./routes/news.route");
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
app.use("/api/v1/admin/ads", adsAdminRouter);

//news
app.use("/api/v1/admin/news", newsRouter);

// Error handler middleware
app.use(errorMiddleware)

module.exports = app;
