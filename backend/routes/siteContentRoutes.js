const express = require("express");

const router = express.Router();

const {
  getSiteContent,
  updateSiteContent,
} = require("../controllers/siteContentController");


// USER GET
router.get("/", getSiteContent);


// ADMIN UPDATE
router.put("/", updateSiteContent);

module.exports = router;