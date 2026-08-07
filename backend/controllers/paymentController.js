const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Order = require("../models/Order");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ===========================
// 1️⃣ CREATE RAZORPAY ORDER
// ===========================
const createPaymentOrder = async (req, res) => {

  try {

const { amount } = req.body;

const razorpayAmount = Math.round(Number(amount) * 100);

console.log("Razorpay Amount:", razorpayAmount);

const options = {
  amount: razorpayAmount,
  currency: "INR",
};

const razorpayOrder = await razorpay.orders.create(options);

    // ✅ SEND RESPONSE
    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      razorpayOrder
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message
    });
  }
};

// ===========================
// 2️⃣ VERIFY PAYMENT (TEMP BYPASS)
// ===========================
const verifyPayment = async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body.toString())
      .digest("hex");

    // ❌ INVALID SIGNATURE
    if (
      expectedSignature !==
      razorpay_signature
    ) {

      return res.status(400).json({
        success: false,
        message: "Invalid signature ❌"
      });

    }

    // ✅ SUCCESS
    res.json({
      success: true,
      message: "Payment verified successfully"
    });

  } catch (error) {

    console.log(
      "VERIFY ERROR 👉",
      error
    );

    res.status(500).json({
      message: error.message
    });

  }
};

const markPaymentFailed = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    const payment = await Payment.findOne({ razorpay_order_id });

    if (payment) {
      payment.status = "Failed";
      await payment.save();
    }

    res.json({ message: "Payment marked failed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const confirmCODOrder = async (req, res) => {
  try {

    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (order.status === "Confirmed") {
      return res.status(400).json({
        message: "Order already confirmed"
      });
    }

    order.status = "Confirmed";
    order.paymentMethod = "COD";
    order.paymentStatus = "Pending";

    await order.save();

    // ✅ CREATE PAYMENT ENTRY
    await Payment.create({
      user: order.user,
      order: order._id,
      amount: order.totalAmount,
      method: "COD",
      status: "Pending"
    });

    res.json({
      message: "COD order confirmed",
      order
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

// ===========================
// 🧾 ADMIN - GET ALL PAYMENTS
// ===========================
const getAllPayments = async (req, res) => {
  try {

    const payments = await Payment.find()
      .populate("user")
      .populate("order")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


module.exports = {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  confirmCODOrder,
  getAllPayments,
};