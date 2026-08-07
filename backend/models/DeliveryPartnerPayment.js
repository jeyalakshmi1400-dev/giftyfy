const mongoose = require("mongoose");

const deliveryPartnerPaymentSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    codSubmittedAt: {
  type: Date,
  default: null,
},

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DeliveryPartnerPayment",
  deliveryPartnerPaymentSchema
);