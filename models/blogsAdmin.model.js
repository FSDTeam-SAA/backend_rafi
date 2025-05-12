const mongoose = require('mongoose');

const blogsAdminSchema = new mongoose.Schema({
    blogTitle:{
        type: String,
    },
    blogDescription:{
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

const blogsAdmin = mongoose.model("blogsAdmin", blogsAdminSchema);
module.exports = blogsAdmin;