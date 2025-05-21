const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
newsTitle: { type: String, required: true },
newsDescription: { type: String, required: true },
newsImage: { type: String, required: true },
// date: { type: Date, default: Date.now },
views: { type: Number, default: 0 },
tickers: { type: String, required: true },
// author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);