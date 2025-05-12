const mongoose = require('mongoose');

const newsAdminSchema = new mongoose.Schema({
    newsTitle:{
        type: String,
    },
    newsDescription:{
        type: String,
    },
    imageLink:{
        type: String,
    },
    views:{
        type: Number,
        default: 0  
    },
},{
    timestamps: true,
});

const newsAdmin = mongoose.model("newsAdmin", newsAdminSchema);
module.exports = newsAdmin;