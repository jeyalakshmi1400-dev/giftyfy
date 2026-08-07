const express = require("express");
const router = express.Router();

const { getMyRequests, acceptRequest } = require("../controllers/orderRequestController");
const { protectDeliveryPartner } = require("../middleware/deliveryAuthMiddleware");

router.get(
  "/my-requests",
  protectDeliveryPartner,   // 🔥 THIS IS IMPORTANT
  getMyRequests
);

router.put(
  "/accept/:id",
  protectDeliveryPartner,   // 🔥 THIS IS IMPORTANT
  acceptRequest
);

module.exports = router;