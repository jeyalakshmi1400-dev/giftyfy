const Review = require("../models/Review");

// =======================
// GET ALL REVIEWS
// =======================

const getAllReviews = async (req, res) => {

  try {

    const reviews = await Review.find()

      .populate("user")
      .populate("product")
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};

// =======================
// BLOCK / UNBLOCK REVIEW
// =======================

const toggleReviewBlock = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isBlocked = !review.isBlocked;
    await review.save();

    const updatedReview = await Review.findById(req.params.id)
      .populate("user")
      .populate("product");

    res.json(updatedReview); // 🔥 important
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





const getUserReviews = async (req, res) => {

  try {

    const reviews = await Review.find({
      user: req.user.id
    });

    res.json(reviews);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.id,
      isBlocked: false,
    })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getHomeReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isBlocked: false })
      .populate("user", "name")
      .populate("product", "name")
      .sort({ createdAt: -1 })
      .limit(3);

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllReviews,
  toggleReviewBlock,
  getUserReviews,
  getProductReviews,
  getHomeReviews
};