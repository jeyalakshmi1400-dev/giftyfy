const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },

  name: String,

  // ✅ IMAGE
  image: String,

  // ✅ PRICE
  price: Number,
  originalPrice: Number,
  discountType: String,
  discountValue: Number,

  // ✅ 🔥 ADD THIS (VERY IMPORTANT)
  size: String,
  variant: String, // color
  sizeQuantity: Number,

  stockStatus: {
    type: String,
    enum: ["In Stock", "Out of Stock"],
    default: "In Stock",
  },

  category: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Wishlist", wishlistSchema);