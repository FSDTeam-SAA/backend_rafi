const express = require("express");
const cors = require("cors");

const app = express();
//auth 
const authRouter = require("./routes/auth.route");

//admin route
const youtubeVideosAdminRouter = require("./routes/youtubeVideosAdmin.route");


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

module.exports = app;
