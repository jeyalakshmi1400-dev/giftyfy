const Product = require("../models/Product");
const Order = require("../models/Order");

const getProfitData = async (req, res) => {

  try {

    const orders = await Order.find({
      status: "Delivered"
    })

    .populate("user")

    .sort({ createdAt: -1 });

    let totalSales = 0;

    let totalProductCost = 0;

    let totalDeliveryExpense = 0;

    let totalDiscount = 0;

    let totalRefund = 0;

    let netProfit = 0;

    const orderData = [];

    for (const order of orders) {

      // =====================
      // CUSTOMER PAID
      // =====================

      const sales =
        Number(order.totalAmount || 0);

      totalSales += sales;

      // =====================
      // PRODUCT COST
      // =====================

      let productCost = 0;

      for (const item of order.items) {

        productCost +=
          Number(item.purchasePrice || 0)
          *
          Number(item.quantity || 0);

      }

      // =====================
      // DELIVERY EXPENSE
      // =====================

      let deliveryExpense = 30;

      // RETURN PICKUP LOSS

      if (
        order.returnStatus ===
        "Returned"
      ) {

        deliveryExpense += 30;

      }

      totalDeliveryExpense +=
        deliveryExpense;

      // =====================
      // DISCOUNT
      // =====================

      const discount =
        Number(order.discount || 0);

      totalDiscount += discount;

      // =====================
      // REFUND
      // =====================

      const refund =
        Number(order.refundAmount || 0);

      totalRefund += refund;

      // =====================
      // PROFIT LOGIC
      // =====================

      let profit = 0;

      // =====================
      // RETURNED ORDER
      // =====================

      if (
        order.returnStatus ===
        "Returned"
      ) {

        // only logistics loss

        profit =
          -deliveryExpense;

      }

      // =====================
      // NORMAL DELIVERED
      // =====================

      else {

        profit =
          sales
          - productCost
          - deliveryExpense;

      }

      netProfit += profit;

      // =====================
      // TOTAL PRODUCT COST
      // =====================

      // only successful orders

      if (
        order.returnStatus !==
        "Returned"
      ) {

        totalProductCost +=
          productCost;

      }

      // =====================
      // PUSH DATA
      // =====================

      orderData.push({

        _id: order._id,

        user: order.user,

        sales,

        productCost:
          order.returnStatus ===
          "Returned"
            ? 0
            : productCost,

        deliveryExpense,

        discount,

        refund,

        profit,

        status: order.status,

        returnStatus:
          order.returnStatus,

        createdAt:
          order.createdAt

      });

    }

    res.json({

      totalSales,

      totalProductCost,

      totalDeliveryExpense,

      totalDiscount,

      totalRefund,

      netProfit,

      orders: orderData

    });

  } catch (error) {

    console.log(
      "PROFIT ERROR 👉",
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};

module.exports = {
  getProfitData
};