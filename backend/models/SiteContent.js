const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {

    companyName: {
  type: String,
  default: "Giftyfy",
},
    aboutTitle: {
      type: String,
      default: "",
    },

    aboutDescription: {
      type: String,
      default: "",
    },

    contactEmail: {
      type: String,
      default: "",
    },

    contactPhone: {
      type: String,
      default: "",
    },

    contactAddress: {
      type: String,
      default: "",
    },

    instagram: {
      type: String,
      default: "",
    },

    facebook: {
      type: String,
      default: "",
    },

    whatsapp: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SiteContent",
  siteContentSchema
);