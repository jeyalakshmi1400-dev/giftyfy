const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  getAdminCODOrders,
  verifyCODSettlement
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* AUTH */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/* PROTECTED ADMIN APIs */
router.get("/dashboard", protect, adminOnly, (req, res) => {
  res.json({ message: "Admin dashboard" });
});

router.get("/profile", protect, adminOnly, (req, res) => {
  res.json({ message: "Admin profile" });
});
// GET COD ORDERS
router.get(
  "/cod-orders",
  getAdminCODOrders
);

// VERIFY COD
router.put(
  "/verify-cod/:orderId",
  verifyCODSettlement
);

module.exports = router;