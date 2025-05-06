const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const dbConnection = require("./db/dbConnection");
const app = require("./app");

const PORT = process.env.PORT || 5001;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ urlencoded: true }));
app.use(cors({ origin: "*" }));

app.listen(PORT, async () => {
  await dbConnection();
  console.log(`Server is running on http://localhost:${PORT}`);
});
