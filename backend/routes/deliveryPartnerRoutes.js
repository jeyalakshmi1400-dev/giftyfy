const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {

  registerDeliveryPartner,
  loginDeliveryPartner,
  approveDeliveryPartner,
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  getMyOrders,
  getDeliveryReports,
  getMyProfile,
getDashboardData,
 getCODOrders,
  submitCOD,
  blockDeliveryPartner,
  deleteDeliveryPartner,
  updateMyProfile,
  rejectNotification,
  getCancelledOrders,
  updateMonthlySalary,
  getRejectedOrders
} = require("../controllers/deliveryPartnerController");

const {

  deliveryAuthMiddleware

} = require("../middleware/deliveryAuthMiddleware");
const {protect,adminOnly} = require("../middleware/authMiddleware");
// REGISTER
router.post(
  "/register",
  upload.fields([
    { name: "aadharImage" },
    { name: "panImage" },
    { name: "drivingLicenseImage" },
    { name: "photo" }
  ]),
  registerDeliveryPartner
);


// LOGIN
router.post("/login", loginDeliveryPartner);


// ALL PARTNERS
router.get("/", getAllDeliveryPartners);


// APPROVE
router.put(
  "/approve/:id",
  approveDeliveryPartner
);
router.put(
  "/profile",
  deliveryAuthMiddleware,
  upload.single("photo"),
  updateMyProfile
);

// MY ORDERS
router.get(
  "/my-orders",
  deliveryAuthMiddleware,
  getMyOrders
);

router.get(
  "/cod-orders",
  deliveryAuthMiddleware,
  getCODOrders
);


// ✅ SUBMIT COD
router.put(
  "/submit-cod/:orderId",
  deliveryAuthMiddleware,
  upload.single("screenshot"),
  submitCOD
);

router.get(
  "/cancel-orders",
  deliveryAuthMiddleware,
  getCancelledOrders
);

// REPORTS
router.get(
  "/reports",
  deliveryAuthMiddleware,
  getDeliveryReports
);
router.get(
  "/profile",
  deliveryAuthMiddleware,
  getMyProfile
);
router.get(
  "/dashboard",
  deliveryAuthMiddleware,
  getDashboardData
);
router.put("/salary/:id",protect,adminOnly, updateMonthlySalary,);
// SINGLE PARTNER

router.put(
  "/block/:id",
  protect,
  adminOnly,
  blockDeliveryPartner
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteDeliveryPartner
);
router.delete(
  "/notifications/:id/reject",
  deliveryAuthMiddleware,
  rejectNotification
);
router.get(
  "/rejected-orders",
  deliveryAuthMiddleware,
  getRejectedOrders
);

router.get(
  "/:id",
  getDeliveryPartnerById
);



module.exports = router;