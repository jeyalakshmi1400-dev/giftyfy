const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post(
  "/custom-images",
  upload.array("extraImages", 5),
  (req, res) => {
    res.json({
      success: true,
      images: req.files.map((f) => f.filename),
    });
  }
);

module.exports = router;