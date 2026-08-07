const express = require("express");
const router = express.Router();

const {
  createAddress,
  getAddresses,
  deleteAddress,
  updateAddress,
} = require("../controllers/addressController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createAddress);
router.get("/", protect, getAddresses);
router.delete("/:id", protect, deleteAddress);
router.put("/:id", protect, updateAddress);

module.exports = router;