const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required:true
    },
    subcategory:[{
      type:String
    }],
    code :{
      type:String
    },
    date: {
  type: Date,
  default: Date.now
},
image:{
  type:String
},

    status:{
      type:String,
      default:"Active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);