const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
    type: String,
    unique: true,
    required: true,
  },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    name: {
  type: String,
  default: "",
},
items: [
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },

    quantity: Number,

    name: String,

    price: Number,
 purchasePrice: {
      type: Number,
      default: 0
    },
    originalPrice: Number,

    // GST DETAILS
gst: {
  type: Number,
  default: 0
},

taxablePrice: {
  type: Number,
  default: 0
},

gstAmount: {
  type: Number,
  default: 0
},

discountValue: {
  type: Number,
  default: 0
},

    image: String,

    size: String,

    variant: String, 

    // ✅ CUSTOM MESSAGE
    message: {
      type: String,
      default: ""
    },

    // ✅ EXTRA IMAGES
    extraImages: [
      {
        type: String
      }
    ],

  // ✅ CUSTOMIZED PRODUCT
isCustomized: {
  type: Boolean,
  default: false
},

customName: {
  type: String,
  default: ""
},
  }
],

    // 💰 BILL
    subtotal: Number,
    discount: Number,
  gst:{
 type:Number,
 default:0
},

delivery:{
 type:Number,
 default:0
},
    totalAmount: Number,

    // 📍 ADDRESS
    deliveryPincode: String,
    address: String,
    phone: String,

    // 🚚 ORDER STATUS
status: {
  type: String,
  default: "Pending"
},
customizationStatus: {
  type: String,

  enum: [
    "Not Required",
    "Requested",
    "Approved",
    "Rejected",
    "In Progress",
    "Completed"
  ],

  default: "Not Required"
},
    // 🚚 DELIVERY PARTNER
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      default: null
    },

    deliveryEarning: {
      type: Number,
      default: 30
    },

    deliveryEarningAdded: {
  type: Boolean,
  default: false
},

    deliveredAt: {
      type: Date
    },
    deliveryPaymentClaimed: {
  type: Boolean,
  default: false
},

    // 💳 PAYMENT
    paymentMethod: {
      type: String,
      default: "COD"
    },
    paymentStatus: {
  type: String,
  enum: ["Pending", "Paid", "Failed"],
  default: "Pending"
},
// 💰 COD SETTLEMENT
codStatus: {
  type: String,
  enum: [
    "Collected",
    "Submitted",
    "Settled",
    "Rejected"
  ],
  default: "Collected"
},

codSettlement: {
  utr: String,
  screenshot: String,
  submittedAt: Date,
  approvedAt: Date,
  rejectReason: String
},

codSubmittedAt: {
  type: Date
},


codCollectedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "DeliveryPartner"
},

giftWrap:{
 type:Boolean,
 default:false
},

giftMessage:{
 type:String,
 default:""
},

giftWrapCharge:{
 type:Number,
 default:0
},
adminAmount: {
  type: Number,
  default: 0
},


//=========================
// DELIVERY PARTNER SETTLEMENT
// =========================
partnerPaid: {
  type: Boolean,
  default: false,
},

partnerPaidDate: {
  type: Date,
  default: null,
},

partnerSettlementId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "PartnerSettlement",
  default: null,
},


    // 🎁 COUPON
    couponUsed: String,

    // =========================
    // 🔥 RETURN / REFUND
    // =========================

    returnRequested: {
      type: Boolean,
      default: false
    },

    returnReason: {
      type: String,
      default: ""
    },

    returnStatus: {
      type: String,
     enum: [
  "Not Requested",
  "Requested",
  "Pickup Assigned",
  "Picked Up",
  "Returned"
],
      default: "Not Requested"
    },
refundStatus: {
  type: String,
  enum: ["Pending", "Processed"],
  default: "Pending"
},

    refundAmount: {
      type: Number,
      default: 0
    },

    refundDate: {
      type: Date
    },
    otpRequested: {
  type: Boolean,
  default: false,
},

    otp: {
  type: String,
  default: null,
},
otpVerified: {
  type: Boolean,
  default: false,
},

deliveryStage: {
  type: String,
  enum: ["OTP_PENDING", "OTP_VERIFIED", "DELIVERED"],
  default: "OTP_PENDING",
},

deliveryMethod: {
  type: String,
  default: ""
},


codCollectionMethod: {
  type: String,
  default: ""
},

deliveryNotes: {
  type: String,
  default: ""
},
    deliveryCancelled: {
  type: Boolean,
  default: false
},

deliveryCancelReason: {
  type: String,
  default: ""
},

deliveryCancelledAt: {
  type: Date
}
,
    delayReason: {
  type: String,
  default: "",
},

rescheduleDate: String,

rescheduleTime: String,

isDelayed: {
  type: Boolean,
  default: false,
},

    // =========================
// ORDER CANCELLATION
// =========================
cancelReason: {
  type: String,
  default: "",
},

cancelledBy: {
  type: String,
 enum: ["Admin", "User", "Delivery Partner"],
  default: null,
},

cancelledAt: {
  type: Date,
  default: null,
},

// =========================
// DELIVERY PARTNER CANCELLATION
// =========================
deliveryCancelled: {
  type: Boolean,
  default: false,
},

deliveryCancelReason: {
  type: String,
  default: "",
},

deliveryCancelledAt: {
  type: Date,
  default: null,
},

  },
  

  
  { timestamps: true }
);

module.exports = mongoose.model(
  "Order",
  orderSchema
);