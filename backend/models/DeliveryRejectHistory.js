const mongoose = require("mongoose");

const deliveryRejectHistorySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      required: true,
    },

    reason: {
      type: String,
      default: "Rejected by Delivery Partner",
    },

    rejectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DeliveryRejectHistory",
  deliveryRejectHistorySchema
);