const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  

  quantity: Number,

  // 🔥 snapshot data
  name: String,
  image: String,

  price: Number,
  originalPrice: Number,

  size: { 
    type: String,
    default: null,
  },

  variant: {
    type: String,
    default: null,
  },

  // ✅ CUSTOM MESSAGE
  message: {
    type: String,
    default: "",
  },
  customName: {
  type: String,
  default: "",
},


  // ✅ EXTRA IMAGES
  extraImages: [
    {
      type: String,
    },
  ],

  // ✅ CUSTOMIZED ORDER
  isCustomized: {
    type: Boolean,
    default: false,
  },

  discountType: {
    type: String,
    enum: ["flat", "percentage"],
    default: "flat",
  },

  discountValue: Number,

  gst: Number,
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  items: [cartItemSchema],
});

module.exports = mongoose.model("Cart", cartSchema);