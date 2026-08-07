const express = require("express");
const router = express.Router();

const { createOffer, getOffers } = require("../controllers/offerController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public
router.get("/", getOffers);

// Admin only
router.post("/", protect, adminOnly, createOffer);

module.exports = router;