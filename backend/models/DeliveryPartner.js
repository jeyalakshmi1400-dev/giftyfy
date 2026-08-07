const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: { type: String, unique: true },
    password: { type: String, required: true },

    address: String,
    photo: String,

    aadharNumber: String,
    aadharImage: String,

    panNumber: String,
    panImage: String,

    vehicleType: String,
    vehicleNumber: String,

    drivingLicenseNo: String,
    drivingLicenseImage: String,

    pincode: String,

    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
isBlocked: {
  type: Boolean,
  default: false,
},
    isApproved: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    walletBalance: {
  type: Number,
  default: 0,
},
pendingCOD: {
  type: Number,
  default: 0,
},

submittedCOD: {
  type: Number,
  default: 0,
},

totalCODCollected: {
  type: Number,
  default: 0,
},
// Salary Details
salaryType: {
  type: String,
  enum: ["monthly"],
  default: "monthly",
},

monthlySalary: {
  type: Number,
  default: 0,
},
employeeId: {
  type: String,
  unique: true,
},

joiningDate: {
  type: Date,
},

salaryStatus: {
  type: String,
  enum: ["Active", "Inactive"],
  default: "Active",
},
totalDeliveredOrders: {
  type: Number,
  default: 0,
},

totalWithdrawn: {
  type: Number,
  default: 0,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);