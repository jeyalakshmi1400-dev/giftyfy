const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyOtp,
  updateProfile,
  getProfile,
  getAllUsers,
  toggleBlockUser,
  uploadProfileImage,
  deleteUser,
  resendOtp,
} = require("../controllers/userController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const upload  = require("../middleware/upload");


// 🔐 AUTH
router.post("/register", registerUser);
router.post("/login", loginUser);

// 📲 OTP
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// 👤 PROFILE
router.get("/profile", protect, getProfile);

router.put("/update", protect, updateProfile);

// ✅ PROFILE IMAGE UPLOAD
router.put(
  "/upload-profile",
  protect,
  upload.single("profileImage"),
  uploadProfileImage
);

// 👑 ADMIN
router.get("/", protect, adminOnly, getAllUsers);

router.put("/block/:id", toggleBlockUser);
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteUser
);

module.exports = router;