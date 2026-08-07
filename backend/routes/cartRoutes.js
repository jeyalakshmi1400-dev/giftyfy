const express = require("express");
const router = express.Router();

const multer = require("multer");

const {
  addToCart,
  getCart,
  removeFromCart,
  moveUndeliverableProducts,
} = require("../controllers/cartController");

const {
  protect,
} = require("../middleware/authMiddleware");

// ✅ MULTER STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        file.originalname
    );
  },
});

const upload = multer({ storage });

// ✅ ROUTES
router.post(
  "/add",
  protect,
  upload.array("extraImages", 5),
  addToCart
);

router.get("/", protect, getCart);

router.delete(
  "/remove/:id",
  protect,
  removeFromCart
);
router.post(
  "/move-undeliverable",
  protect,
  moveUndeliverableProducts
);

module.exports = router;