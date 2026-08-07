const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,

    amount: Number,

    // ✅ ADD THIS
    method: String, // UPI / Card / Netbanking
    email: String,
    contact: String,

    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);