const Notification = require("../models/Notification");


// ==============================
// GET MY NOTIFICATIONS
// ==============================
const getMyNotifications = async (req, res) => {

  try {

    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID missing"
      });
    }

    const notifications = await Notification.find({
      partner: partnerId,
      hidden: false
    })
      .populate({
  path: "order",
  populate: [
    {
      path: "items.product",
      model: "Product"
    },
    {
      path: "user",
      model: "User"
    }
  ]
})
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications
    });

  } catch (error) {

    console.log("NOTIFICATION ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};


// ==============================
// HIDE SINGLE NOTIFICATION
// ==============================
const hideNotification = async (req, res) => {

  try {

    const notification = await Notification.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    notification.hidden = true;

    await notification.save();

    res.json({
      success: true,
      message: "Notification hidden"
    });

  } catch (error) {

    console.log("HIDE ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};


// ==============================
// HIDE ALL RETURN PICKUP
// ==============================
const clearReturnNotifications = async (
  req,
  res
) => {

  try {

    const partnerId = req.partner?._id;

    await Notification.updateMany(
      {
        partner: partnerId,
        type: "RETURN_PICKUP"
      },
      {
        hidden: true
      }
    );

    res.json({
      success: true,
      message:
        "Return notifications cleared"
    });

  } catch (error) {

    console.log(
      "CLEAR RETURN ERROR 👉",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

module.exports = {
  getMyNotifications,
  hideNotification,
  clearReturnNotifications
};