const express = require("express");
const router = express.Router();

const {
  loginDeliveryPartner
} = require("../controllers/deliveryPartnerController");

// LOGIN
router.post("/login", loginDeliveryPartner);

module.exports = router;