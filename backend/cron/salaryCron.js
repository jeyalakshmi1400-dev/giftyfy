const cron = require("node-cron");
const Salary = require("../models/Salary");
const DeliveryPartner = require("../models/DeliveryPartner");
const Order = require("../models/Order");

// Every 1 minute (Testing)
// Production: 0 */1 * * *

cron.schedule("* * * * *", async () => {
  try {

    const partners = await DeliveryPartner.find();

    const today = new Date();

    // Current Month
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);



    for (const partner of partners) {

      // Count only current month's delivered orders
      const deliveredOrders = await Order.countDocuments({
        deliveryPartner: partner._id,
        status: "Delivered",
        deliveredAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const basicSalary = partner.monthlySalary || 0;
      const incentive = partner.incentive || 0;
      const bonus = deliveredOrders * 10;
      const deduction = 0;

      const totalSalary =
        basicSalary +
        incentive +
        bonus -
        deduction;

      const salary = await Salary.findOne({
        partnerId: partner._id,
        month,
        year,
      });

      if (salary) {

        // Update existing salary
        salary.basicSalary = basicSalary;
        salary.incentive = incentive;
        salary.bonus = bonus;
        salary.deduction = deduction;
        salary.totalDeliveredOrders = deliveredOrders;
        salary.totalSalary = totalSalary;
        salary.remarks = "Auto Generated Salary";

        await salary.save();

      

      } else {

        // Create salary
        await Salary.create({
          partnerId: partner._id,
          month,
          year,
          basicSalary,
          incentive,
          bonus,
          deduction,
          totalDeliveredOrders: deliveredOrders,
          totalSalary,
          paymentStatus: "Pending",
          paymentMethod: "",
          paidDate: null,
          remarks: "Auto Generated Salary",
        });

        console.log(
          `Created -> ${partner.name} | Orders: ${deliveredOrders}`
        );
      }
    }


  } catch (err) {
    console.error("Salary Cron Error:", err);
  }
});