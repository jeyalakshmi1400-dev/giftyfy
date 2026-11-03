
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "giftyfy/banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    resource_type: "image",
  },
});

const upload = multer({ storage });

module.exports = upload;
