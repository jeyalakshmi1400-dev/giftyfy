const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  confirmCODOrder,
  getAllPayments
} = require("../controllers/paymentController");

const { protect,adminOnly} = require("../middleware/authMiddleware");

router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);


// Payment failure update
router.post("/failed", protect, markPaymentFailed);

router.post("/confirm-cod", protect, confirmCODOrder);
router.get("/test", (req, res) => {
  res.send("Payment route working ✅");
});
router.get("/all", getAllPayments,adminOnly);


module.exports = router;