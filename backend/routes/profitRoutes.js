const express = require("express");

const router = express.Router();

const {
  getProfitData
} = require("../controllers/profitController");
const {adminOnly} = require("../middleware/authMiddleware");

router.get("/", getProfitData,adminOnly);

module.exports = router;