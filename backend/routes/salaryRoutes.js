const express = require("express");
const router = express.Router();

const {
  createSalary,
  getAllSalaries,
  getPartnerSalary,
  updateSalary,
  markSalaryPaid,
  deleteSalary,
    getMySalary,

  
} = require("../controllers/salaryController");

const {

  deliveryAuthMiddleware

} = require("../middleware/deliveryAuthMiddleware");


// Create Salary
router.post("/", createSalary);

// Get All Salaries
router.get("/", getAllSalaries);

router.get("/my", deliveryAuthMiddleware, getMySalary);
// Get Salary by Delivery Partner
router.get("/partner/:partnerId", getPartnerSalary);

// Update Salary
router.put("/:id", updateSalary);

// Mark Salary as Paid
router.put("/pay/:id", markSalaryPaid);

// Delete Salary
router.delete("/:id", deleteSalary);

module.exports = router;