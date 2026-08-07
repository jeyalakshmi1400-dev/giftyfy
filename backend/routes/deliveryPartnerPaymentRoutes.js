const express = require("express");

const router = express.Router();

const {
  createPaymentRequest,
  getMyPayments,
  getAllPaymentRequests,
  approvePayment,
  rejectPayment,
} = require(
  "../controllers/deliveryPartnerPaymentController"
);

const {
  deliveryAuthMiddleware
} = require("../middleware/deliveryAuthMiddleware");

const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");


// ==========================
// PARTNER
// ==========================
router.post(
  "/request",
  deliveryAuthMiddleware,
  createPaymentRequest
);

router.get(
  "/my",
  deliveryAuthMiddleware,
  getMyPayments
);


// ==========================
// ADMIN
// ==========================
router.get(
  "/all",
  protect,
  adminOnly,
  getAllPaymentRequests
);

router.put(
  "/approve/:id",
  protect,
  adminOnly,
  approvePayment
);

router.put(
  "/reject/:id",
  protect,
  adminOnly,
  rejectPayment
);

module.exports = router;