const express = require("express");
const router = express.Router();

const {
  getAllDeliveryPartners,
  approveDeliveryPartner
} = require("../controllers/deliveryPartnerController");

router.get("/", getAllDeliveryPartners);
router.put("/approve/:id", approveDeliveryPartner);

module.exports = router;