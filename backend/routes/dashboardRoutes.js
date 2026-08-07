const express = require("express");
const router = express.Router();


const { getDashboard } = require( "../controllers/adminDashboardController.js");
const {adminOnly} = require("../middleware/authMiddleware");




router.get("/dashboard", getDashboard,adminOnly);

module.exports = router;