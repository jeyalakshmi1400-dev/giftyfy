const DeliveryPartner = require("../models/DeliveryPartner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.registerDeliveryPartner = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      address,
      aadharNumber,
      panNumber,
      vehicleType,
      vehicleNumber,
      drivingLicenseNo,
      accountHolderName,
      accountNumber,
      bankName,
      ifscCode,
      pincode,
    } = req.body;

    const existing = await DeliveryPartner.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const partner = await DeliveryPartner.create({
      name,
      phone,
      email,
      password: hashedPassword,
      address,
      aadharNumber,
      panNumber,
      vehicleType,
      vehicleNumber,
      drivingLicenseNo,
      accountHolderName,
      accountNumber,
      bankName,
      ifscCode,
      pincode,
    });

    res.status(201).json({
      message: "Registered successfully",
      partner,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.loginDeliveryPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: partner._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login success",
      token,
      partner,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};