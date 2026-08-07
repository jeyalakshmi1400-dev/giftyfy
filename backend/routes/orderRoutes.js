const express = require("express");
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  assignDeliveryPartner,
  acceptOrder,
  updateDeliveryStatus,
  cancelOrder,
  processRefund,
  getuserOrders,
  requestReturn,
  getReturnOrders,
  assignReturnPickup,
  getReturnPickupOrders,
  markReturnPickedUp,
  refundReturnedOrder,
  submitReview,
  delayOrder,
  cancelOrderByDelivery,
  verifyOtp,
  completeDelivery ,
  acceptReturnOrder,
  bulkStatusUpdate
 
} = require("../controllers/orderController");
const upload = require("../middleware/upload");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const { deliveryAuthMiddleware } = require("../middleware/deliveryAuthMiddleware");

// 🧑 USER
router.post(
  "/",
  protect,
  upload.single("extraImage"),
  placeOrder
);
router.get("/my-orders", protect, getMyOrders);
router.get("/user-orders", protect, getuserOrders);

// 👑 ADMIN
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);
router.put("/bulk-status", deliveryAuthMiddleware, bulkStatusUpdate);
router.put("/:id/assign", protect, adminOnly, assignDeliveryPartner);
router.put("/:id/refund", protect, adminOnly, processRefund);

// 🚚 DELIVERY
router.put("/:id/accept", deliveryAuthMiddleware, acceptOrder);
router.post(
  "/:id/verify-otp",
  deliveryAuthMiddleware,
  verifyOtp
);
router.put(
  "/:id/complete-delivery",
  deliveryAuthMiddleware,
  completeDelivery
);
router.put("/:id/delivery-status", deliveryAuthMiddleware, updateDeliveryStatus);
router.put(
  "/cancel/:id",
  protect,
  cancelOrder
);
router.put(
  "/return/:id",
  protect,
  requestReturn
);

router.put(
  "/:id/accept-return",
  deliveryAuthMiddleware,   // ✅ THIS IS MUST
  acceptReturnOrder
);
router.get("/returns", protect, adminOnly, getReturnOrders);
router.put(
  "/assign-return/:id",
  protect,
  adminOnly,
  assignReturnPickup
);


router.get(
  "/return-pickups",
  deliveryAuthMiddleware,
  getReturnPickupOrders
);


router.put(
  "/:id/return-picked",
  deliveryAuthMiddleware,
  markReturnPickedUp
);

router.put(
  "/refund/:id",
  protect,
  adminOnly,
  refundReturnedOrder
);
router.post(
  "/review/:id",
  protect,
  submitReview
);
router.put("/:id/delay", deliveryAuthMiddleware, delayOrder);
router.put(
  "/:id/cancel",
  deliveryAuthMiddleware,
  cancelOrderByDelivery
);


module.exports = router;