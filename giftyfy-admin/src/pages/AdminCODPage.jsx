import React, { useEffect, useState } from "react";
import axios from "axios";

import AdminLayout from "../layout/AdminLayout";
import "../styles/adminCOD.css";

export default function AdminCODPage() {
  // =====================================================
  // STATE
  // =====================================================

  const [codOrders, setCodOrders] = useState([]);
  const [partnerSummary, setPartnerSummary] = useState([]);

  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalCODCollected: 0,
    totalAdminRevenue: 0,
    submittedAmount: 0,
    settledAmount: 0,
    pendingAmount: 0,
    collectedAmount: 0,
    rejectedAmount: 0,
    todaySubmittedAmount: 0,
    todayVerifiedAmount: 0,
    todaySubmittedOrders: 0,
    todayVerifiedOrders: 0,
    pendingOrders: 0,
    totalPartners: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const ordersPerPage = 10;

  const [loading, setLoading] = useState(false);

  const [verifying, setVerifying] = useState({});

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showModal, setShowModal] = useState(false);

  // =====================================================
  // FETCH COD ORDERS
  // =====================================================

  useEffect(() => {
    fetchCODOrders();
  }, []);

  const fetchCODOrders = async () => {
    try {
      setLoading(true);

      const adminToken =
        localStorage.getItem("adminToken");

      const { data } = await axios.get(
        "http://localhost:4000/api/admin/cod-orders",
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      console.log("COD API RESPONSE =>", data);

      setCodOrders(data.orders || []);

      setPartnerSummary(
        data.partnerSummary || []
      );

      setSummary(
        data.summary || {
          totalOrders: 0,
          totalCODCollected: 0,
          totalAdminRevenue: 0,
          submittedAmount: 0,
          settledAmount: 0,
          pendingAmount: 0,
          collectedAmount: 0,
          rejectedAmount: 0,
          todaySubmittedAmount: 0,
          todayVerifiedAmount: 0,
          todaySubmittedOrders: 0,
          todayVerifiedOrders: 0,
          pendingOrders: 0,
          totalPartners: 0,
        }
      );
    } catch (error) {
      console.log(
        "ADMIN COD ERROR 👉",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VERIFY COD
  // =====================================================

  const handleConfirmVerify = async (orderId) => {
    try {
      if (verifying[orderId]) return;

      setVerifying((prev) => ({
        ...prev,
        [orderId]: true,
      }));

      const adminToken =
        localStorage.getItem("adminToken");

      const res = await axios.put(
        `http://localhost:4000/api/admin/verify-cod/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      console.log(
        "VERIFY RESPONSE =>",
        res.data
      );

      // =================================================
      // UPDATE ORDER
      // =================================================

      const verifiedDate =
        res.data?.order?.verifiedAt ||
        new Date().toISOString();

      setCodOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                codStatus: "Settled",
                verifiedAt: verifiedDate,
              }
            : order
        )
      );

      // =================================================
      // CLOSE MODAL
      // =================================================

      setShowModal(false);
      setSelectedOrder(null);

      // =================================================
      // REFRESH SUMMARY
      // =================================================

      await fetchCODOrders();

      alert(
        "✅ COD Verified Successfully"
      );
    } catch (error) {
      console.log(
        "VERIFY COD ERROR 👉",
        error
      );

      alert(
        error?.response?.data?.message ||
          "❌ Verification Failed"
      );
    } finally {
      setVerifying((prev) => ({
        ...prev,
        [orderId]: false,
      }));
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return "—";
    }

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatShortDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return "—";
    }

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.ceil(
    codOrders.length / ordersPerPage
  );

  const indexOfLastOrder =
    currentPage * ordersPerPage;

  const indexOfFirstOrder =
    indexOfLastOrder - ordersPerPage;

  const currentOrders =
    codOrders.slice(
      indexOfFirstOrder,
      indexOfLastOrder
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [codOrders.length]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <AdminLayout>
      {/* =================================================
          VERIFY MODAL
      ================================================= */}

      {showModal && selectedOrder && (
        <div className="admin-cod-modal-overlay">
          <div className="admin-cod-modal">

            <div className="admin-cod-modal-header">
              <h2>
                COD Verification
              </h2>

              <button
                className="admin-cod-close-btn"
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="admin-cod-details">

              <div className="admin-cod-detail-row">
                <span>
                  Order ID
                </span>

                <strong>
                  #{selectedOrder.orderId}
                </strong>
              </div>

              <div className="admin-cod-detail-row">
                <span>
                  Customer
                </span>

                <strong>
                  {selectedOrder.customer ||
                    "N/A"}
                </strong>
              </div>

              <div className="admin-cod-detail-row">
                <span>
                  Phone
                </span>

                <strong>
                  {selectedOrder.phone ||
                    "N/A"}
                </strong>
              </div>

              <div className="admin-cod-detail-row">
                <span>
                  Amount
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedOrder.amount || 0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="admin-cod-detail-row">
                <span>
                  COD Method
                </span>

                <strong>
                  {selectedOrder.codCollectionMethod ||
                    "N/A"}
                </strong>
              </div>

              <div className="admin-cod-detail-row">
                <span>
                  Partner
                </span>

                <strong>
                  {selectedOrder.deliveryPartnerName ||
                    "N/A"}
                </strong>
              </div>

              <div className="admin-cod-detail-row">
                <span>
                  Submitted Date
                </span>

                <strong>
                  {formatDate(
                    selectedOrder.submittedAt
                  )}
                </strong>
              </div>

            </div>

            <div className="admin-cod-modal-actions">

              <button
                className="admin-cod-cancel-btn"
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </button>

              <button
                className="admin-cod-confirm-btn"
                disabled={
                  verifying[
                    selectedOrder._id
                  ]
                }
                onClick={() =>
                  handleConfirmVerify(
                    selectedOrder._id
                  )
                }
              >
                {verifying[
                  selectedOrder._id
                ]
                  ? "Verifying..."
                  : "Verify COD"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="admin-cod-main">

        <div className="admin-cod-container">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="admin-cod-header">

            <div>
              <h1>
                COD Settlement
              </h1>

              <p>
                Delivery partner COD
                collection & verification
              </p>
            </div>

            <button
              className="admin-cod-refresh-btn"
              onClick={fetchCODOrders}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

          {/* =================================================
              STATS
          ================================================= */}

          <div className="admin-cod-stats">

            {/* TOTAL ORDERS */}

            <div className="admin-cod-card">

              <h3>
                Total COD Orders
              </h3>

              <h2>
                {summary.totalOrders}
              </h2>

            </div>

            {/* TOTAL COLLECTED */}

            <div className="admin-cod-card">

              <h3>
                Total COD Collected
              </h3>

<h2 className="green">
  ₹
  {Math.round(
    Number(summary.totalCODCollected || 0)
  ).toLocaleString("en-IN")}
</h2>

            </div>

            {/* TODAY SUBMITTED */}

            <div className="admin-cod-card">

              <h3>
                Today Submitted
              </h3>

              <h2 className="orange">
                ₹
                {Number(
                  summary.todaySubmittedAmount || 0
                ).toLocaleString("en-IN")}
              </h2>

              <small>
                {summary.todaySubmittedOrders || 0}{" "}
                payment(s)
              </small>

            </div>

            {/* TODAY VERIFIED */}

            <div className="admin-cod-card">

              <h3>
                Today Verified
              </h3>

              <h2 className="purple">
                ₹
                {Number(
                  summary.todayVerifiedAmount || 0
                ).toLocaleString("en-IN")}
              </h2>

              <small>
                {summary.todayVerifiedOrders || 0}{" "}
                payment(s)
              </small>

            </div>

            {/* PENDING */}

            <div className="admin-cod-card">

              <h3>
                Pending Amount
              </h3>

              <h2 className="red">
                ₹
                {Number(
                  summary.pendingAmount || 0
                ).toLocaleString("en-IN")}
              </h2>

              <small>
                {summary.pendingOrders || 0}{" "}
                pending payment(s)
              </small>

            </div>

          </div>

          {/* =================================================
              PARTNER SUMMARY
          ================================================= */}

          <div className="admin-cod-section">

            <div className="admin-cod-section-header">
              <div>
                <h2>
                  Delivery Partner Summary
                </h2>

                <p>
                  Partner-wise COD payment
                  collection details
                </p>
              </div>

              <div className="admin-cod-partner-count">
                {summary.totalPartners || 0}{" "}
                Partners
              </div>
            </div>

            <div className="admin-cod-table-card">

              <div className="admin-cod-table-scroll">

                <table className="admin-cod-table">

                  <thead>
                    <tr>
                      <th>
                        Delivery Partner
                      </th>

                      <th>
                        Total COD
                      </th>

                      <th>
                        Submitted
                      </th>

                      <th>
                        Verified
                      </th>

                      <th>
                        Pending
                      </th>

                      <th>
                        Rejected
                      </th>

                      <th>
                        Last Payment
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {partnerSummary.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="admin-cod-empty"
                        >
                          No delivery partner
                          COD records found.
                        </td>
                      </tr>
                    ) : (
                      partnerSummary.map(
                        (partner) => (
                          <tr
                            key={
                              partner.partnerId ||
                              partner.partnerName
                            }
                          >

                            <td>
                              <div className="admin-partner-name">
                                <b>
                                  {
                                    partner.partnerName
                                  }
                                </b>

                                {partner.phone && (
                                  <small>
                                    {
                                      partner.phone
                                    }
                                  </small>
                                )}
                              </div>
                            </td>

                           <td className="green">
  ₹
  {Math.round(
    Number(partner.totalCollected || 0)
  ).toLocaleString(
    "en-IN"
  )}
</td>

                            <td>
                              ₹
                              {Number(
                                partner.submittedAmount ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                          <td className="green">
  ₹
  {Math.round(
    Number(partner.totalCollected || 0)
  ).toLocaleString(
    "en-IN"
  )}
</td>

                            <td className="red">
                              ₹
                              {Number(
                                partner.pendingAmount ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td>
  ₹
  {Math.round(
    Number(partner.rejectedAmount || 0)
  ).toLocaleString(
    "en-IN"
  )}
</td>

                            <td>
                              {formatShortDate(
                                partner.lastPaymentDate
                              )}
                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

          {/* =================================================
              PAYMENT DETAILS
          ================================================= */}

          <div className="admin-cod-section">

            <div className="admin-cod-section-header">

              <div>
                <h2>
                  COD Payment Details
                </h2>

                <p>
                  Delivery partner submitted
                  payments
                </p>
              </div>

            </div>

            <div className="admin-cod-table-card">

              <div className="admin-cod-table-scroll">

                <table className="admin-cod-table">

                  <thead>

                    <tr>

                      <th>
                        Order
                      </th>

                      <th>
                        Customer
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        COD Amount
                      </th>

                      <th>
                        COD Method
                      </th>

                      <th>
                        Partner
                      </th>

                      <th>
                        Submitted Date
                      </th>

                      <th>
                        Verified Date
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (

                      <tr>
                        <td
                          colSpan="10"
                          className="admin-cod-empty"
                        >
                          Loading COD payments...
                        </td>
                      </tr>

                    ) : currentOrders.length === 0 ? (

                      <tr>
                        <td
                          colSpan="10"
                          className="admin-cod-empty"
                        >
                          No COD payments found.
                        </td>
                      </tr>

                    ) : (

                      currentOrders.map(
                        (order) => (

                          <tr
                            key={order._id}
                          >

                            {/* ORDER */}

                            <td>
                              <b>
                                #
                                {order.orderId}
                              </b>
                            </td>

                            {/* CUSTOMER */}

                            <td>

                              <div>
                                <b>
                                  {
                                    order.customer
                                  }
                                </b>

                                <div>
                                  {
                                    order.phone
                                  }
                                </div>
                              </div>

                            </td>

                            {/* PRODUCT */}

                            <td>

                              {order.items?.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <div
                                    key={index}
                                    className="admin-product-box"
                                  >

                                    {item.image ? (
                                      <img
                                        src={`http://localhost:4000/uploads/${item.image}`}
                                        alt=""
                                      />
                                    ) : (
                                      <div className="admin-product-no-image">
                                        —
                                      </div>
                                    )}

                                    <div>

                                      <div>
                                        {
                                          item.name
                                        }
                                      </div>

                                      <small>
                                        Qty:{" "}
                                        {
                                          item.quantity
                                        }
                                      </small>

                                    </div>

                                  </div>

                                )
                              )}

                            </td>

                            {/* AMOUNT */}

                            <td className="green">

                              ₹
                              {Number(
                                order.amount ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </td>

                            {/* METHOD */}

                            <td>

                              <span
                                className={`cod-method ${
                                  order.codCollectionMethod
                                    ?.toLowerCase()
                                    ?.replace(
                                      /\s+/g,
                                      "-"
                                    ) || ""
                                }`}
                              >
                                {
                                  order.codCollectionMethod ||
                                  "N/A"
                                }
                              </span>

                            </td>

                            {/* PARTNER */}

                            <td>

                              <b>
                                {
                                  order.deliveryPartnerName ||
                                  "Not Assigned"
                                }
                              </b>

                            </td>

                            {/* SUBMITTED DATE */}

                            <td>

                              {formatDate(
                                order.submittedAt
                              )}

                            </td>

                            {/* VERIFIED DATE */}

                            <td>

                              {formatDate(
                                order.verifiedAt
                              )}

                            </td>

                            {/* STATUS */}

                            <td>

                              {order.codStatus ===
                              "Settled" ? (

                                <span className="status settled">
                                  Settled
                                </span>

                              ) : order.codStatus ===
                                "Submitted" ? (

                                <span className="status pending">
                                  Submitted
                                </span>

                              ) : order.codStatus ===
                                "Rejected" ? (

                                <span className="status rejected">
                                  Rejected
                                </span>

                              ) : (

                                <span className="status waiting">
                                  Collected
                                </span>

                              )}

                            </td>

                            {/* ACTION */}

                            <td>

                              {order.codStatus ===
                              "Submitted" ? (

                                <button
                                  className="verify-btn"
                                  disabled={
                                    verifying[
                                      order._id
                                    ]
                                  }
                                  onClick={() => {
                                    setSelectedOrder(
                                      order
                                    );

                                    setShowModal(
                                      true
                                    );
                                  }}
                                >
                                  {verifying[
                                    order._id
                                  ]
                                    ? "Verifying..."
                                    : "Verify"}
                                </button>

                              ) : order.codStatus ===
                                "Settled" ? (

                                <button
                                  className="done-btn"
                                  disabled
                                >
                                  ✓ Verified
                                </button>

                              ) : (

                                <button
                                  className="done-btn"
                                  disabled
                                >
                                  —
                                </button>

                              )}

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  PAGINATION
              ================================================= */}

              {totalPages > 1 && (
                <div className="admin-pagination">

                  <button
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (prev) =>
                          prev - 1
                      )
                    }
                  >
                    Prev
                  </button>

                  {[
                    ...Array(totalPages),
                  ].map(
                    (_, index) => (

                      <button
                        key={index}
                        className={
                          currentPage ===
                          index + 1
                            ? "active-page"
                            : ""
                        }
                        onClick={() =>
                          setCurrentPage(
                            index + 1
                          )
                        }
                      >
                        {index + 1}
                      </button>

                    )
                  )}

                  <button
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (prev) =>
                          prev + 1
                      )
                    }
                  >
                    Next
                  </button>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
}