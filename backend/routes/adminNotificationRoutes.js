const express = require("express");

const router = express.Router();

const {
  getAdminNotifications,
} = require(
  "../controllers/adminNotificationController"
);
const { protect,adminOnly } = require("../middleware/authMiddleware");


router.get(
  "/notifications",
  protect,
  adminOnly,
  getAdminNotifications
);

module.exports = router;