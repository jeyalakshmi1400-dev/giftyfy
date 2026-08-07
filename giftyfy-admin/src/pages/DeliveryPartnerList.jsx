import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/deliveryPartnerList.css";
import AdminLayout from "../layout/AdminLayout";
import {
  FaEye,
  FaCheckCircle,
  FaTrashAlt,
  FaMoneyBillWave,
  FaBan,
  FaLockOpen,
} from "react-icons/fa";

export default function DeliveryPartnerList() {

  const [partners, setPartners] = useState([]);

  const token = localStorage.getItem("token");
  const [selectedPartner, setSelectedPartner] =
  useState(null);

const [salaryModal, setSalaryModal] = useState(false);
const [salaryPartner, setSalaryPartner] = useState(null);
const [monthlySalary, setMonthlySalary] = useState(0);const [bonusPerOrder, setBonusPerOrder] = useState(10);
const [showModal, setShowModal] =
  useState(false);


  // ==========================
  // FETCH PARTNERS
  // ==========================
  const fetchPartners = async () => {

    try {

      const res = await axios.get(
        "http://localhost:4000/api/delivery",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setPartners(res.data || []);

    } catch (error) {

      console.log(
        "FETCH ERROR 👉",
        error.response?.data || error
      );

    }

  };


  useEffect(() => {

    fetchPartners();

  }, []);


  // ==========================
  // APPROVE
  // ==========================
const approve = async (id) => {

  try {

    await axios.put(
  `http://localhost:4000/api/delivery/approve/${id}`,
  {
    isApproved: true,
    monthlySalary: Number(monthlySalary),
    bonusPerOrder: Number(bonusPerOrder),
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    fetchPartners();

  } catch (error) {

    console.log(
      "APPROVE ERROR 👉",
      error.response?.data || error
    );

  }

};


  // ==========================
  // REJECT
  // ==========================
const deletePartner = async (id) => {

  try {

    const confirmDelete =
      window.confirm(
        "Delete this delivery partner?"
      );

    if (!confirmDelete) return;

    await axios.delete(
      `http://localhost:4000/api/delivery/${id}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    fetchPartners();

  } catch (error) {

    console.log(
      "DELETE ERROR 👉",
      error.response?.data || error
    );

  }

};

const toggleBlock = async (id) => {

  try {

    await axios.put(
      `http://localhost:4000/api/delivery/block/${id}`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    fetchPartners();

  } catch (error) {

    console.log(
      "BLOCK ERROR 👉",
      error.response?.data || error
    );

  }

};
const updateSalary = async () => {
  try {

    await axios.put(
      `http://localhost:4000/api/delivery/salary/${salaryPartner._id}`,
      {
        monthlySalary: Number(monthlySalary),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Salary Updated Successfully");

    setSalaryModal(false);

    fetchPartners();

  } catch (error) {

    console.log(error);

  }
};

  return (

    <AdminLayout>
      {/* =========================
    VIEW MODAL
========================= */}

{showModal && selectedPartner && (

  <div className="partner-modal-overlay">

    <div className="partner-modal">

      <button
        className="close-btn"
        onClick={() =>
          setShowModal(false)
        }
      >
        ✖
      </button>

      <h2>
        Delivery Partner Details
      </h2>

      <div className="partner-details">

        <img
          src={`http://localhost:4000/uploads/${selectedPartner.photo}`}
          alt=""
          className="partner-photo"
        />

        <p>
          <strong>Name:</strong>
          {selectedPartner.name}
        </p>

        <p>
          <strong>Email:</strong>
          {selectedPartner.email}
        </p>

        <p>
          <strong>Phone:</strong>
          {selectedPartner.phone}
        </p>

        <p>
          <strong>Address:</strong>
          {selectedPartner.address}
        </p>

        <p>
          <strong>Pincode:</strong>
          {selectedPartner.pincode}
        </p>

        <p>
          <strong>Vehicle:</strong>
          {selectedPartner.vehicleType}
        </p>

        <p>
          <strong>Vehicle Number:</strong>
          {selectedPartner.vehicleNumber}
        </p>

        <p>
          <strong>Aadhar:</strong>
          {selectedPartner.aadharNumber}
        </p>

        <img
          src={`http://localhost:4000/uploads/${selectedPartner.aadharImage}`}
          alt=""
          className="doc-img"
        />

        <p>
          <strong>PAN:</strong>
          {selectedPartner.panNumber}
        </p>

        <img
          src={`http://localhost:4000/uploads/${selectedPartner.panImage}`}
          alt=""
          className="doc-img"
        />

        <p>
          <strong>License No:</strong>
          {selectedPartner.drivingLicenseNo}
        </p>

        <img
          src={`http://localhost:4000/uploads/${selectedPartner.drivingLicenseImage}`}
          alt=""
          className="doc-img"
        />

        <p>
          <strong>Bank:</strong>
          {selectedPartner.bankName}
        </p>

        <p>
          <strong>Account Name:</strong>
          {selectedPartner.accountHolderName}
        </p>

        <p>
          <strong>Account Number:</strong>
          {selectedPartner.accountNumber}
        </p>

        <p>
          <strong>IFSC:</strong>
          {selectedPartner.ifscCode}
        </p>

        <p>
          <strong>Wallet:</strong>
          ₹{selectedPartner.walletBalance}
        </p>

        <p>
          <strong>Total Delivered:</strong>
          {selectedPartner.totalDeliveredOrders}
        </p>

        <p>
          <strong>Total Withdrawn:</strong>
          ₹{selectedPartner.totalWithdrawn}
        </p>

      </div>

<div className="salary-section">
  <h3>Salary Details</h3>

  <label>Monthly Salary</label>
  <input
    type="number"
    value={monthlySalary}
    onChange={(e) =>
      setMonthlySalary(e.target.value)
    }
    placeholder="Enter Monthly Salary"
  />

  <label>Bonus Per Order</label>
  <input
    type="number"
    value={bonusPerOrder}
    onChange={(e) =>
      setBonusPerOrder(e.target.value)
    }
    placeholder="10"
  />
</div>
    </div>

  </div>

)}

{salaryModal && (

<div className="partner-modal-overlay">

  <div className="partner-modal">

    <h2>Update Monthly Salary</h2>

    <label>Monthly Salary</label>

    <input
      type="number"
      value={monthlySalary}
      onChange={(e)=>setMonthlySalary(e.target.value)}
    />

    <div className="partner-modal-buttons">

      <button
        className="approve-btn"
        onClick={updateSalary}
      >
        Save
      </button>

      <button
        className="reject-btn"
        onClick={() => setSalaryModal(false)}
      >
        Cancel
      </button>

    </div>

  </div>

</div>

)}

      {/* CONTENT */}
      <div className="delivery-content">

        <h1 className="delivery-title">
          Delivery Partners 🏍️
        </h1>

        {/* TABLE */}
        <div className="delivery-table">

          {/* HEADER */}
          <div className="table-header">

            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Vehicle</span>
            <span>Pincode</span>
            <span>Status</span>
            <span>Action</span>

          </div>

          {/* ROWS */}
          {partners.map((p) => (

            <div
              key={p._id}
              className="table-row"
            >

               <span
    onClick={() => {
      setSelectedPartner(p);
      setShowModal(true);
    }}
  >
    {p.name}
  </span>

               <span
    onClick={() => {
      setSelectedPartner(p);
      setShowModal(true);
    }}
  >
    {p.email}
  </span>

               <span
    onClick={() => {
      setSelectedPartner(p);
      setShowModal(true);
    }}
  >
    {p.phone}
  </span>

               <span
    onClick={() => {
      setSelectedPartner(p);
      setShowModal(true);
    }}
  >
                {p.vehicleType} -
                {p.vehicleNumber}
              </span>

               <span
    onClick={() => {
      setSelectedPartner(p);
      setShowModal(true);
    }}
  >{p.pincode}</span>

              {/* STATUS */}
              <span>

                {p.isApproved ? (

                  <span className="status approved">
                    Approved
                  </span>

                ) : (

                  <span className="status pending">
                    Pending
                  </span>

                )}

              </span>

              {/* ACTION */}
              {/* ACTION */}
<span className="action-btns">

  {/* View */}
  <FaEye
    className="action-icon view-icon"
    title="View Details"
    onClick={() => {
      setSelectedPartner(p);
      setShowModal(true);
    }}
  />

  {/* Salary */}
  <FaMoneyBillWave
    className="action-icon salary-icon"
    title="Update Salary"
    onClick={() => {
      setSalaryPartner(p);
      setMonthlySalary(p.monthlySalary || 0);
      setSalaryModal(true);
    }}
  />

  {/* Approve */}
  {!p.isApproved && (
    <FaCheckCircle
      className="action-icon approve-icon"
      title="Approve Partner"
      onClick={() => approve(p._id)}
    />
  )}

  {/* Block / Unblock */}
  {p.isBlocked ? (
    <FaLockOpen
      className="action-icon unblock-icon"
      title="Unblock Partner"
      onClick={() => toggleBlock(p._id)}
    />
  ) : (
    <FaBan
      className="action-icon block-icon"
      title="Block Partner"
      onClick={() => toggleBlock(p._id)}
    />
  )}

  {/* Delete */}
  <FaTrashAlt
    className="action-icon delete-icon"
    title="Delete Partner"
    onClick={() => deletePartner(p._id)}
  />

</span>

            </div>

          ))}

        </div>

      </div>

    </AdminLayout>

  );

}