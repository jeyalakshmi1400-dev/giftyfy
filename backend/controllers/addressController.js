const Address = require("../models/Address");

// ✅ SAVE ADDRESS
const createAddress = async (req, res) => {
  try {

    // 🔥 if new address is default → old default remove first
    if (req.body.isDefault) {
      await Address.updateMany(
        { userId: req.user._id },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json(address);

  } catch (err) {
     console.log("ADDRESS ERROR 👉", err);
    res.status(500).json({
      message: "Address save failed",
      error: err.message,
    });
  }
};

// ✅ GET ALL ADDRESSES
const getAddresses = async (req, res) => {
  try {
    console.log("REQ.USER 👉", req.user);        // 🔥
    console.log("USER ID 👉", req.user?._id);     // 🔥

    const addresses = await Address.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    console.log("ADDRESSES 👉", addresses);      // 🔥

    res.json(addresses);
  } catch (err) {
    console.log("ERROR 👉", err);
    res.status(500).json({ message: "Failed to get addresses" });
  }
};

const updateAddress = async (req, res) => {
  try {

    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // 🔒 owner check
    if (
      address.userId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // 🔥 default logic
    if (req.body.isDefault) {
      await Address.updateMany(
        { userId: req.user._id },
        { isDefault: false }
      );
    }

    const updated = await Address.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Update failed",
    });

  }
};

// ✅ DELETE ADDRESS (optional)
const deleteAddress = async (req, res) => {
  try {

    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // 🔒 owner check
    if (
      address.userId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await address.deleteOne();

    res.json({
      success: true,
      message: "Address deleted successfully",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Delete failed",
    });

  }
};
module.exports={
    createAddress,
    getAddresses,
    deleteAddress,
    updateAddress,
}
