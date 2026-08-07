const mongoose = require("mongoose"); // ✅ MUST

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  locations: [{
    city: String,
    pincode: [Number]
  }],

  category: String,
  subcategory: String,
  brand: String,

  price: Number,
  purchasePrice: {
  type: Number,
  default: 0
},
  gst: Number,

  discountType: {
    type: String,
    enum: ["flat", "percentage"],
    default: "flat"
  },

  discountValue: Number,
  finalPrice: Number,

  quantity: Number,

  description: String,

  image: [String],
  isCustomized: {
  type: Boolean,
  default: false,
},

  // ✅ VARIANTS
  variants: [
    {
      color: String,
      images: [String],
      sizes: [
        {
          size: String,
          price: Number,
          quantity: Number
        }
      ]
    }
  ],
  isCustomized: {
  type: Boolean,
  default: false,
},
customization: {
  enableName: {
    type: Boolean,
    default: false,
  },

  enableMessage: {
    type: Boolean,
    default: false,
  },

  enableImage: {
    type: Boolean,
    default: false,
  },

  editorBackground: {
    type: String,
    default: "",
  },

  editorOverlay: {
    type: String,
    default: "",
  },

  photoArea: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
},

customizationFields: [
  {
    type: String,
    enum: [
      "name",
      "message",
      "image"
    ]
  }
],

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);