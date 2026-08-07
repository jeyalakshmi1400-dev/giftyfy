const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
    image:{
        type:String,
        required:true,

    },
    createAt:{
        type:Date,
        default:Date.now,
    },
    isActive: {
  type: Boolean,
  default: false
},
});

module.exports = mongoose.model("Banner",bannerSchema);