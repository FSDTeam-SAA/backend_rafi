const mongoose = require('mongoose');

const settingAdminSchema = new mongoose.Schema({
    firstName:{
        type: String,
    },
        lastName:{
        type: String,
    },
    email:{
        type: String,
    },
    phone:{
        type: String,
    },
    bio:{
        type: String,
    },
    imageLink:{
        type: String,
    },
},{
    timestamps: true,
});

const settingAdmin = mongoose.model("settingAdmin", settingAdminSchema);
module.exports = newsAdmin;