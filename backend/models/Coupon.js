const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },

  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
}],

  // 🔥 NEW FIELD
  firstOrderOnly: { type: Boolean, default: false },
   user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

description: { type: String, default: "" },
}, { timestamps: true });

module.exports =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);