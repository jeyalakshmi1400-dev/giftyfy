const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {

    try {

      token =
        req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // ✅ ADMIN
      if (decoded.role === "admin") {

        req.user =
          await Admin.findById(decoded.id)
          .select("-password");

      }

      // ✅ USER
      else {

        req.user =
          await User.findById(decoded.id)
          .select("-password");

      }

      next();

    } catch (error) {

      return res.status(401).json({
        message: "Token failed"
      });

    }

  } else {

    return res.status(401).json({
      message: "No token"
    });

  }

};

// ✅ ADMIN ONLY
const adminOnly = (req, res, next) => {

  if (
    req.user &&
    req.user.role === "admin"
  ) {

    next();

  } else {

    return res.status(403).json({
      message: "Admin access only"
    });

  }

};

module.exports = {
  protect,
  adminOnly
};