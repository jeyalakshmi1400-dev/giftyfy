const Order = require("../models/Order");

const DeliveryPartner = require(
  "../models/DeliveryPartner"
);

const DeliveryPartnerPayment = require(
  "../models/DeliveryPartnerPayment"
);

const getAdminNotifications = async (
  req,
  res
) => {

  try {

    // 🛒 NEW ORDERS
    const orders =
      await Order.countDocuments({
        status: "Pending",
      });

    // 🔁 RETURN REQUESTS
    const returns =
  await Order.countDocuments({

    returnRequested: true,

    $or: [

      // 🔁 New return request
      {
        returnStatus: "Requested",
      },

      // 💸 Refund pending
      {
        returnStatus: "Picked Up",
        refundStatus: "Pending",
      },

    ],

  });

    // 🚚 DELIVERY PARTNER APPROVAL
    const deliveryPartners =
      await DeliveryPartner.countDocuments({
        isApproved: false,
      });

    // 💰 DELIVERY PAYMENT WITHDRAW
    const paymentRequests =
      await DeliveryPartnerPayment.countDocuments({
        status: "Pending",
      });

    // 🔥 TOTAL
    const total =
      orders +
      returns +
      deliveryPartners +
      paymentRequests;

    res.json({
      total,

      orders,

      returns,


      deliveryPartners,

      paymentRequests,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });

  }

};

module.exports = {
  getAdminNotifications,
};