const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const DeliveryPartnerPayment = require("../models/DeliveryPartnerPayment");

const DeliveryPartner =
  require("../models/DeliveryPartner");
/* REGISTER ADMIN */
exports.registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await Admin.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await Admin.create({
    name,
    email,
    password: hashedPassword
  });

  res.json({ message: "Admin registered successfully", admin });
};

/* LOGIN ADMIN */
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(400).json({ message: "Admin not found" });
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const token = jwt.sign(
    { id: admin._id, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, admin });
};



const approveDeliveryPartner = async (req, res) => {
  const partner = await DeliveryPartner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({ message: "Partner not found" });
  }

  partner.isApproved = true;
  await partner.save();

  res.json({
    message: "Delivery partner approved successfully"
  });
};




// =====================================================
// GET ADMIN COD ORDERS
// =====================================================
exports.getAdminCODOrders = async (req, res) => {
  try {
    // =================================================
    // 1. GET DELIVERED COD ORDERS
    // =================================================
    const orders = await Order.find({
      paymentMethod: "COD",
      status: "Delivered",
    })
      .populate("user", "name email phone")
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 });

    // =================================================
    // 2. TODAY DATE RANGE
    // =================================================
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // =================================================
    // 3. FORMAT ORDERS
    // =================================================
    const formattedOrders = orders.map((order) => {
      const submittedAt =
        order.codSubmittedAt ||
        order.codSettlement?.submittedAt ||
        null;

      const verifiedAt =
        order.codSettlement?.approvedAt ||
        null;

      const amount = Number(order.totalAmount || 0);

      const adminAmount = Number(
        order.adminAmount || 0
      );

      const deliveryEarning = Number(
        order.deliveryEarning || 0
      );

      const deliveryPartnerId =
        order.deliveryPartner?._id ||
        order.codCollectedBy ||
        null;

      const deliveryPartnerName =
        order.deliveryPartner?.name ||
        "Not Assigned";

      const deliveryPartnerPhone =
        order.deliveryPartner?.phone ||
        "";

      return {
        _id: order._id,
        orderId: order.orderId,

        // ---------------------------------------------
        // CUSTOMER
        // ---------------------------------------------
        customer:
          order.user?.name ||
          order.name ||
          "Customer",

        phone:
          order.user?.phone ||
          order.phone ||
          "",

        // ---------------------------------------------
        // AMOUNTS
        // ---------------------------------------------
        amount,

        adminAmount,

        adminRevenue: adminAmount,

        deliveryEarning,

        // ---------------------------------------------
        // DELIVERY PARTNER
        // ---------------------------------------------
        deliveryPartnerId,

        deliveryPartnerName,

        deliveryPartnerPhone,

        codCollectedBy:
          order.codCollectedBy || null,

        // ---------------------------------------------
        // COD STATUS
        // ---------------------------------------------
        codStatus:
          order.codStatus || "Collected",

        codCollectionMethod:
          order.codCollectionMethod || "",

        // ---------------------------------------------
        // SETTLEMENT DATES
        // ---------------------------------------------
        submittedAt,

        verifiedAt,

        codSubmittedAt:
          order.codSubmittedAt || null,

        // ---------------------------------------------
        // COD PAYMENT DETAILS
        // ---------------------------------------------
        codUTR:
          order.codSettlement?.utr || "",

        codScreenshot:
          order.codSettlement?.screenshot || "",

        // ---------------------------------------------
        // ORDER DETAILS
        // ---------------------------------------------
        items: order.items || [],

        createdAt:
          order.createdAt || null,

        deliveredAt:
          order.deliveredAt || null,
      };
    });

    // =================================================
    // 4. BASIC TOTALS
    // =================================================

    const totalCODCollected =
      formattedOrders.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    const totalAdminRevenue =
      formattedOrders.reduce(
        (sum, order) =>
          sum + Number(order.adminAmount || 0),
        0
      );

    // =================================================
    // 5. STATUS GROUPS
    // =================================================

    const submittedOrders =
      formattedOrders.filter(
        (order) =>
          order.codStatus === "Submitted"
      );

    const settledOrders =
      formattedOrders.filter(
        (order) =>
          order.codStatus === "Settled"
      );

    const collectedOrders =
      formattedOrders.filter(
        (order) =>
          order.codStatus === "Collected"
      );

    const rejectedOrders =
      formattedOrders.filter(
        (order) =>
          order.codStatus === "Rejected"
      );

    // =================================================
    // 6. ADMIN PENDING
    //
    // Collected  = partner collected cash,
    //              but has NOT paid admin
    //
    // Submitted  = partner paid/submitted,
    //              but admin has NOT verified
    //
    // Settled    = admin verified
    //
    // Therefore:
    //
    // Collected + Submitted = ADMIN PENDING
    // =================================================

    const pendingOrdersList =
      formattedOrders.filter(
        (order) =>
          order.codStatus === "Collected" ||
          order.codStatus === "Submitted"
      );

    const pendingAmount =
      pendingOrdersList.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    // =================================================
    // 7. STATUS AMOUNTS
    // =================================================

    const submittedAmount =
      submittedOrders.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    const settledAmount =
      settledOrders.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    const collectedAmount =
      collectedOrders.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    const rejectedAmount =
      rejectedOrders.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    // =================================================
    // 8. TODAY SUBMITTED
    // =================================================

    const todaySubmittedOrders =
      formattedOrders.filter((order) => {
        if (!order.submittedAt) {
          return false;
        }

        const date =
          new Date(order.submittedAt);

        return (
          date >= todayStart &&
          date <= todayEnd
        );
      });

    const todaySubmittedAmount =
      todaySubmittedOrders.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    // =================================================
    // 9. TODAY VERIFIED
    // =================================================

    const todayVerifiedOrders =
      formattedOrders.filter((order) => {
        if (!order.verifiedAt) {
          return false;
        }

        const date =
          new Date(order.verifiedAt);

        return (
          date >= todayStart &&
          date <= todayEnd
        );
      });

    const todayVerifiedAmount =
      todayVerifiedOrders.reduce(
        (sum, order) =>
          sum + Number(order.amount || 0),
        0
      );

    // =================================================
    // 10. DELIVERY PARTNER SUMMARY
    // =================================================

    const partnerMap = {};

    formattedOrders.forEach((order) => {
      if (!order.deliveryPartnerId) {
        return;
      }

      const partnerId =
        String(order.deliveryPartnerId);

      // -----------------------------------------------
      // CREATE PARTNER
      // -----------------------------------------------
      if (!partnerMap[partnerId]) {
        partnerMap[partnerId] = {
          partnerId,

          partnerName:
            order.deliveryPartnerName ||
            "Unknown Partner",

          phone:
            order.deliveryPartnerPhone ||
            "",

          // Total customer COD collected
          totalCollected: 0,

          // Partner submitted to admin
          submittedAmount: 0,

          // Admin verified
          verifiedAmount: 0,

          // Still pending with admin
          pendingAmount: 0,

          // Rejected
          rejectedAmount: 0,

          totalOrders: 0,

          submittedOrders: 0,

          verifiedOrders: 0,

          pendingOrders: 0,

          rejectedOrders: 0,

          lastPaymentDate: null,
        };
      }

      const partner =
        partnerMap[partnerId];

      const amount =
        Number(order.amount || 0);

      // -----------------------------------------------
      // TOTAL COD COLLECTED
      // -----------------------------------------------
      partner.totalCollected += amount;

      partner.totalOrders += 1;

      // -----------------------------------------------
      // SUBMITTED
      // -----------------------------------------------
      if (
        order.codStatus === "Submitted"
      ) {
        partner.submittedAmount += amount;

        partner.submittedOrders += 1;
      }

      // -----------------------------------------------
      // ADMIN PENDING
      //
      // Collected + Submitted
      // -----------------------------------------------
      if (
        order.codStatus === "Collected" ||
        order.codStatus === "Submitted"
      ) {
        partner.pendingAmount += amount;

        partner.pendingOrders += 1;
      }

      // -----------------------------------------------
      // SETTLED / VERIFIED
      // -----------------------------------------------
      if (
        order.codStatus === "Settled"
      ) {
        partner.verifiedAmount += amount;

        partner.verifiedOrders += 1;
      }

      // -----------------------------------------------
      // REJECTED
      // -----------------------------------------------
      if (
        order.codStatus === "Rejected"
      ) {
        partner.rejectedAmount += amount;

        partner.rejectedOrders += 1;
      }

      // -----------------------------------------------
      // LAST PAYMENT DATE
      //
      // Latest partner submission date
      // -----------------------------------------------
      if (order.submittedAt) {
        const currentDate =
          new Date(order.submittedAt);

        if (
          !partner.lastPaymentDate ||
          currentDate >
            new Date(partner.lastPaymentDate)
        ) {
          partner.lastPaymentDate =
            order.submittedAt;
        }
      }
    });

    // =================================================
    // 11. PARTNER SUMMARY ARRAY
    // =================================================

    const partnerSummary =
      Object.values(partnerMap).sort(
        (a, b) =>
          b.totalCollected -
          a.totalCollected
      );

    // =================================================
    // 12. TOTAL PARTNERS
    // =================================================

    const totalPartners =
      partnerSummary.length;

    // =================================================
    // 13. RESPONSE
    // =================================================

    return res.json({
      success: true,

      orders: formattedOrders,

      summary: {
        // ---------------------------------------------
        // TOTALS
        // ---------------------------------------------
        totalOrders:
          formattedOrders.length,

        totalCODCollected,

        totalAdminRevenue,

        // ---------------------------------------------
        // SUBMITTED
        // ---------------------------------------------
        submittedAmount,

        submittedOrders:
          submittedOrders.length,

        // ---------------------------------------------
        // SETTLED
        // ---------------------------------------------
        settledAmount,

        settledOrders:
          settledOrders.length,

        // ---------------------------------------------
        // COLLECTED
        // ---------------------------------------------
        collectedAmount,

        collectedOrders:
          collectedOrders.length,

        // ---------------------------------------------
        // REJECTED
        // ---------------------------------------------
        rejectedAmount,

        rejectedOrders:
          rejectedOrders.length,

        // ---------------------------------------------
        // ADMIN PENDING
        //
        // Collected + Submitted
        // ---------------------------------------------
        pendingAmount,

        pendingOrders:
          pendingOrdersList.length,

        // ---------------------------------------------
        // TODAY SUBMITTED
        // ---------------------------------------------
        todaySubmittedAmount,

        todaySubmittedOrders:
          todaySubmittedOrders.length,

        // ---------------------------------------------
        // TODAY VERIFIED
        // ---------------------------------------------
        todayVerifiedAmount,

        todayVerifiedOrders:
          todayVerifiedOrders.length,

        // ---------------------------------------------
        // PARTNERS
        // ---------------------------------------------
        totalPartners,
      },

      // -----------------------------------------------
      // DELIVERY PARTNER SUMMARY
      // -----------------------------------------------
      partnerSummary,
    });
  } catch (error) {
    console.error(
      "GET ADMIN COD ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch COD orders",
      error: error.message,
    });
  }
};


// =====================================================
// ADMIN - VERIFY COD SETTLEMENT
// =====================================================

// =====================================================
// VERIFY COD SETTLEMENT
// Admin verifies delivery partner submitted COD payment
// =====================================================
exports.verifyCODSettlement = async (req, res) => {
  try {
    const { orderId } = req.params;

    // -------------------------------------------------
    // 1. Find order
    // -------------------------------------------------
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // -------------------------------------------------
    // 2. Only SUBMITTED payment can be verified
    // -------------------------------------------------
    if (order.codStatus !== "Submitted") {
      return res.status(400).json({
        success: false,
        message:
          "Only submitted COD payments can be verified.",
      });
    }

    // -------------------------------------------------
    // 3. Make sure codSettlement object exists
    // -------------------------------------------------
    if (!order.codSettlement) {
      order.codSettlement = {};
    }

    // -------------------------------------------------
    // 4. Verify / Settle COD
    // -------------------------------------------------
    const verifiedDate = new Date();

    order.codStatus = "Settled";

    order.codSettlement.approvedAt = verifiedDate;

    // Keep submitted date if already available
    if (!order.codSettlement.submittedAt && order.codSubmittedAt) {
      order.codSettlement.submittedAt = order.codSubmittedAt;
    }

    // -------------------------------------------------
    // 5. Save order
    // -------------------------------------------------
    await order.save();

    // -------------------------------------------------
    // 6. Approve related DeliveryPartnerPayment
    // -------------------------------------------------
    await DeliveryPartnerPayment.updateOne(
      {
        orders: { $in: [order._id] },
        status: "Pending",
      },
      {
        $set: {
          status: "Approved",
          approvedAt: verifiedDate,
        },
      }
    );

    // -------------------------------------------------
    // 7. Response
    // -------------------------------------------------
    return res.json({
      success: true,
      message: "COD payment verified successfully",

      order: {
        _id: order._id,
        orderId: order.orderId,

        // Before: Submitted
        // After: Settled
        codStatus: order.codStatus,

        amount: Number(order.totalAmount || 0),

        deliveryPartner:
          order.deliveryPartner || null,

        codSubmittedAt:
          order.codSubmittedAt ||
          order.codSettlement?.submittedAt ||
          null,

        submittedAt:
          order.codSettlement?.submittedAt ||
          order.codSubmittedAt ||
          null,

        verifiedAt:
          order.codSettlement?.approvedAt ||
          verifiedDate,

        codSettlement: {
          utr: order.codSettlement?.utr || "",
          screenshot:
            order.codSettlement?.screenshot || "",
          submittedAt:
            order.codSettlement?.submittedAt ||
            order.codSubmittedAt ||
            null,
          approvedAt:
            order.codSettlement?.approvedAt ||
            verifiedDate,
          rejectReason:
            order.codSettlement?.rejectReason || "",
        },
      },
    });
  } catch (error) {
    console.error(
      "VERIFY COD SETTLEMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to verify COD payment",
      error: error.message,
    });
  }
};