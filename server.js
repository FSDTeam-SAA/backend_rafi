const express = require("express");
const dbConnection = require("./db/dbConnection");
const dotenv = require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
  return res.status(200).json({ 
    status: true, 
    message: "Welcome to the server!" 
    });
});

app.listen(PORT, async() => {
  await dbConnection();
  console.log(`Server is running on http://localhost:${PORT}`);
});
