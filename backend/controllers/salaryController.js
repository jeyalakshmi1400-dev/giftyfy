const Salary = require("../models/Salary");
const DeliveryPartner = require("../models/DeliveryPartner");
const Order = require("../models/Order");
// Create Salary
exports.createSalary = async (req, res) => {
  try {
    const {
      partnerId,
      month,
      year,
      bonus,
      incentive,
      deduction,
      remarks,
      presentDays,
      absentDays,
    } = req.body;

    const partner = await DeliveryPartner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery Partner not found",
      });
    }

    const basicSalary = partner.monthlySalary || 0;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // ✅ FIXED ORDER COUNT
    const deliveredOrders = await Order.countDocuments({
      deliveryPartner: partnerId,
      status: "Delivered",
      deliveredAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const existingSalary = await Salary.findOne({
      partnerId,
      month,
      year,
    });

    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: "Salary already generated",
      });
    }

    const totalSalary =
      Number(basicSalary) +
      Number(bonus || 0) +
      Number(incentive || 0) -
      Number(deduction || 0);

    const salary = await Salary.create({
      partnerId,
      month,
      year,
      basicSalary,
      bonus,
      incentive,
      deduction,
      remarks,
      presentDays,
      absentDays,
      totalDeliveredOrders: deliveredOrders,
      totalSalary,
    });

    res.status(201).json({
      success: true,
      salary,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// Get All Salaries
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find()
  .populate("partnerId", "name phone")
  .sort({
    year: -1,
    month: -1,
    createdAt: -1,
  });

  
    res.json({
      success: true,
      salaries,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Salary by Partner
exports.getPartnerSalary = async (req, res) => {
  try {
    const salaries = await Salary.find({
      partnerId: req.params.partnerId,
    }).sort({ year: -1, month: -1 });

    res.json({
      success: true,
      salaries,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Salary
exports.updateSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary not found",
      });
    }

    const {
      basicSalary,
      incentive,
      deduction,
      bonus,
      remarks,
    } = req.body;

    // ✅ UPDATE FIELDS
    salary.basicSalary = Number(basicSalary || 0);
    salary.incentive = Number(incentive || 0);
    salary.deduction = Number(deduction || 0);
    salary.bonus = Number(bonus || 0);
    salary.remarks = remarks || "";

    // 🔥 AUTO RECALCULATE TOTAL SALARY
    salary.totalSalary =
      salary.basicSalary +
      salary.incentive +
      salary.bonus -
      salary.deduction;

    await salary.save();

    res.json({
      success: true,
      message: "Salary updated successfully",
      salary,
    });

  } catch (err) {
    console.log("UPDATE SALARY ERROR 👉", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// Get Logged-in Delivery Partner Salary
exports.getMySalary = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const salaries = await Salary.find({
      partnerId: partnerId,
    }).sort({
      year: -1,
      month: -1,
    });

    if (!salaries.length) {
      return res.json({
        success: true,
        currentSalary: null,
        history: [],
      });
    }

    res.json({
      success: true,
      currentSalary: salaries[0],
      history: salaries,
    });

  } catch (err) {
    console.log("GET MY SALARY ERROR 👉", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// Mark Salary as Paid
// Mark Salary as Paid
exports.markSalaryPaid = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary not found",
      });
    }

    // Already Paid
    if (salary.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Salary already paid",
      });
    }

    // ===========================
    // CHECK MONTH COMPLETED
    // ===========================

    const today = new Date();

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Cannot pay current month salary
    if (
      salary.month === currentMonth &&
      salary.year === currentYear
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current month salary can be paid only after the month ends.",
      });
    }

    // ===========================

    salary.paymentStatus = "Paid";
    salary.paidDate = new Date();

    await salary.save();

    res.json({
      success: true,
      message: "Salary Paid Successfully",
      salary,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
// Delete Salary
exports.deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary not found",
      });
    }

    res.json({
      success: true,
      message: "Salary deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};