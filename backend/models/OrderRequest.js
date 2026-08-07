const mongoose = require("mongoose");

const orderRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner"
    },
    status: {
      type: String,
      default: "Pending" // Pending / Accepted / Rejected
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderRequest", orderRequestSchema);