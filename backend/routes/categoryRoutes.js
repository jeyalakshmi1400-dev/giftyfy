const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  getCategories,
  createCategory,
  toggleCategoryStatus,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const { protectDeliveryPartner } = require("../middleware/deliveryAuthMiddleware");

// PUBLIC
router.get("/", getCategories);

// ADMIN ONLY
router.post("/", protect, adminOnly,upload.single("image"), createCategory);

router.put("/block/:id",protect,adminOnly,toggleCategoryStatus);

router.put("/:id",protect,adminOnly,upload.single("image"),updateCategory);

router.delete("/:id",protect,adminOnly,deleteCategory)

module.exports = router;