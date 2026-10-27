import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/cancelOrders.css";

/* ----------------------------------------------------------
   Inline icon set (premium look, no emoji)
---------------------------------------------------------- */
const Icon = {
  Cancel: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  Reject: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Box: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Rupee: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="M6 13l8.5 8" />
      <path d="M6 13h3a4.5 4.5 0 0 0 0-9" />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  ),
  Pin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

export default function CancelOrders() {
  const [orders, setOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);

  /* ---- UI-only state (no API impact) ---- */
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | cancelled | rejected


   const allOrders = [
  ...orders,
  ...rejectedOrders
];



  const fetchCancelledOrders = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");

      const res = await axios.get(
        "http://localhost:4000/api/delivery/cancel-orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(res.data);
    } catch (error) {
      console.log("FULL ERROR =>", error);
      console.log("BACKEND RESPONSE =>", error.response?.data);
      console.log("STATUS =>", error.response?.status);
      console.log("MESSAGE =>", error.response?.data?.message);
    }
  };
const fetchRejectedOrders = async () => {
  try {

    const token = localStorage.getItem("deliveryToken");

    const res = await axios.get(
      "http://localhost:4000/api/delivery/rejected-orders",
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );


    const formatted = res.data.map((r)=>({

      _id:r.order._id,

      name:r.order.name,

      phone:r.order.phone,

      address:r.order.address,

      items:r.order.items,

      totalAmount:r.order.totalAmount,

      deliveryCancelledAt:r.rejectedAt,

      deliveryCancelReason:r.reason,

      type:"rejected"

    }));


    setRejectedOrders(formatted);


  } catch(error){

    console.log(
      "Rejected Orders Error =>",
      error.response?.data || error.message
    );

  }
};
  useEffect(() => {
    fetchCancelledOrders();
    fetchRejectedOrders();
  }, []);

  /* ---- Derived stats (client-side only) ---- */


const stats = useMemo(() => {

    const rejected = rejectedOrders.length;

    const cancelled = orders.length;

    const totalValue = allOrders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );

    return {
      total: allOrders.length,
      rejected,
      cancelled,
      totalValue
    };

  }, [orders, rejectedOrders, allOrders]);



  const visibleOrders = useMemo(() => {

    const q = search.trim().toLowerCase();

    return allOrders.filter((order)=>{

      const isRejected =
        order.type === "rejected";


      if(filter==="rejected" && !isRejected)
        return false;


      if(filter==="cancelled" && isRejected)
        return false;


      if(!q)
        return true;


      return [
        order._id,
        order.name,
        order.phone,
        order.address,
        order.deliveryCancelReason
      ]
      .join(" ")
      .toLowerCase()
      .includes(q);


    });


  },[allOrders, search, filter]);

  return (
     <div className="dn2-page-wrap">
  

      <div className="delivery-main">
        {/* ===== HEADER ===== */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <Icon.Cancel width={28} height={28} />
            </div>
            <div>
              <h1>Cancelled Orders</h1>
              <p>Orders cancelled by you or rejected during delivery</p>
            </div>
          </div>
          <div className="header-meta">
            <span className="meta-dot" />
            {allOrders.length} Total Orders
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon--slate">
              <Icon.Box width={22} height={22} />
            </div>
            <div className="stat-body">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon--red">
              <Icon.Cancel width={22} height={22} />
            </div>
            <div className="stat-body">
              <span className="stat-label">Cancelled</span>
              <span className="stat-value">{stats.cancelled}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon--amber">
              <Icon.Reject width={22} height={22} />
            </div>
            <div className="stat-body">
              <span className="stat-label">Rejected</span>
              <span className="stat-value">{stats.rejected}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon--green">
              <Icon.Rupee width={22} height={22} />
            </div>
            <div className="stat-body">
              <span className="stat-label">Lost Value</span>
              <span className="stat-value">
                ₹{stats.totalValue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* ===== TOOLBAR ===== */}
        <div className="toolbar">
          <div className="search-box">
            <Icon.Search width={18} height={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by order, customer, product or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-chips">
            <button
              className={`chip ${filter === "all" ? "chip--active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`chip ${filter === "cancelled" ? "chip--active" : ""}`}
              onClick={() => setFilter("cancelled")}
            >
              Cancelled
            </button>
            <button
              className={`chip ${filter === "rejected" ? "chip--active" : ""}`}
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* ===== LIST ===== */}
        <div className="cancel-orders-list">
          {visibleOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon.Box width={40} height={40} />
              </div>
              <h3>
                {allOrders.length === 0
                  ? "No Cancelled Orders Yet"
                  : "No Matching Orders"}
              </h3>
              <p>
                {allOrders.length === 0
                  ? "All active deliveries are proceeding smoothly"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            visibleOrders.map((order) => {
              const isRejected =
                order.deliveryCancelReason === "Rejected by Delivery Partner";

              const firstItem = order.items?.[0];
              const extraCount = (order.items?.length || 0) - 1;

              return (
                <div
                  className={`cancel-card ${isRejected ? "is-rejected" : "is-cancelled"}`}
                  key={order._id}
                >
                  {/* LEFT — Product thumbnail */}
                  <div className="card-thumb">
                    {firstItem ? (
                      <img
                        src={`http://localhost:4000/uploads/${firstItem.image}`}
                        alt={firstItem.name}
                        className="thumb-image"
                      />
                    ) : (
                      <div className="thumb-fallback">
                        <Icon.Box width={26} height={26} />
                      </div>
                    )}
                    {extraCount > 0 && (
                      <span className="thumb-count">+{extraCount}</span>
                    )}
                  </div>

                  {/* CENTER — Order + customer details */}
                  <div className="card-body">
                    <div className="body-top">
                      <span className="order-id">#{order.orderId}</span>
                      <span className="order-date">
                        {new Date(order.deliveryCancelledAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}{" "}
                        •{" "}
                        {new Date(order.deliveryCancelledAt).toLocaleTimeString(
                          "en-IN",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>

                    <h4 className="customer-name">
                      <Icon.User width={15} height={15} />
                      {order.name}
                    </h4>

                    <div className="body-meta">
                      <span className="meta-row">
                        <Icon.Phone width={14} height={14} />
                        {order.phone}
                      </span>
                      <span className="meta-row meta-address">
                        <Icon.Pin width={14} height={14} />
                        {order.address}
                      </span>
                    </div>

                    <div className="body-reason">
                      <span className="reason-label">Reason:</span>
                      {order.deliveryCancelReason}
                    </div>
                  </div>

                  {/* RIGHT — Status + amount */}
                  <div className="card-aside">
                    <span
                      className={`status-badge ${
                        isRejected ? "reject-badge" : "cancel-badge"
                      }`}
                    >
                      {isRejected ? "Rejected" : "Cancelled"}
                    </span>
                    <div className="aside-amount">
                      <span className="amount-label">Total</span>
                      <span className="order-total">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
