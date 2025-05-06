const mongoose = require('mongoose');
const dotenv = require('dotenv');

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URI);
    console.log('db is connected');
  } catch (error) {
    console.error('db connection failure:', error);
  }
}

module.exports = dbConnection;