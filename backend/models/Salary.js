const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    // Delivery Partner Reference
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      required: true,
    },

    // Salary Month & Year
    month: {
      type: Number, // 1 = January, 6 = June
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    // Salary Details
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
// Attendance
presentDays: {
  type: Number,
  default: 0,
},

absentDays: {
  type: Number,
  default: 0,
},

// Orders
totalDeliveredOrders: {
  type: Number,
  default: 0,
},

// Extra Salary
bonus: {
  type: Number,
  default: 0,
},
    incentive: {
      type: Number,
      default: 0,
    },

    deduction: {
      type: Number,
      default: 0,
    },

    totalSalary: {
      type: Number,
      required: true,
    },
paymentMethod: {
  type: String,
  enum: ["Bank Transfer", "UPI", "Cash", ""],
  default: "",
},
    // Payment Status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    paidDate: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ஒரு partner-க்கு ஒரே month/year-க்கு ஒரு salary record மட்டும்
salarySchema.index({ partnerId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Salary", salarySchema);