import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../layout/AdminLayout";
import "../styles/salaryManagement.css";

export default function SalaryManagement() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
const [monthFilter, setMonthFilter] = useState("");
const [statusFilter, setStatusFilter] = useState("");
  const [selectedSalary, setSelectedSalary] = useState(null);
const [showViewModal, setShowViewModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
  const token = localStorage.getItem("token");

const [editSalary, setEditSalary] = useState({
  id: "",
  basicSalary: 0,
  incentive: 0,
  deduction: 0,
   bonus: 0,
  remarks: "",
});

  useEffect(() => {
    fetchSalaries();
  }, []);

const fetchSalaries = async () => {
  try {
    const res = await axios.get(
      "http://localhost:4000/api/salary",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("FULL RESPONSE:", res.data); // 👈 add here

    res.data.salaries.forEach((s) => {
      console.log("Partner:", s.partnerId?.name);
      console.log("Salary:", s.totalSalary);
      console.log("Orders:", s.totalDeliveredOrders);
    });

    setSalaries(res.data.salaries || []);
  } catch (err) {
    console.log(err);
    alert("Failed to fetch salary records");
  } finally {
    setLoading(false);
  }
};

  const getMonthName = (month) => {
    const months = [
      "",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return months[month];
  };

  const filteredSalaries = salaries.filter((salary) => {

  const partnerName =
    salary.partnerId?.name?.toLowerCase() || "";

  const matchesSearch =
    partnerName.includes(
      search.toLowerCase()
    );

  const matchesMonth =
    monthFilter === "" ||
    salary.month === Number(monthFilter);

  const matchesStatus =
    statusFilter === "" ||
    salary.paymentStatus === statusFilter;

  return (
    matchesSearch &&
    matchesMonth &&
    matchesStatus
  );

});
const canPaySalary = (month, year) => {

  const today = new Date();

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  if (year < currentYear) return true;

  if (
    year === currentYear &&
    month < currentMonth
  ) {
    return true;
  }

  return false;
};

const markAsPaid = async (salaryId) => {

  const confirmPay = window.confirm(
    "Are you sure salary has been paid?"
  );

  if (!confirmPay) return;

  try {

    await axios.put(
      `http://localhost:4000/api/salary/pay/${salaryId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Salary Paid Successfully");

    fetchSalaries();

  } catch (err) {

    console.log(err);

  }

};


const updateSalary = async () => {
  try {

    await axios.put(
      `http://localhost:4000/api/salary/${editSalary.id}`,
      {
        basicSalary: Number(editSalary.basicSalary),
        incentive: Number(editSalary.incentive),
        deduction: Number(editSalary.deduction),
         bonus: Number(editSalary.bonus),
        remarks: editSalary.remarks,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Salary Updated");

    setShowEditModal(false);

    fetchSalaries();

  } catch (err) {

    console.log(err);

    alert("Update Failed");

  }
};


  return (
    <AdminLayout>
      <div className="salary-page">

        <div className="salary-header">

          <div>
            <h2>Salary Management</h2>
            <p>Monthly Salary History</p>
          </div>

        </div>
        <div className="salary-filters">

  <input
    type="text"
    placeholder="Search Partner..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={monthFilter}
    onChange={(e) => setMonthFilter(e.target.value)}
  >
    <option value="">All Months</option>

    <option value="1">January</option>
    <option value="2">February</option>
    <option value="3">March</option>
    <option value="4">April</option>
    <option value="5">May</option>
    <option value="6">June</option>
    <option value="7">July</option>
    <option value="8">August</option>
    <option value="9">September</option>
    <option value="10">October</option>
    <option value="11">November</option>
    <option value="12">December</option>

  </select>

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >

    <option value="">
      All Status
    </option>

    <option value="Pending">
      Pending
    </option>

    <option value="Paid">
      Paid
    </option>

  </select>

</div>

        <div className="salary-card">

          {loading ? (
            <div className="loading">
              Loading...
            </div>
          ) : (

            <table className="salary-table">

              <thead>

                <tr>
                  <th>#</th>
                  <th>Partner</th>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Basic</th>
                  <th>Bonus</th>
                  <th>Incentive</th>
                  <th>Deduction</th>
                  <th>Orders</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Paid Date</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {filteredSalaries.length === 0 ? (

                  <tr>

                    <td
                      colSpan="10"
                      className="empty"
                    >
                      No Salary Records
                    </td>

                  </tr>

                ) : (

                 filteredSalaries.map((salary, index) => (

                    <tr key={salary._id}>

                     <td>{index + 1}</td>
                      <td>{salary.partnerId?.name}</td>
                      <td>{getMonthName(salary.month)}</td>
                      <td>{salary.year}</td>

                      <td>₹{salary.basicSalary}</td>
                      <td>₹{salary.bonus}</td>
                      <td>₹{salary.incentive}</td>
                      <td>₹{salary.deduction}</td>

                      <td>{salary.totalDeliveredOrders}</td>

                      <td>₹{salary.totalSalary}</td>

                      <td>

                        <span
                          className={
                            salary.paymentStatus === "Paid"
                              ? "paid-badge"
                              : "pending-badge"
                          }
                        >
                          {salary.paymentStatus}
                        </span>

                      </td>

                      <td>

                        {salary.paidDate
                          ? new Date(
                              salary.paidDate
                            ).toLocaleDateString()
                          : "-"}

                      </td>
                      <td>

  <div className="salary-actions">

    <button
      className="view-btn"
      onClick={() => {
        setSelectedSalary(salary);
        setShowViewModal(true);
      }}
    >
      View
    </button>

<button
  className="edit-btn"
  onClick={() => {
    setEditSalary({
      id: salary._id,
      basicSalary: salary.basicSalary,
      incentive: salary.incentive,
      deduction: salary.deduction,
      remarks: salary.remarks || "",
    });

    setShowEditModal(true);
  }}
>
  Edit
</button>

   {salary.paymentStatus === "Pending" ? (

  canPaySalary(salary.month, salary.year) ? (

    <button
      className="paid-btn"
      onClick={() => markAsPaid(salary._id)}
    >
      Mark Paid
    </button>

  ) : (

    <button
      className="paid-done-btn"
      disabled
    >
      Month Not Completed
    </button>

  )

) : (

  <button
    className="paid-done-btn"
    disabled
  >
    Paid
  </button>

)}

  </div>

</td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          )}

        </div>
        {showViewModal && selectedSalary && (

<div className="modal-overlay">

<div className="salary-view-modal">

<h2>Salary Details</h2>

<p>

<strong>Partner :</strong>

{selectedSalary.partnerId?.name}

</p>

<p>

<strong>Month :</strong>

{getMonthName(selectedSalary.month)}

</p>

<p>

<strong>Year :</strong>

{selectedSalary.year}

</p>

<p>

<strong>Basic Salary :</strong>

₹{selectedSalary.basicSalary}

</p>
 <p>Bonus: ₹{selectedSalary.bonus}</p>
 <p>Orders: {selectedSalary.totalDeliveredOrders}</p>
<p>

<strong>Incentive :</strong>

₹{selectedSalary.incentive}

</p>

<p>

<strong>Deduction :</strong>

₹{selectedSalary.deduction}

</p>

<p>

<strong>Total Salary :</strong>

₹{selectedSalary.totalSalary}

</p>

<p>

<strong>Status :</strong>

{selectedSalary.paymentStatus}

</p>

<p>

<strong>Remarks :</strong>

{selectedSalary.remarks}

</p>


              <button onClick={() => setShowViewModal(false)}>
                Close
              </button>

</div>

</div>

)}

{showEditModal && (

<div className="modal-overlay">

<div className="salary-modal">

<h2>Edit Salary</h2>

<label>Basic Salary</label>

<input
type="number"
value={editSalary.basicSalary}
onChange={(e)=>
setEditSalary({
...editSalary,
basicSalary:e.target.value
})
}
/>
<label>Bonus</label>
<input
                type="number"
                value={editSalary.bonus}
                onChange={(e) =>
                  setEditSalary({ ...editSalary, bonus: e.target.value })
                }
                placeholder="Bonus"
              />

<label>Incentive</label>

<input
type="number"
value={editSalary.incentive}
onChange={(e)=>
setEditSalary({
...editSalary,
incentive:e.target.value
})
}
/>

<label>Deduction</label>

<input
type="number"
value={editSalary.deduction}
onChange={(e)=>
setEditSalary({
...editSalary,
deduction:e.target.value
})
}
/>

<label>Remarks</label>

<textarea
value={editSalary.remarks}
onChange={(e)=>
setEditSalary({
...editSalary,
remarks:e.target.value
})
}
/>

<h3>

Total Salary :

₹
{Number(editSalary.basicSalary)+
 Number(editSalary.bonus) +
Number(editSalary.incentive)-
Number(editSalary.deduction)}

</h3>

<div className="modal-buttons">

<button
className="save-btn"
onClick={updateSalary}
>

Save

</button>

<button
className="cancel-btn"
onClick={()=>
setShowEditModal(false)
}
>

Cancel

</button>

</div>

</div>

</div>

)}

      </div>
    </AdminLayout>
  );
}