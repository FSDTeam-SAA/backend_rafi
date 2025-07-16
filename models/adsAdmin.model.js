const mongoose = require('mongoose');

const adsAdminSchema = new mongoose.Schema({
    adsTitle:{
        type: String,
    },
    adsContent:{
        type: String,
    },
    imageLink:{
        type: String,
    },
    publish:{
        type: Boolean,
        default: false 
    },
    views:{
        type: Number,
        default: 0
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true
    },
    url:{
        type: String
    }
},{
    timestamps: true,
});

const adsAdmin = mongoose.model("adsAdmin", adsAdminSchema);
module.exports = adsAdmin;