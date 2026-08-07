const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Full Name
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    // Email
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/,
    },

    // Mobile Number
    phone: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
    },

    // Address
    address: {
      type: String,
      required: true,
      trim: true,
    },

    // City
    city: {
      type: String,
      required: true,
      trim: true,
    },

    // State
    state: {
      type: String,
      required: true,
      trim: true,
    },

    // Pincode
    pincode: {
      type: String,
      required: true,
      match: /^[1-9][0-9]{5}$/,
    },

    // Address Type
    type: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home",
    },

    // Default Address
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Address", addressSchema);