
const express = require("express");
const router = express.Router();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const {
  addToCart,
  getCart,
  removeFromCart,
  moveUndeliverableProducts,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "giftyfy/custom-images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
  },
});

const upload = multer({
  storage,
  limits: {
    files: 5,
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/add",
  protect,
  upload.array("extraImages", 5),
  addToCart
);

router.get("/", protect, getCart);

router.delete("/remove/:id", protect, removeFromCart);

router.post(
  "/move-undeliverable",
  protect,
  moveUndeliverableProducts
);

module.exports = router;
