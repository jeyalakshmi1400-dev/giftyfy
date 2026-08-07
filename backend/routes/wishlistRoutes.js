const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeWishlistItem,
  moveToCart,
} = require("../controllers/wishlistController");

// ➕ add
router.post("/", addToWishlist);

// 📥 get
router.get("/:userId", getWishlist);

// ❌ delete
router.delete("/remove/:id", removeWishlistItem);

// 🔁 move to cart
router.post("/move-to-cart", moveToCart);

module.exports = router;