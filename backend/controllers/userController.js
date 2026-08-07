const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

/* =========================
   EMAIL OTP SENDER
========================= */

const sendEmailOTP = async (email, otp) => {
  try {

    // 👉 THIS IS WHERE YOU USE IT
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: "Giftyfy <no-reply@giftyfy.com>",
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`
    });

    console.log("Email sent ✔");

  } catch (error) {
    console.log("Email Error:", error.message);
  }
};
/* =========================
   REGISTER USER
========================= */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // check user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // OTP generate
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000,
      isVerified: false
    });

    // SEND EMAIL OTP
    await sendEmailOTP(email, otp);

    console.log("OTP (debug):", otp);

    res.status(201).json({
      message: "OTP sent to your email",
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   VERIFY OTP
========================= */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   LOGIN USER
========================= */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ✅ OTP VERIFIED CHECK
  if (!user.isVerified) {
  return res.status(400).json({
    message: "Please verify OTP first",
    email: user.email,
    needVerification: true,
  });
}

    // ✅ BLOCK CHECK
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked by admin",
      });
    }

    // ✅ PASSWORD CHECK
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone },
    { new: true }
  ).select("-password");

  res.json(user);
};
// 👑 ADMIN - GET ALL USERS WITH ORDERS
const getAllUsers = async (req, res) => {
  try {
    const Order = require("../models/Order");

const users = await User.find({
  isVerified: true,
}).select("-password");
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id });

        return {
          ...user.toObject(),
          orders,
        };
      })
    );

    res.json({ users: usersWithOrders });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ✅ BLOCK / UNBLOCK USER
const toggleBlockUser = async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isBlocked = !user.isBlocked;

    await user.save();

    res.json({
      success: true,
      message: user.isBlocked
        ? "User Blocked"
        : "User Unblocked",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
 const uploadProfileImage = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (req.file) {
      user.profileImage = req.file.filename;
    }

    await user.save();

    res.json({
      success: true,
      user,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Upload failed",
    });
  }
};
// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const resendOtp = async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    user.otp = otp;
    user.otpExpire =
      Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendEmailOTP(email, otp);

    res.json({
      message: "OTP resent successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  loginUser,
  getProfile,
  updateProfile,
  getAllUsers,
  toggleBlockUser,
  uploadProfileImage,
  deleteUser,
  resendOtp,
};
