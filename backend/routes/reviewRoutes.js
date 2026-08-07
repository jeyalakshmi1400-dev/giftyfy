const express = require("express");

const router = express.Router();

const {
  getAllReviews,
  toggleReviewBlock,
  getUserReviews,
  getProductReviews,
  getHomeReviews
} = require("../controllers/reviewController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// GET ALL REVIEWS
router.get(
  "/admin",
  protect,
  adminOnly,
  getAllReviews
);

// BLOCK REVIEW
router.put(
  "/block/:id",
  protect,
  adminOnly,
  toggleReviewBlock
);

router.get("/my",protect,getUserReviews);
router.get("/product/:id", getProductReviews);
router.get("/product-home", getHomeReviews);

module.exports = router;