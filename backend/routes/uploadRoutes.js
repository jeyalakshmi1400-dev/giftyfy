const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

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
  "/custom-images",
  upload.array("extraImages", 5),
  (req, res) => {
    res.json({
      success: true,
      images: req.files.map((file) => file.path),
    });
  }
);

module.exports = router;