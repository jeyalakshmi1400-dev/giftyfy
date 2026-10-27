import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import AdminLayout from "../layout/AdminLayout";
import {
  FaMoneyBillWave,
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaEdit,
  FaSearch,
  FaCalendarAlt,
  FaFilter,
  FaDownload,
  FaSyncAlt,
  FaTimes,
  FaBoxOpen,
  FaUserCircle,
  FaWallet,
  FaHistory,
  FaRegStickyNote,
} from "react-icons/fa";
import "../styles/salaryManagement.css";

const MONTHS = [
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

// ------------------------------------------------------------------
// Small presentational hook: animates a number counting up.
// Purely visual — does not touch any state used by business logic.
// ------------------------------------------------------------------
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const frameRef = useRef();
  const startRef = useRef();
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

export default function SalaryManagement() {
  // ------------------------------------------------------------------
  // ORIGINAL STATE (unchanged)
  // ------------------------------------------------------------------
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
    totalSalary: 0,
    remarks: "",
  });

  // ------------------------------------------------------------------
  // NEW: presentational-only state (refresh spin, ripple)
  // ------------------------------------------------------------------
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSalaries();
  }, []);

  // ------------------------------------------------------------------
  // ORIGINAL LOGIC (unchanged)
  // ------------------------------------------------------------------
  const fetchSalaries = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/salary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
    return MONTHS[month];
  };

  const filteredSalaries = salaries.filter((salary) => {
    const partnerName = salary.partnerId?.name?.toLowerCase() || "";

    const matchesSearch = partnerName.includes(search.toLowerCase());

    const matchesMonth = monthFilter === "" || salary.month === Number(monthFilter);

    const matchesStatus = statusFilter === "" || salary.paymentStatus === statusFilter;

    return matchesSearch && matchesMonth && matchesStatus;
  });

  const canPaySalary = (month, year) => {
    const today = new Date();

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (year < currentYear) return true;

    if (year === currentYear && month < currentMonth) {
      return true;
    }

    return false;
  };

  const markAsPaid = async (salaryId) => {
    const confirmPay = window.confirm("Are you sure salary has been paid?");

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

  // ------------------------------------------------------------------
  // NEW: display-only helpers (no API calls, no logic changes)
  // ------------------------------------------------------------------
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSalaries();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExportCsv = () => {
    if (filteredSalaries.length === 0) return;

    const headers = [
      "Partner",
      "Month",
      "Year",
      "Basic Salary",
      "Bonus",
      "Incentive",
      "Deduction",
      "Orders",
      "Total Salary",
      "Status",
      "Paid Date",
    ];

    const rows = filteredSalaries.map((s) => [
      s.partnerId?.name || "",
      getMonthName(s.month),
      s.year,
      s.basicSalary,
      s.bonus,
      s.incentive,
      s.deduction,
      s.totalDeliveredOrders,
      s.totalSalary,
      s.paymentStatus,
      s.paidDate ? new Date(s.paidDate).toLocaleDateString() : "-",
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "salary-records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  const stats = useMemo(() => {
    const totalSalary = salaries.reduce((sum, s) => sum + Number(s.totalSalary || 0), 0);
    const paid = salaries.filter((s) => s.paymentStatus === "Paid");
    const pending = salaries.filter((s) => s.paymentStatus !== "Paid");
    const paidTotal = paid.reduce((sum, s) => sum + Number(s.totalSalary || 0), 0);
    const pendingTotal = pending.reduce((sum, s) => sum + Number(s.totalSalary || 0), 0);
    const uniquePartners = new Set(salaries.map((s) => s.partnerId?._id || s.partnerId?.name));

    return {
      totalSalary,
      paidTotal,
      pendingTotal,
      partnerCount: uniquePartners.size,
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }, [salaries]);

  const animatedTotal = useCountUp(stats.totalSalary);
  const animatedPaid = useCountUp(stats.paidTotal);
  const animatedPending = useCountUp(stats.pendingTotal);
  const animatedPartners = useCountUp(stats.partnerCount);

  const currentMonthLabel = `${getMonthName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`;

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <AdminLayout>
      <div className="salary-page">
        {/* ============ HERO ============ */}
        <section className="hero">
          <div className="hero-text">
            <h1>Salary Management</h1>
            <p>Track, review and pay your delivery partners with confidence</p>
          </div>

          <div className="hero-meta">
            <div className="meta-pill">
              <FaCalendarAlt />
              <span>{currentMonthLabel}</span>
            </div>
            <div className="meta-pill">
              <FaBoxOpen />
              <span>{filteredSalaries.length} Records</span>
            </div>
            <button
              className={`hero-btn ghost ripple ${isRefreshing ? "spinning" : ""}`}
              onClick={handleRefresh}
            >
              <FaSyncAlt /> Refresh
            </button>
            <button className="hero-btn solid ripple" onClick={handleExportCsv}>
              <FaDownload /> Export
            </button>
          </div>
        </section>

    {/* ============ SUMMARY CARDS ============ */}
<section className="summary-gridsm">

  <div
    className="summary-cardsm grad-indigosm fade-in-up"
    style={{ animationDelay: "0ms" }}
  >
    <div className="summary-iconsm">
      <FaMoneyBillWave />
    </div>

    <div className="summary-valuesm">
      ₹{Math.round(animatedTotal).toLocaleString("en-IN")}
    </div>

    <div className="summary-labelsm">
      Total Salary
    </div>

    <div className="summary-subsm">
      Across all records
    </div>
  </div>

  <div
    className="summary-cardsm grad-greensm fade-in-up"
    style={{ animationDelay: "60ms" }}
  >
    <div className="summary-iconsm">
      <FaCheckCircle />
    </div>

    <div className="summary-valuesm">
      ₹{Math.round(animatedPaid).toLocaleString("en-IN")}
    </div>

    <div className="summary-labelsm">
      Paid Salary
    </div>

    <div className="summary-subsm">
      {stats.paidCount} payments done
    </div>
  </div>

  <div
    className="summary-cardsm grad-ambersm fade-in-up"
    style={{ animationDelay: "120ms" }}
  >
    <div className="summary-iconsm">
      <FaClock />
    </div>

    <div className="summary-valuesm">
      ₹{Math.round(animatedPending).toLocaleString("en-IN")}
    </div>

    <div className="summary-labelsm">
      Pending Salary
    </div>

    <div className="summary-subsm">
      {stats.pendingCount} awaiting
    </div>
  </div>

  <div
    className="summary-cardsm grad-violetsm fade-in-up"
    style={{ animationDelay: "180ms" }}
  >
    <div className="summary-iconsm">
      <FaUsers />
    </div>

    <div className="summary-valuesm">
      {Math.round(animatedPartners)}
    </div>

    <div className="summary-labelsm">
      Delivery Partners
    </div>

    <div className="summary-subsm">
      Active this period
    </div>
  </div>

</section>

        {/* ============ FLOATING FILTER BAR ============ */}
        <section className="floating-filter-bar">
          <div className="ff-field">
            <FaSearch />
            <input
              type="text"
              placeholder="Search partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ff-field ff-select">
            <FaCalendarAlt />
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="">All Months</option>
              {MONTHS.slice(1).map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="ff-field ff-select">
            <FaFilter />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </section>

        {/* ============ CARD GRID ============ */}
        {loading ? (
          <div className="salary-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="salary-card-skeleton">
                <div className="sk-circle" />
                <div className="sk-line w60" />
                <div className="sk-line w40" />
                <div className="sk-line w80 big" />
                <div className="sk-line w100" />
                <div className="sk-line w100" />
              </div>
            ))}
          </div>
        ) : filteredSalaries.length === 0 ? (
          <div className="empty-state-card">
            <FaBoxOpen className="empty-icon" />
            <p>No salary records found</p>
            <span>Try adjusting your search or filters</span>
          </div>
        ) : (
          <div className="salary-grid">
            {filteredSalaries.map((salary, index) => (
              <div
                className="partner-card fade-in-up"
                key={salary._id}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="pc-top">
                  <span className="pc-avatar">{getInitials(salary.partnerId?.name)}</span>
                  <div className="pc-identity">
                    <h3>{salary.partnerId?.name}</h3>
                    <span className="pc-month">
                      {getMonthName(salary.month)} • {salary.year}
                    </span>
                  </div>
                  <span
                    className={
                      salary.paymentStatus === "Paid" ? "status-dot paid" : "status-dot pending"
                    }
                  >
                    {salary.paymentStatus === "Paid" ? "🟢" : "🟠"} {salary.paymentStatus}
                  </span>
                </div>

                <div className="pc-total">
                  <span className="pc-total-label">
                    <FaWallet /> Total Salary
                  </span>
                  <span className="pc-total-value">{formatCurrency(salary.totalSalary)}</span>
                </div>

                <div className="pc-breakdown">
                  <div className="pc-row">
                    <span>Basic Salary</span>
                    <strong>{formatCurrency(salary.basicSalary)}</strong>
                  </div>
                  <div className="pc-row">
                    <span>Bonus</span>
                    <strong>{formatCurrency(salary.bonus)}</strong>
                  </div>
                  <div className="pc-row">
                    <span>Incentive</span>
                    <strong>{formatCurrency(salary.incentive)}</strong>
                  </div>
                  <div className="pc-row">
                    <span>Deduction</span>
                    <strong className="danger-text">
                      -{formatCurrency(salary.deduction)}
                    </strong>
                  </div>
                </div>

                <div className="pc-orders">
                  <FaBoxOpen /> {salary.totalDeliveredOrders} Delivered Orders
                </div>

                <div className="pc-actions">
                  <button
                    className="pc-btn view ripple"
                    onClick={() => {
                      setSelectedSalary(salary);
                      setShowViewModal(true);
                    }}
                  >
                    <FaEye /> View
                  </button>

                  <button
                    className="pc-btn edit ripple"
                    onClick={() => {
                      setEditSalary({
                        id: salary._id,
                        basicSalary: salary.basicSalary,
                        bonus: salary.bonus,
                        incentive: salary.incentive,
                        deduction: salary.deduction,
                        remarks: salary.remarks || "",
                      });
                      setShowEditModal(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </button>

                  {salary.paymentStatus === "Pending" ? (
                    canPaySalary(salary.month, salary.year) ? (
                      <button className="pc-btn pay ripple" onClick={() => markAsPaid(salary._id)}>
                        <FaCheckCircle /> Mark Paid
                      </button>
                    ) : (
                      <button className="pc-btn disabled" disabled>
                        <FaClock /> Not Due
                      </button>
                    )
                  ) : (
                    <button className="pc-btn disabled" disabled>
                      <FaCheckCircle /> Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============ VIEW DRAWER (right side) ============ */}
        <div className={`drawer-overlay ${showViewModal ? "open" : ""}`}
          onClick={() => setShowViewModal(false)}
        />
        <aside className={`view-drawer ${showViewModal ? "open" : ""}`}>
          {selectedSalary && (
            <>
              <div className="drawer-header">
                <button className="drawer-close" onClick={() => setShowViewModal(false)}>
                  <FaTimes />
                </button>
                <span className="pc-avatar large">
                  {getInitials(selectedSalary.partnerId?.name)}
                </span>
                <h2>{selectedSalary.partnerId?.name}</h2>
                <span
                  className={
                    selectedSalary.paymentStatus === "Paid" ? "status-dot paid" : "status-dot pending"
                  }
                >
                  {selectedSalary.paymentStatus === "Paid" ? "🟢" : "🟠"}{" "}
                  {selectedSalary.paymentStatus}
                </span>
              </div>

              <div className="drawer-body">
                <div className="drawer-section">
                  <h4>
                    <FaUserCircle /> Partner Profile
                  </h4>
                  <div className="drawer-grid">
                    <div>
                      <span className="d-label">Name</span>
                      <span className="d-value">{selectedSalary.partnerId?.name}</span>
                    </div>
                    <div>
                      <span className="d-label">Period</span>
                      <span className="d-value">
                        {getMonthName(selectedSalary.month)} {selectedSalary.year}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <h4>
                    <FaWallet /> Salary Breakdown
                  </h4>
                  <div className="drawer-grid">
                    <div>
                      <span className="d-label">Basic Salary</span>
                      <span className="d-value">{formatCurrency(selectedSalary.basicSalary)}</span>
                    </div>
                    <div>
                      <span className="d-label">Bonus</span>
                      <span className="d-value">{formatCurrency(selectedSalary.bonus)}</span>
                    </div>
                    <div>
                      <span className="d-label">Incentive</span>
                      <span className="d-value">{formatCurrency(selectedSalary.incentive)}</span>
                    </div>
                    <div>
                      <span className="d-label">Deduction</span>
                      <span className="d-value danger-text">
                        -{formatCurrency(selectedSalary.deduction)}
                      </span>
                    </div>
                  </div>
                  <div className="drawer-total-banner">
                    <span>Total Salary</span>
                    <strong>{formatCurrency(selectedSalary.totalSalary)}</strong>
                  </div>
                </div>

                <div className="drawer-section">
                  <h4>
                    <FaBoxOpen /> Order Summary
                  </h4>
                  <div className="drawer-grid">
                    <div>
                      <span className="d-label">Delivered Orders</span>
                      <span className="d-value">{selectedSalary.totalDeliveredOrders}</span>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <h4>
                    <FaCheckCircle /> Payment Details
                  </h4>
                  <div className="drawer-grid">
                    <div>
                      <span className="d-label">Status</span>
                      <span className="d-value">{selectedSalary.paymentStatus}</span>
                    </div>
                    <div>
                      <span className="d-label">Paid Date</span>
                      <span className="d-value">
                        {selectedSalary.paidDate
                          ? new Date(selectedSalary.paidDate).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <h4>
                    <FaRegStickyNote /> Remarks
                  </h4>
                  <p className="drawer-remarks">{selectedSalary.remarks || "No remarks added."}</p>
                </div>

                <div className="drawer-section">
                  <h4>
                    <FaHistory /> Payment Timeline
                  </h4>
                  <div className="timeline">
                    <div className="timeline-item done">
                      <span className="t-dot" />
                      <div>
                        <strong>Salary Generated</strong>
                        <span>
                          {getMonthName(selectedSalary.month)} {selectedSalary.year}
                        </span>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedSalary.paymentStatus === "Paid" ? "done" : "pending"}`}>
                      <span className="t-dot" />
                      <div>
                        <strong>
                          {selectedSalary.paymentStatus === "Paid" ? "Payment Completed" : "Payment Pending"}
                        </strong>
                        <span>
                          {selectedSalary.paidDate
                            ? new Date(selectedSalary.paidDate).toLocaleDateString()
                            : "Awaiting payment"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="drawer-footer">
                <button className="cancel-btn ripple" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </>
          )}
        </aside>

        {/* ============ EDIT SLIDE-OVER (right side) ============ */}
        <div
          className={`drawer-overlay ${showEditModal ? "open" : ""}`}
          onClick={() => setShowEditModal(false)}
        />
        <aside className={`edit-drawer ${showEditModal ? "open" : ""}`}>
          <div className="drawer-header simple">
            <h2>Edit Salary</h2>
            <button className="drawer-close" onClick={() => setShowEditModal(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="drawer-body">
            <div className="edit-field">
              <label>Basic Salary</label>
              <input
                type="number"
                value={editSalary.basicSalary}
                onChange={(e) =>
                  setEditSalary({ ...editSalary, basicSalary: e.target.value })
                }
              />
            </div>

            <div className="edit-field">
              <label>Bonus</label>
              <input
                type="number"
                value={editSalary.bonus}
                onChange={(e) => setEditSalary({ ...editSalary, bonus: e.target.value })}
                placeholder="Bonus"
              />
            </div>

            <div className="edit-field">
              <label>Incentive</label>
              <input
                type="number"
                value={editSalary.incentive}
                onChange={(e) =>
                  setEditSalary({ ...editSalary, incentive: e.target.value })
                }
              />
            </div>

            <div className="edit-field">
              <label>Deduction</label>
              <input
                type="number"
                value={editSalary.deduction}
                onChange={(e) =>
                  setEditSalary({ ...editSalary, deduction: e.target.value })
                }
              />
            </div>

            <div className="edit-field">
              <label>Remarks</label>
              <textarea
                value={editSalary.remarks}
                onChange={(e) => setEditSalary({ ...editSalary, remarks: e.target.value })}
              />
            </div>

            <div className="drawer-total-banner live">
              <span>Live Total Salary</span>
              <strong>
                {formatCurrency(
                  Number(editSalary.basicSalary) +
                    Number(editSalary.bonus) +
                    Number(editSalary.incentive) -
                    Number(editSalary.deduction)
                )}
              </strong>
            </div>
          </div>

          <div className="drawer-footer">
            <button className="cancel-btn ripple" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button className="save-btn ripple" onClick={updateSalary}>
              Save Changes
            </button>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}