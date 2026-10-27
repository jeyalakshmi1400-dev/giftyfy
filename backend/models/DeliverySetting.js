const mongoose = require("mongoose");

const deliveryZoneSchema = new mongoose.Schema({
  zoneName: {
    type: String,
    required: true,
  },

  states: [
    {
      type: String,
      required: true,
    },
  ],

  onlineCharge: {
    type: Number,
    required: true,
    default: 0,
  },

  codCharge: {
    type: Number,
    required: true,
    default: 0,
  },
});

const deliverySettingSchema = new mongoose.Schema(
  {
    zones: [deliveryZoneSchema],

    freeDeliveryAmount: {
      type: Number,
      default: 999,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DeliverySetting",
  deliverySettingSchema
);