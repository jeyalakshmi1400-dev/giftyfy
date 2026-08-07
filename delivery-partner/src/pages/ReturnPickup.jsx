import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DeliverySidebar from "../components/DeliverySidebar";
import "../styles/returnpickup.css";

/* ============================================================
   Small inline icon set (no external icon dependency)
   ============================================================ */
const Icon = {
  Package: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z" strokeLinejoin="round" />
      <path d="M3 8.5 12 14l9-5.5M12 14v7" strokeLinejoin="round" />
    </svg>
  ),
  Truck: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M2 8h11v8H2z" strokeLinejoin="round" />
      <path d="M13 11h4l3 3v2h-7z" strokeLinejoin="round" />
      <circle cx="6.5" cy="18" r="1.8" />
      <circle cx="16.5" cy="18" r="1.8" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
      <path d="m5 13 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" />
    </svg>
  ),
  Layers: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" strokeLinejoin="round" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5S18.6 16.4 20 20" strokeLinecap="round" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" strokeLinejoin="round" />
    </svg>
  ),
  Pin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  ),
  Home: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" strokeLinejoin="round" />
    </svg>
  ),
  Undo: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M8 7 4 11l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 11h10a6 6 0 0 1 0 12h-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  ),
  Filter: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
    </svg>
  ),
  Sort: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M7 4v16M7 4 4 7M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Inbox: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 12h4l2 3h4l2-3h4" strokeLinejoin="round" />
      <path d="M5.5 5h13L21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6L5.5 5Z" strokeLinejoin="round" />
    </svg>
  ),
};

/* ============================================================
   Status badge config (pure presentation, no logic change)
   ============================================================ */
const STATUS_META = {
  "pickupassigned": { label: "Pickup Assigned", cls: "is-assigned", icon: Icon.Clock },
  "pickedup": { label: "Picked Up", cls: "is-pickedup", icon: Icon.Truck },
  "returned": { label: "Returned", cls: "is-returned", icon: Icon.Check },
};

function StatusBadge({ status }) {
  const key = status?.replace(/\s/g, "").toLowerCase();
  const meta = STATUS_META[key] || { label: status, cls: "is-assigned", icon: Icon.Clock };
  const Ico = meta.icon;
  return (
    <span className={`gf-badge ${meta.cls}`}>
      <Ico className="gf-badge-ico" />
      {meta.label}
    </span>
  );
}

function ReturnPickup() {

  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);

  const token = localStorage.getItem("deliveryToken");

  /* ---- Additive UI-only state (does not touch business logic) ---- */
  const [loading, setLoading] = useState(true);
  const [pickingId, setPickingId] = useState(null);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPincode, setFilterPincode] = useState("");
  const [sortLatestFirst, setSortLatestFirst] = useState(true);

  useEffect(() => {
    fetchReturnOrders();
  }, []);

  const fetchReturnOrders = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        "http://localhost:4000/api/orders/return-pickups",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const active = res.data.filter(
        (o) =>
          o.returnStatus === "Pickup Assigned"
      );

      const completed = res.data.filter(
        (o) =>
          o.returnStatus === "Picked Up" ||
          o.returnStatus === "Returned"
      );

      setActiveOrders(active);

      setCompletedOrders(completed);

    } catch (err) {

      console.log(
        err.response?.data || err.message
      );

    } finally {

      setLoading(false);

    }

  };

  // =========================
  // MARK PICKED UP
  // =========================
  const markPickedUp = async (id) => {

    try {

      setPickingId(id);

      const res = await axios.put(
        `http://localhost:4000/api/orders/${id}/return-picked`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(res.data.message);

      fetchReturnOrders();

    } catch (err) {

      alert(
        err.response?.data?.message
      );

    } finally {

      setPickingId(null);

    }

  };

  /* ---- Purely presentational derived lists (UI-only filter/sort) ---- */
  const visibleActiveOrders = useMemo(() => {
    let list = [...activeOrders];

    if (searchOrderId.trim()) {
      const q = searchOrderId.trim().toLowerCase();
      list = list.filter((o) => o._id.slice(-6).toLowerCase().includes(q));
    }

    if (searchCustomer.trim()) {
      const q = searchCustomer.trim().toLowerCase();
      list = list.filter((o) => (o.user?.name || "").toLowerCase().includes(q));
    }

    if (filterPincode.trim()) {
      list = list.filter((o) => String(o.deliveryPincode || "").includes(filterPincode.trim()));
    }

    if (sortLatestFirst) {
      list = list.slice().reverse();
    }

    return list;
  }, [activeOrders, searchOrderId, searchCustomer, filterPincode, sortLatestFirst]);

  const visibleCompletedOrders = useMemo(() => {
    let list = [...completedOrders];

    if (filterStatus !== "all") {
      list = list.filter(
        (o) => o.returnStatus.replace(/\s/g, "").toLowerCase() === filterStatus
      );
    }

    if (searchOrderId.trim()) {
      const q = searchOrderId.trim().toLowerCase();
      list = list.filter((o) => o._id.slice(-6).toLowerCase().includes(q));
    }

    if (searchCustomer.trim()) {
      const q = searchCustomer.trim().toLowerCase();
      list = list.filter((o) => (o.user?.name || "").toLowerCase().includes(q));
    }

  if (sortLatestFirst) {
  list = list.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

    return list;
  }, [completedOrders, filterStatus, searchOrderId, searchCustomer, sortLatestFirst]);

  const todaysPickupsCount = useMemo(() => {
    const today = new Date().toDateString();
    return [...activeOrders, ...completedOrders].filter((o) => {
      const d = o.createdAt || o.updatedAt;
      return d && new Date(d).toDateString() === today;
    }).length;
  }, [activeOrders, completedOrders]);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (

     <div className="dn2-page-wrap">


      <div className="gf-returnpickup-page">

        {/* ====================== */}
        {/* PAGE HEADER */}
        {/* ====================== */}
        <div className="gf-hero">

          <div className="gf-hero-shape gf-hero-shape--a" />
          <div className="gf-hero-shape gf-hero-shape--b" />
          <div className="gf-hero-illustration">
            <Icon.Truck className="gf-hero-illustration-icon" />
          </div>

          <div className="gf-returnpickup-header">

            <div className="gf-hero-titlewrap">

              <div className="gf-hero-iconbadge">
                <Icon.Undo className="gf-hero-iconbadge-svg" />
              </div>

              <div>
                <h1>
                  Return Pickup Orders
                </h1>

                <p>
                  Manage all return pickup requests
                </p>
              </div>

            </div>

            {/* <div className="gf-hero-meta">

              <div className="gf-returnpickup-badge">
                <Icon.Package className="gf-returnpickup-badge-ico" />
                {activeOrders.length} Active Pickups
              </div>

              <div className="gf-hero-date">
                <Icon.Calendar className="gf-hero-date-ico" />
                {todayLabel}
              </div>

            </div> */}

          </div>

        </div>

        {/* ====================== */}
        {/* SUMMARY CARDS */}
        {/* ====================== */}
        <div className="gf-stats-grid">

          <div className="gf-stat-card gf-stat-card--indigo">
            <div className="gf-stat-icon"><Icon.Clock /></div>
            <div className="gf-stat-body">
              <span className="gf-stat-count">{loading ? "—" : activeOrders.length}</span>
              <span className="gf-stat-label">Active Pickups</span>
              <span className="gf-stat-desc">Awaiting collection</span>
            </div>
          </div>

          <div className="gf-stat-card gf-stat-card--green">
            <div className="gf-stat-icon"><Icon.Check /></div>
            <div className="gf-stat-body">
              <span className="gf-stat-count">
                {loading ? "—" : completedOrders.filter(o => o.returnStatus === "Returned").length}
              </span>
              <span className="gf-stat-label">Completed Returns</span>
              <span className="gf-stat-desc">Fully processed</span>
            </div>
          </div>

          <div className="gf-stat-card gf-stat-card--violet">
            <div className="gf-stat-icon"><Icon.Layers /></div>
            <div className="gf-stat-body">
              <span className="gf-stat-count">
                {loading ? "—" : activeOrders.length + completedOrders.length}
              </span>
              <span className="gf-stat-label">Total Return Requests</span>
              <span className="gf-stat-desc">All time</span>
            </div>
          </div>

          <div className="gf-stat-card gf-stat-card--amber">
            <div className="gf-stat-icon"><Icon.Calendar /></div>
            <div className="gf-stat-body">
              <span className="gf-stat-count">{loading ? "—" : todaysPickupsCount}</span>
              <span className="gf-stat-label">Today's Pickups</span>
              <span className="gf-stat-desc">Scheduled today</span>
            </div>
          </div>

        </div>

        {/* ====================== */}
        {/* SEARCH & FILTERS */}
        {/* ====================== */}
        <div className="gf-toolbar">

          <div className="gf-toolbar-search">
            <Icon.Search className="gf-toolbar-search-ico" />
            <input
              type="text"
              placeholder="Search by Order ID"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
            />
          </div>

          <div className="gf-toolbar-search">
            <Icon.User className="gf-toolbar-search-ico" />
            <input
              type="text"
              placeholder="Search customer"
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
            />
          </div>

          <div className="gf-toolbar-field">
            <Icon.Filter className="gf-toolbar-field-ico" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pickupassigned">Pickup Assigned</option>
              <option value="pickedup">Picked Up</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          <div className="gf-toolbar-field">
            <Icon.Pin className="gf-toolbar-field-ico" />
            <input
              type="text"
              placeholder="Pincode"
              value={filterPincode}
              onChange={(e) => setFilterPincode(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`gf-toolbar-sort ${sortLatestFirst ? "is-active" : ""}`}
            onClick={() => setSortLatestFirst((s) => !s)}
          >
            <Icon.Sort className="gf-toolbar-sort-ico" />
            Latest First
          </button>

        </div>

        {/* ====================== */}
        {/* ACTIVE ORDERS */}
        {/* ====================== */}
        {
          loading ? (

            <div className="gf-returnpickup-grid">
              {[1, 2, 3].map((n) => (
                <div className="gf-skeleton-card" key={n}>
                  <div className="gf-skeleton-line gf-skeleton-line--sm shimmer" />
                  <div className="gf-skeleton-line gf-skeleton-line--md shimmer" />
                  <div className="gf-skeleton-block shimmer" />
                  <div className="gf-skeleton-line gf-skeleton-line--lg shimmer" />
                  <div className="gf-skeleton-line gf-skeleton-line--lg shimmer" />
                  <div className="gf-skeleton-btn shimmer" />
                </div>
              ))}
            </div>

          ) : visibleActiveOrders.length === 0 ? (

            <div className="gf-returnpickup-empty">

              <div className="gf-empty-shape gf-empty-shape--a" />
              <div className="gf-empty-shape gf-empty-shape--b" />

              <div className="gf-returnpickup-empty-ico">
                <Icon.Package />
              </div>

              <h3>
                No Active Return Pickups
              </h3>

              <p>
                New return pickup requests will appear here.
              </p>

            </div>

          ) : (

            <div className="gf-returnpickup-grid">

              {
                visibleActiveOrders.map((order, idx) => (

                  <div
                    className="gf-returnpickup-card"
                    key={order._id}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >

                    {/* TOP */}
                    <div className="gf-returnpickup-cardtop">

                      <div>

                        <h3>
                          Order #
                          {order._id.slice(-6)}
                        </h3>

                        <span className="gf-card-subtitle">
                          Return Request
                        </span>

                      </div>

                      <StatusBadge status={order.returnStatus} />

                    </div>

                    {/* PRODUCTS */}
                    <div className="gf-returnpickup-products">

                      {
                        order.items.map((item, i) => (

                          <div
                            className="gf-returnpickup-product"
                            key={i}
                          >

                            <img
                              src={`http://localhost:4000/uploads/${item.image}`}
                              alt=""
                            />

                            <div className="gf-product-meta">

                              <h4>
                                {item.name}
                              </h4>

                              <span className="gf-qty-badge">
                                Qty {item.quantity}
                              </span>

                            </div>

                          </div>

                        ))
                      }

                    </div>

                    {/* CUSTOMER INFO */}
                    <div className="gf-returnpickup-info">

                      <div className="gf-returnpickup-infoitem">
                        <Icon.User className="gf-info-ico" />
                        <div>
                          <span>Customer</span>
                          <p>{order.name}</p>
                        </div>
                      </div>

                      <div className="gf-returnpickup-infoitem">
                        <Icon.Phone className="gf-info-ico" />
                        <div>
                          <span>Phone</span>
                          <p>{order.phone}</p>
                        </div>
                      </div>

                      <div className="gf-returnpickup-infoitem">
                        <Icon.Pin className="gf-info-ico" />
                        <div>
                          <span>Pincode</span>
                          <p>{order.deliveryPincode}</p>
                        </div>
                      </div>

                      <div className="gf-returnpickup-infoitem">
                        <Icon.Home className="gf-info-ico" />
                        <div>
                          <span>Address</span>
                          <p>{order.address}</p>
                        </div>
                      </div>

                      <div className="gf-returnpickup-reason">
                        <Icon.Undo className="gf-info-ico" />
                        <div>
                          <span>
                            Return Reason
                          </span>

                          <p>
                            {order.returnReason}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* BUTTON */}
                    <button
                      className="gf-returnpickup-btn"
                      disabled={pickingId === order._id}
                      onClick={() =>
                        markPickedUp(order._id)
                      }
                    >
                      {pickingId === order._id ? (
                        <>
                          <span className="gf-btn-spinner" />
                          Updating…
                        </>
                      ) : (
                        <>
                          <Icon.Check className="gf-btn-ico" />
                          Mark as Picked Up
                        </>
                      )}
                    </button>

                  </div>

                ))
              }

            </div>

          )
        }

        {/* ====================== */}
        {/* COMPLETED SECTION */}
        {/* ====================== */}
        <div className="gf-returnpickup-completed">

          <div className="gf-returnpickup-completedhead">

            <h2>
              Completed Return Pickups
            </h2>

            <span className="gf-completed-count">
              {completedOrders.length} Completed
            </span>

          </div>

          {
            loading ? (

              <div className="gf-skeleton-tablewrap">
                {[1, 2, 3, 4].map((n) => (
                  <div className="gf-skeleton-row shimmer" key={n} />
                ))}
              </div>

            ) : visibleCompletedOrders.length === 0 ? (

              <div className="gf-returnpickup-emptytable">
                <Icon.Inbox className="gf-emptytable-ico" />
                No completed pickups found
              </div>

            ) : (

              <div className="gf-returnpickup-tablewrap">

                <table className="gf-returnpickup-table">

                  <thead>

                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Pincode</th>
                      <th>Status</th>
                    </tr>

                  </thead>

                  <tbody>

                    {
                      visibleCompletedOrders.map((order) => (

                        <tr key={order._id}>

                          <td data-label="Order ID">
                            #
                            {order._id.slice(-6)}
                          </td>

                          <td data-label="Customer">
                            {order.name}
                          </td>

                          <td data-label="Phone">
                            {order.phone}
                          </td>

                          <td data-label="Pincode">
                            {order.deliveryPincode}
                          </td>

                          <td data-label="Status">
                            <StatusBadge status={order.returnStatus} />
                          </td>

                        </tr>

                      ))
                    }

                  </tbody>

                </table>


              </div>

            )
          }

        </div>

      </div>

    </div>

  );
}

export default ReturnPickup;