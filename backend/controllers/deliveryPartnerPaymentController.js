const DeliveryPartnerPayment = require("../models/DeliveryPartnerPayment");
const DeliveryPartner = require("../models/DeliveryPartner");
const Order = require("../models/Order");

// ============================
// CREATE COD PAYMENT REQUEST
// ============================
exports.createPaymentRequest = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const {
      selectedOrders,
      notes,
    } = req.body;

    if (
      !selectedOrders ||
      selectedOrders.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one order",
      });
    }

    // Pending request check
    const alreadyPending =
      await DeliveryPartnerPayment.findOne({
        partner: partnerId,
        status: "Pending",
      });

    if (alreadyPending) {
      return res.status(400).json({
        success: false,
        message:
          "Already one COD request is pending.",
      });
    }

    // Fetch selected orders
    const orders = await Order.find({
      _id: {
        $in: selectedOrders,
      },
      deliveryPartner: partnerId,
      codStatus: "Collected",
    });

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid COD orders found.",
      });
    }

    // Calculate Total COD
 const amount = orders.reduce(
  (sum, order) =>
    sum + Number(order.totalAmount || 0),
  0
);
    // Create Payment Request
const payment =
await DeliveryPartnerPayment.create({
  partner: partnerId,
  amount,
  orders: selectedOrders,
   notes,
   codSubmittedAt: new Date(),
});

    // Mark Orders Submitted
    await Order.updateMany(
      {
        _id: {
          $in: selectedOrders,
        },
      },
      {
        codStatus: "Submitted",
        codSubmittedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message:
        "COD submitted successfully.",
      payment,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};



// ============================
// MY COD HISTORY
// ============================
exports.getMyPayments = async (req, res) => {
  try {

    const partnerId = req.partner._id;

    const payments = await DeliveryPartnerPayment.find({
      partner: partnerId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
    });

  } catch (err) {
    console.log(err);   // முழு error print ஆகும்
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ============================
// ADMIN - ALL REQUESTS
// ============================
exports.getAllPaymentRequests = async (req, res) => {
  try {

    const payments = await DeliveryPartnerPayment.find()
      .populate("partner")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error"
    });
  }
};



// ============================
// APPROVE COD PAYMENT
// ============================
exports.approvePayment = async (req, res) => {
  try {

    const payment =
      await DeliveryPartnerPayment.findById(
        req.params.id
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment request not found",
      });
    }

    if (payment.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Already processed",
      });
    }

 

    payment.status = "Approved";
    payment.approvedAt = new Date();

    await payment.save();

    res.json({
      success: true,
      message: "COD Settlement Approved Successfully",
    });

  } catch (error) {

    console.log("APPROVE ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};


// ============================
// REJECT COD PAYMENT
// ============================
exports.rejectPayment = async (req, res) => {
  try {

    const payment =
      await DeliveryPartnerPayment.findById(
        req.params.id
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment request not found",
      });
    }

    if (payment.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Already processed",
      });
    }

    // Back to Collected
    await Order.updateMany(
      {
        _id: {
          $in: payment.orders,
        },
      },
      {
        codStatus: "Collected",
        codSubmittedAt: null,
      }
    );

    payment.status = "Rejected";
    payment.rejectedAt = new Date();

    await payment.save();

    res.json({
      success: true,
      message: "COD Settlement Rejected",
    });

  } catch (error) {

    console.log("REJECT ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};