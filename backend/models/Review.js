const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(

  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    rating: Number,

    comment: String,

    isBlocked: {
      type: Boolean,
      default: false,
    }

  },

  { timestamps: true }

);

module.exports = mongoose.model(
  "Review",
  reviewSchema
);