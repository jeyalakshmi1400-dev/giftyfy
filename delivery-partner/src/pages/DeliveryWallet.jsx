import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "../styles/deliveryWallet.css";

/* ---------- Inline icon set (no external icon library required) ---------- */
const Icon = {
  Wallet: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4a2 2 0 1 0 0 4h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Trend: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Gift: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M20 12v9H4v-9M2 7h20v5H2V7zM12 7v14M12 7C10.5 7 8 6 8 4.5A2.5 2.5 0 0 1 12 3c0 1-.5 4-.5 4M12 7c1.5 0 4-1 4-2.5A2.5 2.5 0 0 0 12 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Award: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.2 12.8 7 21l5-2.5L17 21l-1.2-8.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Minus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Package: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 12.3l2.4 2.4 4.6-5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Note: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Sort: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Inbox: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 12h4l2 3h4l2-3h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 5h13l2.5 7v6a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18v-6l2.5-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

export default function DeliveryWallet() {
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  /* --- additive UI-only state for the optional history search/filter/sort --- */
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortLatestFirst, setSortLatestFirst] = useState(true);

  const token = localStorage.getItem("deliveryToken");

  useEffect(() => {
    fetchSalary();
  }, []);

  const fetchSalary = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/salary/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSalary(res.data.currentSalary);
      setHistory(res.data.history || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getMonth = (month) => {
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

  const availableYears = useMemo(() => {
    const years = new Set(history.map((item) => item.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  const visibleHistory = useMemo(() => {
    let rows = [...history];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      rows = rows.filter((item) => {
        const monthName = getMonth(item.month)?.toLowerCase() || "";
        return (
          monthName.includes(q) ||
          String(item.year).includes(q) ||
          String(item.totalSalary).includes(q)
        );
      });
    }

    if (yearFilter !== "all") {
      rows = rows.filter((item) => String(item.year) === String(yearFilter));
    }

    if (statusFilter !== "all") {
      rows = rows.filter((item) => item.paymentStatus === statusFilter);
    }

    rows.sort((a, b) => {
      const aKey = (a.year || 0) * 100 + (a.month || 0);
      const bKey = (b.year || 0) * 100 + (b.month || 0);
      return sortLatestFirst ? bKey - aKey : aKey - bKey;
    });

    return rows;
  }, [history, searchTerm, yearFilter, statusFilter, sortLatestFirst]);

  if (loading) {
    return (
      <div className="dn2-page-wrap">
        <div className="salary-container">
          <div className="skeleton skeleton-hero" />
          <div className="salary-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton skeleton-box" key={i} />
            ))}
          </div>
          <div className="salary-bottom">
            <div className="skeleton skeleton-panel" />
            <div className="skeleton skeleton-panel" />
          </div>
        </div>
      </div>
    );
  }

return (
  <div className="dn2-page-wrap">
        <div className="salary-container">

    {/* Top Salary Card */}
    <div className="salary-top-card fade-in">
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />

      <div className="hero-top-row">
        <div className="hero-icon-badge">
          <Icon.Wallet className="hero-icon" />
        </div>
        <span
          className={
            "status-pill " +
            (salary?.paymentStatus === "Paid" ? "status-pill-paid" : "status-pill-pending")
          }
        >
          <Icon.Check className="status-pill-icon" />
          {salary?.paymentStatus || "Pending"}
        </span>
      </div>

      <p className="hero-label">My Salary · {getMonth(salary?.month)} {salary?.year || ""}</p>
      <h1 className="hero-amount">₹{(salary?.totalSalary || 0).toLocaleString("en-IN")}</h1>

      <p className="hero-motivation">
        <Icon.Sparkle className="hero-motivation-icon" />
        Keep delivering, you're doing great!
      </p>
    </div>

    {/* Summary Cards */}
    <div className="salary-grid">

      <div className="salary-box accent-indigo fade-in" style={{ animationDelay: "0.05s" }}>
        <div className="salary-box-icon icon-indigo"><Icon.Trend /></div>
        <p>Basic Salary</p>
        <h3>₹{(salary?.basicSalary || 0).toLocaleString("en-IN")}</h3>
      </div>

      <div className="salary-box accent-violet fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="salary-box-icon icon-violet"><Icon.Gift /></div>
        <p>Bonus</p>
        <h3>₹{(salary?.bonus || 0).toLocaleString("en-IN")}</h3>
      </div>

      <div className="salary-box accent-emerald fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="salary-box-icon icon-emerald"><Icon.Award /></div>
        <p>Incentive</p>
        <h3>₹{(salary?.incentive || 0).toLocaleString("en-IN")}</h3>
      </div>

      <div className="salary-box accent-rose fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="salary-box-icon icon-rose"><Icon.Minus /></div>
        <p>Deduction</p>
        <h3>₹{(salary?.deduction || 0).toLocaleString("en-IN")}</h3>
      </div>

      <div className="salary-box accent-amber fade-in" style={{ animationDelay: "0.25s" }}>
        <div className="salary-box-icon icon-amber"><Icon.Package /></div>
        <p>Orders</p>
        <h3>{salary?.totalDeliveredOrders || 0}</h3>
      </div>

      <div className="salary-box accent-slate fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="salary-box-icon icon-slate"><Icon.Calendar /></div>
        <p>Year</p>
        <h3>{salary?.year || "-"}</h3>
      </div>

    </div>

    {/* Bottom Section */}
    <div className="salary-bottom">

      {/* Salary Details */}
      <div className="salary-details panel fade-in">

        <h3 className="panel-title">Salary Details</h3>

        <div className="detail-grid">

          <div className="detail-item">
            <div className="detail-label"><Icon.Calendar className="detail-icon" />Month</div>
            <div className="detail-value">{getMonth(salary?.month)}</div>
          </div>

          <div className="detail-item">
            <div className="detail-label"><Icon.Calendar className="detail-icon" />Year</div>
            <div className="detail-value">{salary?.year}</div>
          </div>

          <div className="detail-item">
            <div className="detail-label"><Icon.Package className="detail-icon" />Delivered Orders</div>
            <div className="detail-value">{salary?.totalDeliveredOrders}</div>
          </div>

          <div className="detail-item">
            <div className="detail-label"><Icon.Clock className="detail-icon" />Paid Date</div>
            <div className="detail-value">
              {salary?.paidDate
                ? new Date(salary.paidDate).toLocaleDateString()
                : "-"}
            </div>
          </div>

          <div className="detail-item detail-item-full">
            <div className="detail-label"><Icon.Note className="detail-icon" />Remarks</div>
            <div className="detail-value">{salary?.remarks || "-"}</div>
          </div>

        </div>

      </div>

      {/* Salary History */}
      <div className="salary-history panel fade-in">

        <div className="history-header">
          <h3 className="panel-title">Salary History</h3>

          <div className="history-controls">
            <div className="control-search">
              <Icon.Search className="control-search-icon" />
              <input
                type="text"
                placeholder="Search month, year, amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="control-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              className="control-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            <button
              type="button"
              className="control-sort-btn"
              onClick={() => setSortLatestFirst((v) => !v)}
              title="Toggle sort order"
            >
              <Icon.Sort className="control-sort-icon" />
              {sortLatestFirst ? "Latest first" : "Oldest first"}
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table>

            <thead>

              <tr>
                <th>Month</th>
                <th>Year</th>
                <th>Salary</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {visibleHistory.length === 0 ? (

                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <div className="empty-state-icon"><Icon.Inbox /></div>
                      <p className="empty-state-title">No salary history yet</p>
                      <p className="empty-state-sub">
                        {history.length === 0
                          ? "Your past salary records will show up here once available."
                          : "No records match your search or filters."}
                      </p>
                    </div>
                  </td>
                </tr>

              ) : (

                visibleHistory.map((item) => (

                  <tr key={item._id}>

                    <td>{getMonth(item.month)}</td>

                    <td>{item.year}</td>

                    <td>₹{Number(item.totalSalary).toLocaleString("en-IN")}</td>

                    <td>
                      <span
                        className={
                          "status-badge " +
                          (item.paymentStatus === "Paid" ? "status-badge-paid" : "status-badge-pending")
                        }
                      >
                        {item.paymentStatus}
                      </span>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>
        </div>

      </div>

    </div>

  </div>
  </div>
);
}