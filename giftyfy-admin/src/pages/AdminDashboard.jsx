import React, { useEffect, useState } from "react";
import axios from "axios";

import AdminSidebar from "../components/AdminSidebar";
import TopNavbar from "../components/TopNavbar";

import {
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import "../styles/adminDashboard.css";
import AdminLayout from "../layout/AdminLayout";

const AdminDashboard = () => {

  // =========================
  // STATES
  // =========================

  const [stats, setStats] = useState({
    todayOrders: 0,
    revenue: 0,
    customers: 0,
    deliveryPartners: 0,
  });

  const [revenueData, setRevenueData] =
    useState([]);

  const [purchaseData, setPurchaseData] =
    useState([]);

  // =========================
  // FETCH DASHBOARD
  // =========================

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:4000/api/admin/dash/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // =========================
      // STATS
      // =========================

      setStats({
        todayOrders: res.data.todayOrders,
        revenue: res.data.revenue,
        customers: res.data.customers,
        deliveryPartners:
          res.data.deliveryPartners,
      });

      // =========================
      // REVENUE DATA
      // =========================

      const formattedRevenue =
        res.data.revenueData.map((item) => ({
          day: item._id.day,
          revenue: item.revenue,
        }));

      setRevenueData(formattedRevenue);

      // =========================
      // PURCHASE DATA
      // =========================

      setPurchaseData(
        res.data.purchaseData
      );

    } catch (err) {

      console.log(err);

    }
  };

  // =========================
  // PRESENTATION-ONLY CONFIG
  // (display metadata only — no business data is derived or altered here)
  // =========================

  const statCards = [
    {
      key: "todayOrders",
      title: "Today Orders",
      value: stats.todayOrders,
      icon: "bi-bag-check-fill",
      accent: "blue",
      trendIcon: "bi-calendar3",
      trendLabel: "Today",
    },
    {
      key: "revenue",
      title: "Total Revenue",
      value: `₹ ${Math.round(stats.revenue)}`,
      icon: "bi-currency-rupee",
      accent: "green",
      trendIcon: "bi-graph-up-arrow",
      trendLabel: "All time",
    },
    {
      key: "customers",
      title: "Total Customers",
      value: stats.customers,
      icon: "bi-people-fill",
      accent: "orange",
      trendIcon: "bi-person-check",
      trendLabel: "Active",
    },
    {
      key: "deliveryPartners",
      title: "Delivery Partners",
      value: stats.deliveryPartners,
      icon: "bi-truck",
      accent: "purple",
      trendIcon: "bi-geo-alt",
      trendLabel: "On duty",
    },
  ];

  return (
    <AdminLayout>
    <div className="admin-dashboard">

      {/* SIDEBAR */}


      {/* MAIN CONTENT */}

      <div className="dashboard-content">

        {/* NAVBAR */}

        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back — here's what's happening with Giftyfy today.
        </p>

        {/* =========================
            CARDS
        ========================= */}

        <div className="section-header">
          <h2>Overview</h2>
        </div>
        <hr className="section-divider" style={{ marginBottom: 20 }} />

        <div className="dashboard-cards">

          {statCards.map((c) => (
            <div className={`card card--${c.accent}`} key={c.key}>
              <div className="card-top">
                <div className="card-icon">
                  <i className={`bi ${c.icon}`}></i>
                </div>
                <span className="card-trend">
                  <i className={`bi ${c.trendIcon}`}></i>
                  {c.trendLabel}
                </span>
              </div>

              <div>
                <h3>{c.title}</h3>
                <p>{c.value}</p>
              </div>
            </div>
          ))}

        </div>

        {/* =========================
            CHARTS
        ========================= */}

        <div className="section-header">
          <h2>Analytics</h2>
        </div>
        <hr className="section-divider" style={{ marginBottom: 20 }} />

        <div className="chart-grid">

          {/* REVENUE CHART */}

          <div className="chart-box">

            <div className="chart-box-header">
              <div>
                <h3>Daily Revenue</h3>
                <p className="chart-caption">Revenue collected per day</p>
              </div>
              <span className="chart-badge">
                <i className="bi bi-activity"></i>
                Live
              </span>
            </div>

            {revenueData.length === 0 ? (
              <div className="chart-empty">
                <div className="chart-empty-icon">
                  <i className="bi bi-bar-chart-line"></i>
                </div>
                <p className="chart-empty-title">No revenue data yet</p>
                <p>Revenue will appear here once orders start coming in.</p>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <AreaChart
                  data={revenueData}
                >

                  {/* GRADIENT */}

                  <defs>

                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="5%"
                        stopColor="#7c3aed"
                        stopOpacity={0.8}
                      />

                      <stop
                        offset="95%"
                        stopColor="#7c3aed"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>

                  {/* GRID */}

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(15, 23, 42, 0.08)"
                    vertical={false}
                  />

                  {/* X AXIS */}

                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#64748b", fontSize: 12, fontFamily: "Poppins" }}
                    axisLine={{ stroke: "rgba(15,23,42,0.08)" }}
                    tickLine={false}
                  />

                  {/* Y AXIS */}

                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12, fontFamily: "Poppins" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  {/* TOOLTIP */}

                  <Tooltip
                    formatter={(value) =>
                      `₹ ${value}`
                    }
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.08)",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                      fontFamily: "Poppins",
                      fontSize: 13,
                    }}
                  />

                  {/* AREA */}

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />

                </AreaChart>

              </ResponsiveContainer>
            )}

          </div>

          {/* PURCHASE CHART */}

          <div className="chart-box">

            <div className="chart-box-header">
              <div>
                <h3>Purchase Frequency</h3>
                <p className="chart-caption">Orders by category</p>
              </div>
            </div>

            {purchaseData.length === 0 ? (
              <div className="chart-empty">
                <div className="chart-empty-icon">
                  <i className="bi bi-bag-x"></i>
                </div>
                <p className="chart-empty-title">No purchases yet</p>
                <p>Purchase trends will show up here soon.</p>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <BarChart
                  data={purchaseData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(15, 23, 42, 0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12, fontFamily: "Poppins" }}
                    axisLine={{ stroke: "rgba(15,23,42,0.08)" }}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12, fontFamily: "Poppins" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.08)",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                      fontFamily: "Poppins",
                      fontSize: 13,
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="#9333ea"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={44}
                  />

                </BarChart>

              </ResponsiveContainer>
            )}

          </div>

        </div>

      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminDashboard;