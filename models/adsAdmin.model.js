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
},{
    timestamps: true,
});

const adsAdmin = mongoose.model("adsAdmin", adsAdminSchema);
module.exports = adsAdmin;