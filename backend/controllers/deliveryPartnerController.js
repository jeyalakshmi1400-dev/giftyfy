const DeliveryPartner = require("../models/DeliveryPartner");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Notification = require("../models/Notification");

const DeliveryRejectHistory = require("../models/DeliveryRejectHistory");



const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



// ✅ APPROVE DELIVERY PARTNER
const approveDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body; // true / false

    const partner = await DeliveryPartner.findById(id);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    partner.isApproved = isApproved;
    await partner.save();

    res.json({
      message: isApproved
        ? "Partner approved"
        : "Partner rejected",
      partner,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// REGISTER
const registerDeliveryPartner = async (req, res) => {
  try {

    console.log("BODY 👉", req.body);
    console.log("FILES 👉", req.files);

    const {
      name,
      phone,
      email,
      password,
      address,
      pincode,
      aadharNumber,
      panNumber,
      vehicleType,
      vehicleNumber,
      drivingLicenseNo,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode
    } = req.body;

    const existingPartner =
      await DeliveryPartner.findOne({
        email
      });

    if (existingPartner) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const partner =
      await DeliveryPartner.create({

        name,
        phone,
        email,
        password: hashedPassword,
        address,
        pincode: Array.isArray(pincode)
  ? pincode.map(String)
  : pincode
    ? [String(pincode)]
    : [],
        aadharNumber,
        panNumber,
        vehicleType,
        vehicleNumber,
        drivingLicenseNo,
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,

        photo:
          req.files?.photo?.[0]?.filename || "",

        aadharImage:
          req.files?.aadharImage?.[0]?.filename || "",

        panImage:
          req.files?.panImage?.[0]?.filename || "",

        drivingLicenseImage:
          req.files?.drivingLicenseImage?.[0]?.filename || "",
      });

    res.status(201).json({
      success: true,
      partner
    });

  } catch (err) {

    console.log(
      "REGISTER ERROR 👉",
      err
    );

    res.status(500).json({
      message: err.message
    });
  }
};
// LOGIN
const loginDeliveryPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (!partner.isApproved) {
      return res.status(403).json({ message: "Admin approval pending" });
    }
     if (partner.isBlocked) {

      return res.status(403).json({
        message:
          "Your account has been blocked by admin"
      });

    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: partner._id, role: "delivery" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, partner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ GET PARTNERS BY PINCODE (USED IN ORDER)
const getPartnersByPincode = async (pincode) => {
  return await DeliveryPartner.find({
    pincode: pincode,
    isApproved: true,
    isAvailable: true
  });
};

const getAllDeliveryPartners = async (req, res) => {
  try {
    const partners = await DeliveryPartner.find().sort({ createdAt: -1 });

    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDeliveryPartnerById = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(partner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyOrders = async (req, res) => {

  try {

    console.log("REQ PARTNER 👉", req.partner);

    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res.status(400).json({
        message: "Partner not found in request"
      });
    }

    const orders = await Order.find({
      deliveryPartner: partnerId
    })
    .populate("user")
    .populate("items.product")
    .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {

    console.log("DELIVERY FETCH ERROR 👉", error);

    res.status(500).json({
      message: error.message
    });

  }

};

const getDeliveryReports = async (req, res) => {
  try {

    const partnerId = req.partner._id;

    const orders = await Order.find({
      deliveryPartner: partnerId,
      status: "Delivered"   // 🔥 THIS IS THE MAIN FIX
    })
    .populate("user")
    .populate("items.product")
    .sort({ deliveredAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getMyProfile = async (req, res) => {

  try {

    console.log("REQ.PARTNER 👉", req.partner);

    const partner = await DeliveryPartner.findById(
      req.partner._id
    ).select("-password");

    if (!partner) {

      return res.status(404).json({
        message: "Partner not found"
      });

    }

    res.json({
      success: true,
      partner
    });

  } catch (error) {

    console.log("PROFILE ERROR 👉", error);

    res.status(500).json({
      message: error.message
    });

  }

};


const updateMyProfile = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(
      req.partner._id
    );

    if (!partner) {
      return res.status(404).json({
        message: "Partner not found",
      });
    }

    // ============================
    // BASIC PROFILE FIELDS
    // ============================

    if (req.body.name !== undefined) {
      partner.name = req.body.name;
    }

    if (req.body.phone !== undefined) {
      partner.phone = req.body.phone;
    }

    if (req.body.email !== undefined) {
      partner.email = req.body.email;
    }

    if (req.body.vehicleNumber !== undefined) {
      partner.vehicleNumber =
        req.body.vehicleNumber;
    }

    // ============================
    // MULTIPLE PINCODES
    // ============================

    if (Array.isArray(req.body.pincode)) {
      partner.pincode = [
        ...new Set(
          req.body.pincode
            .map((pin) => String(pin).trim())
            .filter((pin) => /^\d{6}$/.test(pin))
        ),
      ];
    }

    // ============================
    // OPTIONAL PHOTO
    // ============================

    if (req.file) {
      partner.photo = req.file.filename;
    }

    await partner.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      partner,
    });

  } catch (error) {
    console.log(
      "UPDATE PROFILE ERROR 👉",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getDashboardData = async (req, res) => {

  try {

    const partnerId = req.partner._id;

    // ======================
    // ALL ORDERS
    // ======================
    const orders = await Order.find({
      deliveryPartner: partnerId
    });

    // TOTAL ORDERS
    const totalOrders = orders.length;

    // PENDING
    const pendingOrders = orders.filter(
      (order) =>
        order.status === "Assigned" ||
        order.status === "Out for Delivery"
    ).length;

    // DELIVERED
    const deliveredOrders = orders.filter(
      (order) =>
        order.status === "Delivered"
    ).length;

    // CANCELLED
    const cancelledOrders = orders.filter(
      (order) =>
        order.status === "Cancelled"
    ).length;

    // RETURNED
    const returnedOrders = orders.filter(
      (order) =>
        order.status === "Returned"
    ).length;

// ======================
// PENDING COD AMOUNT
// ======================

const pendingCODAmount = orders
  .filter(
    (order) =>
      order.paymentMethod === "COD" &&
      order.status === "Delivered" &&
      order.codStatus === "Collected"
  )
  .reduce(
    (sum, order) =>
      sum + Number(order.totalAmount || 0),
    0
  );
    // ======================
    // DELIVERED ORDERS DATA
    // ======================
    const deliveredOrdersData =
      await Order.find({

        deliveryPartner: partnerId,

        status: "Delivered",

      });



orders.forEach((order) => {

  // ✅ Normal delivery earning
  if (order.status === "Delivered") {

   
  }

  // ✅ Return pickup earning
  if (
    order.returnStatus === "Returned"
  ) {



  }

});


    // ======================
    // CHART DATA
    // ======================
    const hourlyData = {};

    deliveredOrdersData.forEach((order) => {

      const hour =
        new Date(order.updatedAt)
          .getHours();

      const label =
        `${hour}:00`;

      hourlyData[label] =
        (hourlyData[label] || 0) + 1;

    });

    // FINAL CHART DATA
    const chartData =
      Object.keys(hourlyData).map(
        (time) => ({

          time,

          value: hourlyData[time],

        })
      );


    // ======================
    // PIE CHART DATA
    // ======================
    const orderStatus = [

      {
        name: "Pending",
        value: pendingOrders,
      },

      {
        name: "Return",
        value: returnedOrders,
      },

      {
        name: "Cancel",
        value: cancelledOrders,
      },

      {
        name: "Complete",
        value: deliveredOrders,
      },

    ];


    // ======================
    // RESPONSE
    // ======================
    res.json({

  success: true,

  totalOrders,
  pendingOrders,
  deliveredOrders,

  pendingCODAmount,

  chartData,
  orderStatus,

});

  } catch (error) {

    console.log(
      "DASHBOARD ERROR 👉",
      error
    );

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};


// ✅ GET DELIVERY PARTNER COD ORDERS
const getCODOrders = async (req, res) => {

  try {

    const partnerId = req.partner._id;

    // COD ORDERS ONLY
const orders = await Order.find({
  deliveryPartner: partnerId,
  paymentMethod: "COD",
  status: "Delivered",
})
.populate("user", "name email phone")
.populate("items.product")   // 🔥 ADD THIS
.sort({ createdAt: -1 });

const formattedOrders = orders.map((order) => ({
  _id: order._id,
  orderId: order.orderId,
  customer: order.name || "Customer",
  email: order.user?.email || "-",
  phone: order.user?.phone || "-",

  address: order.address,

  amount: order.totalAmount,
  earning: order.deliveryEarning || 30,

    codStatus: order.codStatus || "Pending",

  date: new Date(order.createdAt).toLocaleDateString(),

  // ✅ ADD THESE
  codUTR: order.codSettlement?.utr || "",
  codScreenshot:
    order.codSettlement?.screenshot || "",
  codSubmittedAt: order.codSubmittedAt,


  items: order.items
}));

    // STATS
    const totalOrders =
      formattedOrders.length;

    const collectedAmount =
      formattedOrders.reduce(
        (acc, item) =>
          acc + item.amount,
        0
      );

    const pendingSettlement =
  formattedOrders
    .filter(
      (item) =>
        item.codStatus === "Pending"
    )

        .reduce(
          (acc, item) =>
            acc + item.amount,
          0
        );

  

    res.json({

      success: true,

      orders: formattedOrders,

      stats: {

        totalOrders,

        collectedAmount,

        pendingSettlement,

       

      },

    });

  } catch (error) {

    console.log(
      "COD FETCH ERROR 👉",
      error
    );

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};


// ✅ SUBMIT COD TO ADMIN

const submitCOD = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { utr } = req.body;

    // Find Order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Already submitted
    if (
      order.codStatus === "Submitted" ||
      order.codStatus === "Settled"
    ) {
      return res.status(400).json({
        success: false,
        message: "COD already submitted",
      });
    }

    // Find Delivery Partner
    const partner = await DeliveryPartner.findById(
      order.deliveryPartner
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }



    // Deduct Wallet
   
    await partner.save();

    // Update Order
    order.codStatus = "Submitted";

    order.codSettlement = {
      utr,
      screenshot: req.file
        ? req.file.filename
        : "",
      submittedAt: new Date(),
    };

    await order.save();

    res.json({
      success: true,
      message:
        "COD transfer request submitted successfully",
     
      
      order,
    });

  } catch (error) {

    console.log(
      "SUBMIT COD ERROR 👉",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};





// ✅ BLOCK / UNBLOCK DELIVERY PARTNER
const blockDeliveryPartner =
async (req, res) => {

  try {

    const { id } = req.params;

    const partner =
      await DeliveryPartner.findById(id);

    if (!partner) {

      return res.status(404).json({
        message: "Partner not found"
      });

    }

    // TOGGLE
    partner.isBlocked =
      !partner.isBlocked;

    await partner.save();

    res.json({

      success: true,

      message:
        partner.isBlocked
          ? "Partner blocked"
          : "Partner unblocked",

      partner

    });

  } catch (error) {

    console.log(
      "BLOCK ERROR 👉",
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};

const deleteDeliveryPartner =
async (req, res) => {

  try {

    const partner =
      await DeliveryPartner.findById(
        req.params.id
      );

    if (!partner) {

      return res.status(404).json({
        message: "Partner not found"
      });

    }

    await partner.deleteOne();

    res.json({
      success: true,
      message:
        "Delivery partner deleted"
    });

  } catch (error) {

    console.log(
      "DELETE ERROR 👉",
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};

const rejectNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "Delivery partner not authenticated",
      });
    }

    // Match notification using the actual schema field: partner
    const notification = await Notification.findOne({
      _id: notificationId,
      partner: partnerId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found for this delivery partner",
      });
    }

    // Save rejection history for this partner and order.
    // Avoid duplicate records for the same partner + order.
    await DeliveryRejectHistory.findOneAndUpdate(
      {
        order: notification.order,
        deliveryPartner: partnerId,
      },
      {
        $set: {
          reason: "Rejected by Delivery Partner",
        },
        $setOnInsert: {
          order: notification.order,
          deliveryPartner: partnerId,
          rejectedAt: new Date(),
        },
      },
      {
  upsert: true,
  returnDocument: "after",
}
    );

    // Remove only this partner's notification
    await Notification.findByIdAndDelete(notificationId);

    return res.json({
      success: true,
      message: "Order rejected successfully",
    });
  } catch (err) {
    console.error("rejectNotification ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



const getRejectedOrders = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const orders = await DeliveryRejectHistory.find({
      deliveryPartner: partnerId,
    })
      .populate("order")
      .sort({ rejectedAt: -1 })
      .lean();

    // Order document கிடைக்காத பழைய records-ஐ UI-க்கு அனுப்ப வேண்டாம்
    const validOrders = orders.filter(
      (item) => item.order && item.order._id
    );

    return res.json(validOrders);
  } catch (err) {
    console.error("getRejectedOrders ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

const getCancelledOrders = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const orders = await Order.find({
      deliveryPartner: partnerId,
      deliveryCancelled: true,
    })
      .populate("user")
      .sort({ deliveryCancelledAt: -1 });

    res.json(orders);

  } catch (error) {
    console.log("CANCEL ORDERS ERROR =>", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
const updateMonthlySalary = async (req, res) => {
  try {
    const { monthlySalary } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { monthlySalary },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery Partner not found",
      });
    }

    res.json({
      success: true,
      message: "Monthly salary updated successfully",
      partner,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

codSettledAt: Date,
module.exports = {
    registerDeliveryPartner,
  loginDeliveryPartner,
  getAllDeliveryPartners,
  approveDeliveryPartner,
  getPartnersByPincode,
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  getMyOrders,
  getDeliveryReports,
  getMyProfile,
  getDashboardData,
  getCODOrders,
  submitCOD,
  blockDeliveryPartner,
  deleteDeliveryPartner,
  updateMyProfile,
  rejectNotification,
  getCancelledOrders,
  updateMonthlySalary ,
  getRejectedOrders,
};