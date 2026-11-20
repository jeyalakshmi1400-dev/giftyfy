
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { BrevoClient } = require("@getbrevo/brevo");

/* =========================
   EMAIL OTP SENDER - BREVO
========================= */

const sendEmailOTP = async (email, otp) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing");
    }

    if (!process.env.EMAIL_USER) {
      throw new Error("EMAIL_USER is missing");
    }

    const brevo = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY,
    });

    await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "Giftyfy",
        email: process.env.EMAIL_USER,
      },
      to: [{ email }],
      subject: "Giftyfy OTP Verification",
      textContent: `Your Giftyfy OTP is ${otp}. It is valid for 5 minutes.`,
    });

    console.log("OTP email sent successfully");
  } catch (error) {
    console.log("Brevo Email Error:", error.message);
    throw error;
  }
};

/* =========================
   REGISTER USER
========================= */

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    });

    // Send OTP email
    try {
      await sendEmailOTP(email, otp);
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);

      return res.status(500).json({
        message: "OTP email failed. Please try again.",
      });
    }

    res.status(201).json({
      message: "OTP sent to your email",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
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
      return res.status(400).json({
        msg: "User not found",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        msg: "Invalid OTP",
      });
    }

    if (!user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(400).json({
        msg: "OTP expired",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    res.json({
      message: "Email verified successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
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

    // OTP verification check
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify OTP first",
        email: user.email,
        needVerification: true,
      });
    }

    // Block check
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked by admin",
      });
    }

    // Password check
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
        isAdmin: user.isAdmin,
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
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* =========================
   GET PROFILE
========================= */

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* =========================
   UPDATE PROFILE
========================= */

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* =========================
   ADMIN - GET ALL USERS
========================= */

const getAllUsers = async (req, res) => {
  try {
    const Order = require("../models/Order");

    const users = await User.find({
      isVerified: true,
    }).select("-password");

    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({
          user: user._id,
        });

        return {
          ...user.toObject(),
          orders,
        };
      })
    );

    res.json({
      users: usersWithOrders,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* =========================
   BLOCK / UNBLOCK USER
========================= */

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

/* =========================
   UPLOAD PROFILE IMAGE
========================= */

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

/* =========================
   DELETE USER
========================= */

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

/* =========================
   RESEND OTP
========================= */

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    const oldOtp = user.otp;
    const oldOtpExpire = user.otpExpire;

    const otp = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    try {
      await sendEmailOTP(email, otp);
    } catch (emailError) {
      user.otp = oldOtp;
      user.otpExpire = oldOtpExpire;

      await user.save();

      return res.status(500).json({
        message: "OTP email failed. Please try again.",
      });
    }

    res.json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* =========================
   EXPORTS
========================= */

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
