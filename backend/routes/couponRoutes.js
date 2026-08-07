const express = require("express");
const router = express.Router();


const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  applyCoupon,
  toggleCoupon,
  sendFirstCoupon,
  sendSelectedCoupon,
  updateCoupon,
   getCouponByCategory,
     autoCategoryCoupon

} = require( "../controllers/couponController.js");
const {protect} = require("../middleware/authMiddleware");


// ADMIN
router.post("/add", createCoupon);
router.get("/", getCoupons);
router.get("/category/:category", getCouponByCategory);
router.put("/update/:id", updateCoupon);

router.delete("/:id", deleteCoupon);

// USER
router.post("/apply", applyCoupon);
router.post(
  "/auto-category",
  protect,
  autoCategoryCoupon
);
router.put("/toggle/:id", toggleCoupon)
router.post("/send-first", protect, sendFirstCoupon);
router.post("/send", protect, sendSelectedCoupon);
;

module.exports = router;