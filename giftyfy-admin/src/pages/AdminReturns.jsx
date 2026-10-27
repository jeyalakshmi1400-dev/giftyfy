import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/adminReturns.css";
import AdminSidebar from "../components/AdminSidebar";
import AdminLayout from "../layout/AdminLayout";

/* -------------------------------------------------------------------- */
/*  Small inline icon set (no extra dependency required)                */
/* -------------------------------------------------------------------- */
const IconPackage = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </svg>
);
const IconClock = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);
const IconTruck = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 3h15v13H1z" />
    <path d="M16 8h4l3 3v5h-7V8Z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconCheckCircle = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m22 4-10 10.01-3-3" />
  </svg>
);
const IconRefund = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);
const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const IconX = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);
const IconDownload = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
  </svg>
);
const IconChevronLeft = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const IconChevronRight = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IconEye = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconTruckMove = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8Z" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconMapPin = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconMail = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" />
  </svg>
);
const IconPhone = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);
const IconInbox = (p) => (
  <svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </svg>
);
const IconRotate = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="spin-icon" {...p}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

/* -------------------------------------------------------------------- */

function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [status, setStatus] = useState("All");
  const [date, setDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const returnsPerPage = 8;
  const token = localStorage.getItem("token");

  // --- additive UI-state only (does not touch original data logic) ---
  const [loading, setLoading] = useState(true);
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [pincodeSearch, setPincodeSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:4000/api/orders/returns",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReturns(res.data);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  // FILTER LOGIC (frontend filter)
  const filtered = returns.filter((o) => {
    const matchStatus =
      status === "All" || o.returnStatus === status;

    const matchDate =
      !date ||
      new Date(o.createdAt).toLocaleDateString() ===
        new Date(date).toLocaleDateString();

    const matchOrderId =
      !orderIdSearch ||
      o._id.toLowerCase().includes(orderIdSearch.toLowerCase());

    const matchCustomer =
      !customerSearch ||
      (o.address?.firstName || "")
        .toLowerCase()
        .includes(customerSearch.toLowerCase()) ||
      (o.email || "").toLowerCase().includes(customerSearch.toLowerCase());

    const matchPincode =
      !pincodeSearch ||
      String(o.deliveryPincode || "").includes(pincodeSearch);

    return (
      matchStatus &&
      matchDate &&
      matchOrderId &&
      matchCustomer &&
      matchPincode
    );
  });

  const clearFilters = () => {
    setStatus("All");
    setDate("");
    setOrderIdSearch("");
    setCustomerSearch("");
    setPincodeSearch("");
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const header = [
      "Order ID",
      "Customer",
      "Email",
      "Phone",
      "Reason",
      "Pincode",
      "Date",
      "Status",
    ];
    const rows = filtered.map((o) => [
      o._id,
      o.address?.firstName || "",
      o.email || "",
      o.phone || "",
      o.returnReason || "",
      o.deliveryPincode || "",
      new Date(o.createdAt).toLocaleDateString(),
      o.returnStatus,
    ]);
    const csvContent = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `returns_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const assignPickup = async (id) => {
    try {
      setActionLoadingId(id);

      await axios.put(
        `http://localhost:4000/api/orders/assign-return/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchReturns();
    } catch (err) {
      console.log(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };
  const processRefund = async (id) => {
    try {
      setActionLoadingId(id);

      await axios.put(
        `http://localhost:4000/api/orders/refund/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchReturns();
    } catch (err) {
      console.log(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / returnsPerPage);

  const indexOfLastReturn = currentPage * returnsPerPage;

  const indexOfFirstReturn = indexOfLastReturn - returnsPerPage;

  const currentReturns = filtered.slice(indexOfFirstReturn, indexOfLastReturn);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, date, orderIdSearch, customerSearch, pincodeSearch]);

  // --- derived summary counts (read-only, does not affect fetch/filter logic) ---
  const totalCount = returns.length;
  const pendingCount = returns.filter((r) => r.returnStatus === "Requested").length;
  const pickupAssignedCount = returns.filter((r) => r.returnStatus === "Pickup Assigned").length;
  const pickedUpCount = returns.filter((r) => r.returnStatus === "Picked Up").length;
  const refundedCount = returns.filter((r) => r.returnStatus === "Returned").length;

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusBadgeClass = (s) => {
    switch (s) {
      case "Requested":
        return "badge-requested";
      case "Pickup Assigned":
        return "badge-assigned";
      case "Picked Up":
        return "badge-pickedup";
      case "Returned":
        return "badge-refunded";
      default:
        return "badge-default";
    }
  };

  const initials = (name) =>
    (name || "?")
      .trim()
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const hasActiveFilters =
    status !== "All" || date || orderIdSearch || customerSearch || pincodeSearch;

  return (
    <AdminLayout>
      <div className="admin-return-page">
        {/* ===================== PAGE HEADER ===================== */}
        <div className="return-hero">
          <div className="return-hero-decoration" aria-hidden="true">
            <span className="deco-blob deco-blob-1" />
            <span className="deco-blob deco-blob-2" />
          </div>

          <div className="return-hero-content">
            <div className="return-hero-icon">
              <IconPackage />
            </div>
            <div>
              <h1>Returns Management</h1>
              <p className="return-hero-subtitle">
                Track, assign pickups, and process refunds for every return
                request.
              </p>
              <span className="return-hero-date">{todayStr}</span>
            </div>
          </div>

          <div className="return-hero-stat">
            <span className="return-hero-stat-value">{totalCount}</span>
            <span className="return-hero-stat-label">Total Requests</span>
          </div>
        </div>

        {/* ===================== SUMMARY CARDS ===================== */}
        <div className="summary-grid">
          <div className="summary-card card-total">
            <div className="summary-icon"><IconPackage /></div>
            <div className="summary-text">
              <span className="summary-value">{totalCount}</span>
              <span className="summary-label">Total Return Requests</span>
            </div>
          </div>

          <div className="summary-card card-pending">
            <div className="summary-icon"><IconClock /></div>
            <div className="summary-text">
              <span className="summary-value">{pendingCount}</span>
              <span className="summary-label">Pending Requests</span>
            </div>
          </div>

          <div className="summary-card card-assigned">
            <div className="summary-icon"><IconTruck /></div>
            <div className="summary-text">
              <span className="summary-value">{pickupAssignedCount}</span>
              <span className="summary-label">Pickup Assigned</span>
            </div>
          </div>

          <div className="summary-card card-pickedup">
            <div className="summary-icon"><IconCheckCircle /></div>
            <div className="summary-text">
              <span className="summary-value">{pickedUpCount}</span>
              <span className="summary-label">Picked Up</span>
            </div>
          </div>

          <div className="summary-card card-refunded">
            <div className="summary-icon"><IconRefund /></div>
            <div className="summary-text">
              <span className="summary-value">{refundedCount}</span>
              <span className="summary-label">Refunded / Completed</span>
            </div>
          </div>
        </div>

        {/* ===================== FILTERS ===================== */}
        <div className="filter-box">
          <div className="filter-field">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All</option>
              <option>Requested</option>
              <option>Pickup Assigned</option>
              <option>Picked Up</option>
              <option>Returned</option>
            </select>
          </div>

          <div className="filter-field">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="filter-field filter-search">
            <label>Order ID</label>
            <div className="search-input">
              <IconSearch />
              <input
                type="text"
                placeholder="Search order ID"
                value={orderIdSearch}
                onChange={(e) => setOrderIdSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-field filter-search">
            <label>Customer</label>
            <div className="search-input">
              <IconSearch />
              <input
                type="text"
                placeholder="Name or email"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-field filter-search">
            <label>Pincode</label>
            <div className="search-input">
              <IconSearch />
              <input
                type="text"
                placeholder="Search pincode"
                value={pincodeSearch}
                onChange={(e) => setPincodeSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button
              className="btn-clear"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <IconX /> Clear Filters
            </button>
            <button className="btn-export" onClick={exportCSV}>
              <IconDownload /> Export CSV
            </button>
          </div>
        </div>

        {/* ===================== TABLE ===================== */}
        <div className="table-card">
          <div className="table-scroll">
            <table className="return-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product(s)</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Pincode</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="skeleton-row">
                      <td><div className="skel skel-sm" /></td>
                      <td>
                        <div className="skel-product">
                          <div className="skel skel-thumb" />
                          <div>
                            <div className="skel skel-line" />
                            <div className="skel skel-line short" />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="skel skel-line" />
                        <div className="skel skel-line short" />
                      </td>
                      <td><div className="skel skel-sm" /></td>
                      <td><div className="skel skel-sm" /></td>
                      <td><div className="skel skel-sm" /></td>
                      <td><div className="skel skel-pill" /></td>
                      <td><div className="skel skel-sm" /></td>
                    </tr>
                  ))}

                {!loading &&
                  currentReturns.map((order, rowIdx) => (
                    <React.Fragment key={order._id}>
                      <tr
                        className={`data-row ${
                          rowIdx % 2 === 0 ? "row-even" : "row-odd"
                        }`}
                      >
                        <td>
  <span className="admin-order-id-badge">
    {order.orderId}
  </span>
</td>

                        <td>
                          {order.items.map((item, i) => (
                            <div key={i} className="product-box">
                              <img
                                src={`http://localhost:4000/uploads/${item.image}`}
                                width="40"
                                alt={item.name}
                              />
                              <div className="product-info">
                                <p>{item.name}</p>
                                <span className="qty-badge">
                                  Qty {item.quantity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </td>

                        <td>
                          <div className="customer-cell">
                            <div className="avatar">
                              {initials(order.name || order.user?.name || "-")}
                            </div>
                            <div className="customer-info">
                              <p className="admin-user-name">
  {order.name || order.user?.name || "-"}
</p>
                              <span className="customer-meta">
                                <IconMail /> {order.user?.email || "-"}
                              </span>
                              <span className="customer-meta">
                                <IconPhone /> {order.phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="reason-badge">
                            {order.returnReason}
                          </span>
                        </td>

                        <td>
                          <span className="pincode-cell">
                            <IconMapPin /> {order.deliveryPincode}
                          </span>
                        </td>

                        <td className="cell-date">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${statusBadgeClass(
                              order.returnStatus
                            )}`}
                          >
                            {order.returnStatus}
                          </span>
                        </td>

                        <td>
                          <div className="action-cell">
                            {order.returnStatus === "Requested" && (
                              <button
                                className="btn-action btn-pickup"
                                onClick={() => assignPickup(order._id)}
                                disabled={actionLoadingId === order._id}
                              >
                                {actionLoadingId === order._id ? (
                                  <IconRotate />
                                ) : (
                                  <IconTruckMove />
                                )}
                                Assign Pickup
                              </button>
                            )}

                            {order.returnStatus === "Picked Up" && (
                              <button
                                className="btn-action btn-refund"
                                onClick={() => processRefund(order._id)}
                                disabled={actionLoadingId === order._id}
                              >
                                {actionLoadingId === order._id ? (
                                  <IconRotate />
                                ) : (
                                  <IconRefund />
                                )}
                                Refund
                              </button>
                            )}

                            <button
                              className="btn-action btn-view"
                              onClick={() =>
                                setExpandedRow(
                                  expandedRow === order._id ? null : order._id
                                )
                              }
                            >
                              <IconEye /> View Details
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedRow === order._id && (
                        <tr className="detail-row">
                          <td colSpan={8}>
                            <div className="detail-panel">
                              <div>
                                <span className="detail-label">Order ID</span>
                                <span className="detail-value">
                                  {order._id}
                                </span>
                              </div>
                              <div>
                                <span className="detail-label">Customer</span>
                                <span className="detail-value">
                                  {order.name || order.user?.name || "-"} —{" "}
                                  {order.user?.email || "-"}
                                </span>
                              </div>
                              <div>
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">
                                  {order.phone}
                                </span>
                              </div>
                              <div>
                                <span className="detail-label">
                                  Return Reason
                                </span>
                                <span className="detail-value">
                                  {order.returnReason}
                                </span>
                              </div>
                              <div>
                                <span className="detail-label">
                                  Delivery Pincode
                                </span>
                                <span className="detail-value">
                                  {order.deliveryPincode}
                                </span>
                              </div>
                              <div>
                                <span className="detail-label">
                                  Requested On
                                </span>
                                <span className="detail-value">
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-decoration" aria-hidden="true" />
                <div className="empty-state-icon">
                  <IconInbox />
                </div>
                <h3>No returns found</h3>
                <p>
                  {hasActiveFilters
                    ? "No returns match your current filters. Try adjusting or clearing them."
                    : "There are no return requests yet. New requests will show up here."}
                </p>
                {hasActiveFilters && (
                  <button className="btn-clear" onClick={clearFilters}>
                    <IconX /> Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ===================== PAGINATION ===================== */}
          {!loading && filtered.length > 0 && (
            <div className="return-pagination-wrapper">
              <div className="return-pagination-info">
                Showing{" "}
                <strong>
                  {filtered.length === 0 ? 0 : indexOfFirstReturn + 1}
                </strong>
                –<strong>{Math.min(indexOfLastReturn, filtered.length)}</strong>{" "}
                of <strong>{filtered.length}</strong> Returns
              </div>

              <div className="return-pagination">
                <button
                  className="page-nav"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  <IconChevronLeft /> Prev
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    className={
                      currentPage === index + 1
                        ? "page-num active-page"
                        : "page-num"
                    }
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  className="page-nav"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next <IconChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminReturns;