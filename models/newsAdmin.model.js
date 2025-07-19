const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
newsTitle: { type: String, required: true },
newsDescription: { type: String, required: true },
newsImage: { type: String, },
// date: { type: Date, default: Date.now },
views: { type: Number, default: 0 },
symbol: { type: String},
source : { type: String, },
isPaid: { type: Boolean, default: false },
// author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
lang : {type: String}
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);