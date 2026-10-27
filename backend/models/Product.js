const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC DETAILS
    // =========================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    subcategory: {
      type: String,
      default: "",
    },

    brand: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    // =========================
    // DELIVERY COVERAGE
    // =========================
    deliveryType: {
      type: String,
      enum: ["all", "pincode"],
      default: "all",
    },

    locations: [
      {
        state: {
          type: String,
          default: "",
        },

        city: {
          type: String,
          default: "",
        },

        pincode: [
          {
            type: Number,
          },
        ],
      },
    ],

    // =========================
    // PRICE
    // =========================
    price: {
      type: Number,
      default: 0,
    },

    purchasePrice: {
      type: Number,
      default: 0,
    },

    gst: {
      type: Number,
      default: 0,
    },

    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      default: "flat",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    finalPrice: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    // =========================
    // PHOTO FRAME SIZES
    // =========================
    frameSizes: [
      {
        size: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          default: 0,
        },

        purchasePrice: {
          type: Number,
          default: 0,
        },

        quantity: {
          type: Number,
          default: 0,
        },

        width: {
          type: Number,
          default: 0,
        },

        height: {
          type: Number,
          default: 0,
        },

        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // =========================
    // IMAGES
    // =========================
    image: [String],

    // =========================
    // VARIANTS (Dress etc.)
    // =========================
    variants: [
      {
        color: {
          type: String,
          default: "",
        },

        images: [String],

        sizes: [
          {
            size: {
              type: String,
              default: "",
            },

            price: {
              type: Number,
              default: 0,
            },

            purchasePrice: {
              type: Number,
              default: 0,
            },

            quantity: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],

    // =========================
    // PERSONALIZATION
    // =========================
    isCustomized: {
      type: Boolean,
      default: false,
    },

    customizationFields: [
      {
        type: String,
        enum: ["name", "message", "image"],
      },
    ],

    customization: {
  templateImage: { type: String, default: "" },
  maskImage: { type: String, default: "" },
  allowMove: { type: Boolean, default: true },
  allowZoom: { type: Boolean, default: true },
  allowRotate: { type: Boolean, default: true },
  enabled: { type: Boolean, default: false },
  backgroundSource: { type: String, default: "" },
  canvasWidth: { type: Number, default: 0 },
  canvasHeight: { type: Number, default: 0 },
  imageAreas: { type: [mongoose.Schema.Types.Mixed], default: [] },
  textAreas: { type: [mongoose.Schema.Types.Mixed], default: [] },
  printableArea: { type: mongoose.Schema.Types.Mixed, default: {} },
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);