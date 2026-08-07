const jwt = require("jsonwebtoken");
const DeliveryPartner = require("../models/DeliveryPartner");

const protectDeliveryPartner = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // ✅ VERY IMPORTANT
const decoded = jwt.verify(token, process.env.JWT_SECRET);

const partnerId = decoded.id || decoded._id;

console.log("DECODED 👉", decoded);
console.log("PARTNER ID 👉", partnerId);

req.partner = await DeliveryPartner.findById(partnerId);
      if (!req.partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};



const deliveryAuthMiddleware = async (req, res, next) => {
  try {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const partner = await DeliveryPartner.findById(decoded.id);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // ✅ ALWAYS USE THIS
    req.partner = partner;

    next();

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};




module.exports = { protectDeliveryPartner,deliveryAuthMiddleware };