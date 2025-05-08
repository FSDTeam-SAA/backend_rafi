const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/auth.route");

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

// routes
app.get("/", (req, res) => {
  return res.status(200).json({
    status: true,
    message: "Welcome to the server!",
  });
});

// auth routes
app.use("/api/v1/auth", authRouter);

module.exports = app;
