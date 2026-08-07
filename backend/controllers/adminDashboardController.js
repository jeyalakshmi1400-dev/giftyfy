const Order = require("../models/Order");
const User = require("../models/User");
const DeliveryPartner =
require("../models/DeliveryPartner");

const getDashboard = async (req, res) => {

  try {

    // TOTAL ORDERS

    const todayOrders =
      await Order.countDocuments();

    // TOTAL REVENUE

    const orders = await Order.find();

    let revenue = 0;

    orders.forEach((item) => {
      revenue += item.totalAmount;
    });

    // CUSTOMERS

    const customers =
      await User.countDocuments();

    // DELIVERY PARTNERS

    const deliveryPartners =
      await DeliveryPartner.countDocuments();

    // MONTHLY REVENUE

    const monthlyRevenue =
      await Order.aggregate([
        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
            },

            revenue: {
              $sum: "$totalAmount",
            },
          },
        },

        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]);

      const revenueData =
await Order.aggregate([

  {
    $group: {

      _id: {
        day: {
          $dayOfMonth: "$createdAt",
        },
      },

      revenue: {
        $sum: "$totalAmount",
      },

    },
  },

  {
    $sort: {
      "_id.day": 1,
    },
  },

]);

    // PURCHASE DATA

 const today = new Date();

// START OF DAY

const startOfDay = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate()
);

// START OF WEEK

const startOfWeek = new Date();

startOfWeek.setDate(
  today.getDate() - 7
);

// START OF MONTH

const startOfMonth = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);

// DAILY ORDERS

const dailyOrders =
await Order.countDocuments({
  createdAt: {
    $gte: startOfDay,
  },
});

// WEEKLY ORDERS

const weeklyOrders =
await Order.countDocuments({
  createdAt: {
    $gte: startOfWeek,
  },
});

// MONTHLY ORDERS

const monthlyOrders =
await Order.countDocuments({
  createdAt: {
    $gte: startOfMonth,
  },
});

// FINAL PURCHASE DATA

const purchaseData = [

  {
    name: "Daily",
    value: dailyOrders,
  },

  {
    name: "Weekly",
    value: weeklyOrders,
  },

  {
    name: "Monthly",
    value: monthlyOrders,
  },

];

    res.json({
      todayOrders,
      revenue,
      customers,
      deliveryPartners,
      monthlyRevenue,
      purchaseData,
      revenueData,
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};

module.exports = {
  getDashboard,
};