const express = require("express");

const router = express.Router();

const {
  getMyNotifications,
  hideNotification,
  clearReturnNotifications
} = require(
  "../controllers/notificationController"
);

const {
  deliveryAuthMiddleware
} = require(
  "../middleware/deliveryAuthMiddleware"
);


// ==============================
// GET MY NOTIFICATIONS
// ==============================
router.get(
  "/my",
  deliveryAuthMiddleware,
  getMyNotifications
);


// ==============================
// HIDE SINGLE NOTIFICATION
// ==============================
router.put(
  "/hide/:id",
  deliveryAuthMiddleware,
  hideNotification
);


// ==============================
// CLEAR RETURN NOTIFICATIONS
// ==============================
router.put(
  "/clear-returns",
  deliveryAuthMiddleware,
  clearReturnNotifications
);

module.exports = router;