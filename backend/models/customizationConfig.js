const mongoose = require("mongoose");

// Plain object (used as `customization: customizationConfig` in Product.js)
// Without the new fields below, mongoose silently DROPS imageAreas / textAreas on save.
const customizationConfig = {
  // old fields
  templateImage: { type: String, default: "" },
  maskImage: { type: String, default: "" },
  printableArea: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    rotation: { type: Number, default: 0 },
  },
  allowMove: { type: Boolean, default: true },
  allowZoom: { type: Boolean, default: true },
  allowRotate: { type: Boolean, default: true },

  // new fields (visual personalization editor)
  enabled: { type: Boolean, default: false },
  backgroundSource: { type: String, default: "" }, // "template" | "product"
  canvasWidth: { type: Number, default: 0 },
  canvasHeight: { type: Number, default: 0 },
  imageAreas: { type: [mongoose.Schema.Types.Mixed], default: [] },
  textAreas: { type: [mongoose.Schema.Types.Mixed], default: [] },
};

module.exports = customizationConfig;