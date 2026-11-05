
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// =========================
// EXISTING LOCAL STORAGE
// =========================

const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Existing modules continue using local storage
const upload = multer({
  storage: localStorage,
});

// =========================
// CLOUDINARY PRODUCT STORAGE
// =========================

const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,

  params: async (req, file) => {
    return {
      folder: "giftyfy/products",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    };
  },
});

// Product images use Cloudinary
upload.cloudinary = multer({
  storage: productStorage,
});

module.exports = upload;
