const express = require("express");

const app = express();

// routes
app.get("/", (req, res) => {
  return res.status(200).json({
    status: true,
    message: "Welcome to the server!",
  });
});

module.exports = app;
