
const express = require("express");
const upload = require("../middleware/upload");
const {
  uploadLogo,
  getLogo,
} = require("../controllers/logoController.js");

const router = express.Router();

router.post("/logo", upload.logo.single("image"), uploadLogo);
router.get("/logo", getLogo);

module.exports = router;
