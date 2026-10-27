import React, { useEffect, useState } from "react";
import axios from "axios";
import DeliverySidebar from "../components/DeliverySidebar";
import Select from "react-select";
import { toast } from "react-toastify";
import DelayModal from "../components/DelayModal";
import CancelModal from "../components/CancelModal";
import "../styles/orderPickup.css";
import { useNavigate } from "react-router-dom";

// ─── Status config ────────────────────────────────────────────────
const STATUS_CONFIG = {
  Assigned: { color: "#4F46E5", bg: "#EEF0FF", dot: "#4F46E5", label: "Assigned" },
  "Out for Delivery": { color: "#F59E0B", bg: "#FFF7E6", dot: "#F59E0B", label: "Out for Delivery", pulse: true },
  Delivered: { color: "#10B981", bg: "#E9FBF3", dot: "#10B981", label: "Delivered" },
};

const FILTER_OPTIONS = [
  { value: "All", label: "All Orders" },
  { value: "Assigned", label: "Assigned" },
  { value: "Out for Delivery", label: "Out for Delivery" },
];

const STATUS_OPTIONS = [
  { value: "Assigned", label: "Assigned" },
  { value: "Out for Delivery", label: "Out for Delivery" },
];

// ─── Small inline icon set (keeps bundle dependency-free) ─────────
const Icon = {
  Rider: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5" /><circle cx="5.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" stroke="none" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h3" />
    </svg>
  ),
  Box: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" />
    </svg>
  ),
  Truck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z" /><path d="M14 11h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.7" /><circle cx="17" cy="18" r="1.7" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9.5h18" /><path d="M8 3v3" /><path d="M16 3v3" />
    </svg>
  ),
  Phone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  ),
  Pin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10.5c0 6-8 11.5-8 11.5S4 16.5 4 10.5a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10.5" r="2.6" />
    </svg>
  ),
  Lock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  ),
  Sparkle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2 13.8 9 21 12l-7.2 3-1.8 7-1.8-7L3 12l7.2-3Z" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  Package: () => (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /><path d="M16.5 5.5 7.5 10.5" />
    </svg>
  ),
};

// ─── OTP Modal ────────────────────────────────────────────────────
function OtpModal({ order, onClose, onVerified }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = Array.from({ length: 6 }, () => React.createRef());

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1].current?.focus();
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter 6-digit OTP"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("deliveryToken");
      await axios.post(
        `http://localhost:4000/api/orders/${order._id}/verify-otp`,
        { otp: code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("OTP verified ✓");
      onVerified();
    } catch {
      toast.error("Incorrect OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="op-overlay">
      <div className="op-modal otp-modal-box">
        <div className="op-modal-header">
          <div className="op-modal-icon otp-icon"><Icon.Lock /></div>
          <h2>Verify Delivery OTP</h2>
          <p className="op-modal-sub">Ask the customer for the 6-digit code sent to their phone</p>
        </div>
        <div className="otp-order-tag">Order #{order._id.slice(-5)}</div>
        <div className="otp-boxes">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              className="otp-box"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>
        <div className="op-modal-actions">
          <button className="op-btn op-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="op-btn op-btn-primary" onClick={verify} disabled={loading}>
            {loading ? <span className="op-spinner" /> : "Verify & Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Complete Delivery Modal ──────────────────────────────────────
function CompleteDeliveryModal({ order, onClose, onComplete }) {
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [codMethod, setCodMethod] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const isCOD = order?.paymentMethod === "COD";

  const canSubmit = deliveryMethod && (!isCOD || (codMethod && (codMethod !== "UPI" || txnRef.trim())));

  const submit = async () => {
    if (!canSubmit) { toast.error("Please fill all required fields"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("deliveryToken");
await axios.put(
  `http://localhost:4000/api/orders/${order._id}/complete-delivery`,
  {
    deliveryMethod,
    codCollectionMethod: codMethod,
    transactionRef: txnRef,
    deliveryNotes: notes,
    amountReceived: order.totalAmount
  },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order marked as Delivered 🎉");
      onComplete();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete delivery");
    } finally {
      setLoading(false);
    }
  };

  const DELIVERY_METHODS = [
    { value: "Handed to Customer", label: "👤 Handed to Customer", desc: "Delivered directly" },
    { value: "Left at Doorstep", label: "🚪 Left at Doorstep", desc: "Safe drop" },
    { value: "Handed to Family Member", label: "👨‍👩‍👧 Family Member", desc: "Authorised recipient" },
    { value: "Security / Reception", label: "🏢 Security / Reception", desc: "Guard or desk" },
  ];

  return (
    <div className="op-overlay" >
      <div className="op-modal delivery-modal-box">
        <div className="op-modal-header">
          <div className="op-modal-icon delivery-icon"><Icon.Box /></div>
          <h2>Complete Delivery</h2>
          <p className="op-modal-sub">Order #{order._id.slice(-5)} · {order.name}</p>
        </div>

        {/* Order amount strip */}
        <div className="dm-amount-strip">
          <span className="dm-amount-label">Order Total</span>
          <span className="dm-amount-value">₹ {order.totalAmount}</span>
          <span className={`dm-payment-tag ${isCOD ? "cod" : "paid"}`}>{isCOD ? "Collect COD" : "Online — Paid"}</span>
        </div>

        {/* Delivery method */}
        <div className="dm-section">
          <label className="dm-section-label">Delivery Method <span className="req">*</span></label>
          <div className="dm-method-grid">
            {DELIVERY_METHODS.map((m) => (
              <button
                key={m.value}
                className={`dm-method-card ${deliveryMethod === m.value ? "selected" : ""}`}
                onClick={() => setDeliveryMethod(m.value)}
              >
                <span className="dm-method-main">{m.label}</span>
                <span className="dm-method-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* COD section */}
        {isCOD && (
          <div className="dm-section dm-cod-section">
            <label className="dm-section-label">Payment Collection <span className="req">*</span></label>
            <div className="dm-payment-row">
              {["Cash", "UPI", "Card"].map((m) => (
                <button
                  key={m}
                  className={`dm-pay-pill ${codMethod === m ? "selected" : ""}`}
                  onClick={() => setCodMethod(m)}
                >
                  {m === "Cash" ? "💵" : m === "UPI" ? "📱" : "💳"} {m}
                </button>
              ))}
            </div>
            {codMethod === "UPI" && (
              <input
                className="dm-input"
                type="text"
                placeholder="UPI Transaction Reference ID"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
              />
            )}
          </div>
        )}

        {/* Notes */}
        <div className="dm-section">
          <label className="dm-section-label">Delivery Notes <span className="opt">(optional)</span></label>
          <textarea
            className="dm-input dm-textarea"
            placeholder="e.g. Left with neighbour, gate code used…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="op-modal-actions">
          <button className="op-btn op-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={`op-btn op-btn-success ${!canSubmit ? "disabled" : ""}`}
            onClick={submit}
            disabled={!canSubmit || loading}
          >
            {loading ? <span className="op-spinner" /> : <><Icon.Check /> Mark as Delivered</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Assigned;
  return (
    <span className="op-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      <span
        className={`op-status-dot ${cfg.pulse ? "pulsing" : ""}`}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────
function StatCard({ icon, label, value, tone }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function OrderPickup() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [delayModal, setDelayModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [note, setNote] = useState("");
  const [otpModal, setOtpModal] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState(false);
  const navigate = useNavigate();
  const [selectedOrders, setSelectedOrders] = useState([]);
const [bulkStatus, setBulkStatus] = useState("");

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      const res = await axios.get("http://localhost:4000/api/delivery/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("deliveryToken");
    await axios.put(
      `http://localhost:4000/api/orders/${id}/delivery-status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchOrders();
  };

  const submitDelay = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      await axios.put(
        `http://localhost:4000/api/orders/${selectedOrder._id}/delay`,
        { reason: delayReason, note, rescheduleDate, rescheduleTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Delay reported ✅");
      setDelayModal(false);
      setDelayReason(""); setRescheduleDate(""); setRescheduleTime(""); setNote("");
      fetchOrders();
    } catch {
      toast.error("Failed to report delay");
    }
  };

  const submitCancel = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      await axios.put(
        `http://localhost:4000/api/orders/${selectedOrder._id}/cancel`,
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order cancelled");
      setCancelModal(false); setCancelReason(""); setNote("");
      fetchOrders();
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (o.status === "Delivered" || o.deliveryCancelled) return false;
    if (filter === "All") return true;
    return o.status === filter;
  });

  const counts = {
    All: orders.filter((o) => !o.deliveryCancelled && o.status !== "Delivered").length,
    Assigned: orders.filter((o) => o.status === "Assigned").length,
    "Out for Delivery": orders.filter((o) => o.status === "Out for Delivery").length,
  };

  // ── Derived, display-only stat (no new API calls / no logic change) ──
  const isToday = (d) => {
    if (!d) return false;
    const a = new Date(d);
    const b = new Date();
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  };
  const todaysDeliveries = orders.filter(
    (o) => o.status === "Delivered" && isToday(o.updatedAt || o.createdAt)
  ).length;
  const pendingOrdersCount = orders.filter(
  (o) =>
    o.status !== "Delivered" &&
    !o.deliveryCancelled
).length;

  const updateBulkStatus = async () => {
  if (!bulkStatus) {
    toast.error("Select Status");
    return;
  }

  if (selectedOrders.length === 0) {
    toast.error("Select Orders");
    return;
  }

  try {
    const token = localStorage.getItem("deliveryToken");

    await axios.put(
      "http://localhost:4000/api/orders/bulk-status",
      {
        orderIds: selectedOrders,
        status: bulkStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success("Status Updated");

    setSelectedOrders([]);
    setBulkStatus("");

    fetchOrders();
  } catch {
    toast.error("Update Failed");
  }
};
  return (
     <div className="dn2-page-wrap">

      <div className="op-main">
        {/* ── Dashboard header ── */}
        <div className="op-header">
          <div className="op-header-top">
            <div className="op-greeting">
              <div className="op-greeting-icon"><Icon.Rider /></div>
              <div>
                <h1 className="op-title">My Orders</h1>
                <p className="op-subtitle">{filteredOrders.length} active {filteredOrders.length === 1 ? "delivery" : "deliveries"} on your route today</p>
              </div>
              
            </div>
             {/* Filter tabs */}
          <div className="op-filter-tabs">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.value}
                className={`op-tab ${filter === f.value ? "active" : ""}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
                {counts[f.value] > 0 && (
                  <span className="op-tab-count">{counts[f.value]}</span>
                )}
              </button>
            ))}
          </div>
            

          </div>

          {/* Stat cards */}
          <div className="op-stats-grid">
            <StatCard icon={<Icon.Package />} label="Active Orders" value={counts.All} tone="indigo" />
            <StatCard icon={<Icon.Box />} label="Assigned" value={counts.Assigned} tone="blue" />
            <StatCard icon={<Icon.Truck />} label="Out for Delivery" value={counts["Out for Delivery"]} tone="amber" />
            <StatCard icon={<Icon.Check />} label="Today's Deliveries" value={todaysDeliveries} tone="green" />
          </div>

         
        </div>

        {/* ── Floating bulk action toolbar ── */}
        {filteredOrders.length > 0 && (
          <div className="op-bulk-bar">
            <label className="op-bulk-checkbox">
              <input
                type="checkbox"
                checked={
                  selectedOrders.length === filteredOrders.length &&
                  filteredOrders.length > 0
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOrders(filteredOrders.map((o) => o._id));
                  } else {
                    setSelectedOrders([]);
                  }
                }}
              />
              <span className="op-bulk-checkbox-box"><Icon.Check /></span>
              <span className="op-bulk-checkbox-label">
                Select All <span className="op-bulk-count">{selectedOrders.length > 0 ? `· ${selectedOrders.length} selected` : ""}</span>
              </span>
            </label>

            <div className="op-bulk-divider" />

            <select
              className="op-bulk-select"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="Out for Delivery">Out for Delivery</option>
            </select>

            <button className="op-bulk-update-btn" onClick={updateBulkStatus}>
              Update Selected
            </button>
          </div>
        )}

        {/* ── Orders ── */}
        <div className="op-list">
          {filteredOrders.length === 0 ? (
            <div className="op-empty">
              <div className="op-empty-icon"><Icon.Package /></div>
              <h3>All clear!</h3>
              <p>No pending orders right now — new assignments will show up here the moment they land.</p>
            </div>
          ) : (

            filteredOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Assigned;
              return (
                <div
                  className="op-card"
                  key={order._id}
                  style={{ "--accent": cfg.color }}
                >

                  {/* Card header */}
                  <div className="op-card-top">
                    <div className="op-select-order">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order._id]);
                          } else {
                            setSelectedOrders(
                              selectedOrders.filter((id) => id !== order._id)
                            );
                          }
                        }}
                      />
                      <span className="op-select-order-box"><Icon.Check /></span>
                    </div>
                    <div className="op-card-meta">
                      <span className="op-order-id">#{order.orderId}</span>
                      <span className="op-order-date">
                        <Icon.Calendar />
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="op-card-actions">
                      <StatusBadge status={order.status} />

                      <div className="op-action-group">
                        {/* Status select */}
                        <Select
  value={STATUS_OPTIONS.find((s) => s.value === order.status)}
  onChange={(e) => updateStatus(order._id, e.value)}
  isSearchable={false}
  options={
    order.status === "Out for Delivery"
      ? [{ value: "Out for Delivery", label: "Out for Delivery" }]
      : STATUS_OPTIONS
  }
  className="op-status-select"
  classNamePrefix="op-sel"
/>

                        {/* OTP button */}
                        {order.status === "Out for Delivery" &&
 order.deliveryStage === "OTP_PENDING" && (
    <button
        className="op-otp-btn"
        onClick={()=>{
            setSelectedOrder(order);
            setOtpModal(true);
        }}
    >
        <Icon.Lock /> Verify OTP
    </button>
)}
{order.status === "Out for Delivery" &&
 order.deliveryStage === "OTP_VERIFIED" && (
    <button
        className="op-otp-btn verified"
        onClick={()=>{
            setSelectedOrder(order);
            setDeliveryModal(true);
        }}
    >
        <Icon.Check /> Resume Delivery
    </button>
)}
                        {/* Delay */}
                        <button
                          className="op-icon-btn delay"
                          title="Report Delay"
                          onClick={() => { setSelectedOrder(order); setDelayModal(true); }}
                        >
                          <Icon.Clock />
                        </button>

                        {/* Cancel */}
                        <button
                          className="op-icon-btn cancel"
                          title="Cancel Order"
                          onClick={() => { setSelectedOrder(order); setCancelModal(true); }}
                        >
                          <Icon.Close />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delay banner */}
                  {order.isDelayed && order.status !== "Delivered" && (
                    <div className="op-delay-banner">
                      <span className="op-delay-banner-icon"><Icon.Clock /></span>
                      <div>
                        <strong>Delayed</strong> — {order.delayReason}
                        <span className="op-delay-reschedule">
                          Rescheduled: {order.rescheduleDate} at {order.rescheduleTime}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card body */}
                <div className="op-card-body">
  {/* Customer */}
  <div className="op-customer">
    <div className="op-avatar">
      {(order.name || order.name || "?")[0].toUpperCase()}
    </div>

    <div className="op-customer-info">
      <span className="op-customer-name">
        {order.name || order.name}
      </span>

      <a
        href={`tel:${order.phone}`}
        className="op-customer-phone"
      >
        <Icon.Phone /> {order.phone}
      </a>

      <span className="op-customer-address">
        <Icon.Pin /> {order.address}
      </span>
    </div>
  </div>

  {/* Payment */}
  <div className="op-payment-block">
    <span className="op-payment-amount">
      ₹{order.totalAmount}
    </span>

    <span
      className={`op-payment-tag ${
        order.paymentMethod === "COD"
          ? "cod"
          : "paid"
      }`}
    >
      {order.paymentMethod === "COD"
        ? "💵 COD"
        : "✓ Paid"}
    </span>
  </div>
</div>

                  {/* Items */}
                  <div className="op-items">
                    {order.items.map((item, i) => (
                      <div className="op-item" key={i}>
                        <img
                          className="op-item-img"
                          src={
                            item.image?.startsWith("uploads")
                              ? `http://localhost:4000/${item.image}`
                              : `http://localhost:4000/uploads/${item.image}`
                          }
                          alt={item.name}
                        />
                        <div className="op-item-info">
                          <span className="op-item-name">{item.name}</span>
                          <span className="op-item-qty">Qty {item.quantity}</span>
                        </div>
                        <span className="op-item-price">₹{item.price || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {otpModal && selectedOrder && (
        <OtpModal
          order={selectedOrder}
          onClose={() => setOtpModal(false)}
          onVerified={() => { setOtpModal(false); setDeliveryModal(true); }}
        />
      )}

      {deliveryModal && selectedOrder && (
        <CompleteDeliveryModal
          order={selectedOrder}
          onClose={() => setDeliveryModal(false)}
          onComplete={() => { setDeliveryModal(false); fetchOrders();     navigate("/reports");
 }}

        />
      )}

      {delayModal && (
        <DelayModal
          order={selectedOrder}
          delayReason={delayReason} setDelayReason={setDelayReason}
          rescheduleDate={rescheduleDate} setRescheduleDate={setRescheduleDate}
          rescheduleTime={rescheduleTime} setRescheduleTime={setRescheduleTime}
          note={note} setNote={setNote}
          onClose={() => setDelayModal(false)}
          onSubmit={submitDelay}
        />
      )}

      {cancelModal && (
        <CancelModal
          order={selectedOrder}
          cancelReason={cancelReason} setCancelReason={setCancelReason}
          note={note} setNote={setNote}
          onClose={() => setCancelModal(false)}
          onSubmit={submitCancel}
        />
      )}
    </div>
  );
}