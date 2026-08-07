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




// ✅ GET ALL COD ORDERS
exports.getAdminCODOrders = async (
  req,
  res
) => {

  try {

    const orders = await Order.find({

      paymentMethod: "COD",

      status: "Delivered"

    })

    .populate(
      "user",
      "name email phone"
    )

    .populate(
      "deliveryPartner",
      "name phone"
    )

    .sort({ createdAt: -1 });

    // FORMAT
  const formattedOrders = orders.map((order) => ({
  _id: order._id,
  customer: order.name,
  phone: order.user?.phone,
  amount: order.totalAmount,
  adminAmount: order.adminAmount || 0,
  deliveryPartnerName: order.deliveryPartner?.name,
  codStatus: order.codStatus,
  items: order.items,

  // ✅ ADD THESE
  codUTR: order.codSettlement?.utr || "",
  codCollectionMethod: order.codCollectionMethod,

  codScreenshot:
    order.codSettlement?.screenshot || "",

  submittedAt:
    order.codSettlement?.submittedAt || null,
}));

    res.json({

      success: true,

      orders: formattedOrders

    });

  } catch (error) {

    console.log(
      "ADMIN COD FETCH ERROR 👉",
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};

exports.verifyCODSettlement = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.codStatus !== "Submitted") {
      return res.status(400).json({
        success: false,
        message: "COD not submitted yet",
      });
    }

    // Update Order
    order.codStatus = "Settled";

    if (!order.codSettlement) {
      order.codSettlement = {};
    }

    order.codSettlement.approvedAt = new Date();

    await order.save();

    // Update Payment Request also
    await DeliveryPartnerPayment.updateOne(
      {
        orders: order._id,
        status: "Pending",
      },
      {
        $set: {
          status: "Approved",
          approvedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "COD verified successfully",
    });

  } catch (error) {
    console.log("VERIFY COD ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};