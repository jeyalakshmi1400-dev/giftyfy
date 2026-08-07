const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

  name: String,

  email: {
    type: String,
    unique: true
  },

  password: String,

  // ✅ ADD THIS
  role: {
    type: String,
    default: "admin"
  }

});

module.exports = mongoose.model(
  "Admin",
  adminSchema
);