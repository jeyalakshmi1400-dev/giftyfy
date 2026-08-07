import React, { useEffect, useState } from "react";
import axios from "axios";

import "../styles/adminDeliveryPayments.css";

import AdminLayout from "../layout/AdminLayout";

export default function AdminDeliveryPayments() {

  const [payments, setPayments] =
    useState([]);

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  // =========================
  // FETCH PAYMENTS
  // =========================
  const fetchPayments = async () => {

    try {

      const res = await axios.get(
        "http://localhost:4000/api/delivery-payment/all",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setPayments(res.data.payments);

    } catch (error) {

      console.log(error);

    }
  };

  useEffect(() => {

    fetchPayments();

  }, []);

  // =========================
  // OPEN VIEW
  // =========================
  const openPayment = (item) => {

    setSelectedPayment(item);

  };

  // =========================
  // APPROVE
  // =========================
  const handleApprove = async (id) => {

    const confirmApprove =
      window.confirm(
        "Have you sent the payment?"
      );

    if (!confirmApprove) return;

    try {

      await axios.put(
        `http://localhost:4000/api/delivery-payment/approve/${id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Payment Approved");

      setSelectedPayment(null);

      fetchPayments();

    } catch (error) {

      console.log(error);

      alert("Error approving payment");

    }
  };

  // =========================
  // REJECT
  // =========================
  const handleReject = async (id) => {

    const confirmReject =
      window.confirm(
        "Reject this payment request?"
      );

    if (!confirmReject) return;

    try {

      await axios.put(
        `http://localhost:4000/api/delivery-payment/reject/${id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Payment Rejected");

      setSelectedPayment(null);

      fetchPayments();

    } catch (error) {

      console.log(error);

      alert("Error rejecting payment");

    }
  };

  // =========================
  // TOTALS
  // =========================
  const totalPending =
    payments.filter(
      (item) => item.status === "Pending"
    ).length;

  const totalApprovedAmount =
    payments
      .filter(
        (item) => item.status === "Approved"
      )
      .reduce(
        (acc, item) =>
          acc + item.amount,
        0
      );

  return (

    <AdminLayout>

      <div className="adpay-page">

        {/* HEADER */}
        <div className="adpay-header">

          <h2>
            Delivery Partner Payments
          </h2>

        </div>

        {/* SUMMARY */}
        <div className="adpay-summary-grid">

          <div className="adpay-summary-card">

            <h4>Total Requests</h4>

            <p>
              {payments.length}
            </p>

          </div>

          <div className="adpay-summary-card">

            <h4>Pending Requests</h4>

            <p>
              {totalPending}
            </p>

          </div>

          <div className="adpay-summary-card">

            <h4>Approved Amount</h4>

            <p>
              ₹{totalApprovedAmount}
            </p>

          </div>

        </div>

        {/* TABLE */}
        <div className="adpay-table-wrapper">

          <table className="adpay-table">

            <thead>

              <tr>

                <th>Partner</th>

                <th>Request</th>

                <th>Status</th>

                <th>Date</th>

                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {payments.length > 0 ? (

                payments.map((item) => (

                  <tr key={item._id}>

                    {/* PARTNER */}
                    <td>

                      <div className="adpay-partner-box">

                        <div className="adpay-avatar">

                          {item.partner?.name?.charAt(0)}

                        </div>

                        <div>

                          <h4>
                            {item.partner?.name}
                          </h4>

                          <p>
                            {item.partner?.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* AMOUNT */}
                    <td className="adpay-amount">

                      ₹{item.amount}

                    </td>

                    {/* STATUS */}
                    <td>

                      <span
                        className={`adpay-status ${item.status}`}
                      >
                        {item.status}
                      </span>

                    </td>

                    {/* DATE */}
                    <td>

                      {new Date(
                        item.createdAt
                      ).toLocaleDateString()}

                    </td>

                    {/* ACTION */}
                    <td>

                      <button
                        className="adpay-view-btn"
                        onClick={() =>
                          openPayment(item)
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="adpay-empty"
                  >
                    No payment requests
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ========================= */}
      {/* MODAL */}
      {/* ========================= */}
{
  selectedPayment && (

    <div className="adpay-modal-overlay">

      <div className="adpay-modal modern-modal">

        {/* TOP */}
        <div className="adpay-modal-top">

          <div>

            <h2>Payment Verification</h2>

            <p>
              Verify delivery partner payout
            </p>

          </div>

          <button
            className="adpay-close-icon"
            onClick={() =>
              setSelectedPayment(null)
            }
          >
            ✕
          </button>

        </div>

        {/* PARTNER CARD */}
        <div className="adpay-info-card">

          <div className="adpay-user-left">

            <div className="adpay-big-avatar">
              {
                selectedPayment.partner?.name
                  ?.charAt(0)
              }
            </div>

            <div>

              <h3>
                {
                  selectedPayment.partner?.name
                }
              </h3>

              <p>
                {
                  selectedPayment.partner?.email
                }
              </p>

            </div>

          </div>

          <span
            className={`adpay-status-pill ${selectedPayment.status}`}
          >
            {selectedPayment.status}
          </span>

        </div>

        {/* WALLET GRID */}
        <div className="adpay-wallet-grid">

          <div className="adpay-wallet-card">

            <span>
              Wallet Balance
            </span>

            <h2>
              ₹
              {
                selectedPayment.walletBalanceAtRequest || 0
              }
            </h2>

          </div>

          <div className="adpay-wallet-card">

            <span>
              Request Amount
            </span>

            <h2>
              ₹
              {
                selectedPayment.amount || 0
              }
            </h2>

          </div>

          <div className="adpay-wallet-card">

            <span>
              Total Withdrawn
            </span>

            <h2>
              ₹
              {
                selectedPayment.totalWithdrawnAtRequest || 0
              }
            </h2>

          </div>

          <div className="adpay-wallet-card">

            <span>
              Completed Orders
            </span>

            <h2>
              {
                selectedPayment.totalDeliveredOrders || 0
              }
            </h2>

          </div>

        </div>

        {/* VERIFY */}
        <div className="adpay-verify-card">

          <h3>
            Verification Status
          </h3>

          {
            selectedPayment.amount <=
            selectedPayment.walletBalanceAtRequest ? (

              <div className="adpay-success-box">

                <span>✅</span>

                <p>
                  Wallet verified successfully
                </p>

              </div>

            ) : (

              <div className="adpay-fail-box">

                <span>❌</span>

                <p>
                  Invalid withdrawal request
                </p>

              </div>

            )
          }

        </div>

        {/* ACTIONS */}
        <div className="adpay-modal-actions">

          {
            selectedPayment.status ===
            "Pending" && (

              <>

                <button
                  className="adpay-approve-btn"
                  onClick={() =>
                    handleApprove(
                      selectedPayment._id
                    )
                  }
                >
                  Approve Payment
                </button>

                <button
                  className="adpay-reject-btn"
                  onClick={() =>
                    handleReject(
                      selectedPayment._id
                    )
                  }
                >
                  Reject
                </button>

              </>

            )
          }

          <button
            className="adpay-close-btn"
            onClick={() =>
              setSelectedPayment(null)
            }
          >
            Close
          </button>

        </div>

      </div>

    </div>

  )
}

    </AdminLayout>

  );
}