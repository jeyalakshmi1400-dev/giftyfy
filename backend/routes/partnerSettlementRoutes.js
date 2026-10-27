const express = require("express");

const router = express.Router();

const {
  settlePartnerPayment,
  getPartnerSummary,
  getPartnerSettlementHistory,
} = require("../controllers/partnerSettlementController");

// =========================
// PARTNER SETTLEMENT
// =========================

// Admin settles partner payment
router.post(
  "/partner-settlement",
  settlePartnerPayment
);

// Summary of all partners
router.get(
  "/partner-summary",
  getPartnerSummary
);

// Settlement history
router.get(
  "/partner-settlement-history",
  getPartnerSettlementHistory
);

module.exports = router;