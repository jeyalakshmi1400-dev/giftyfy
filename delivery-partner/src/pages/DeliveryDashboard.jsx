import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  FaWallet,
  FaClipboardList,
  FaCheckCircle,
  FaBell,
  FaChartLine,
  FaUserCircle,
} from "react-icons/fa";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import DeliverySidebar from "../components/DeliverySidebar";
import "../styles/delivery.css";

export default function DeliveryDashboard() {

  const [dashboard, setDashboard] =
    useState(null);

  // COLORS
  const COLORS = [
    "#8e44ad",
    "#f39c12",
    "#e74c3c",
    "#27ae60",
  ];

  // FETCH DASHBOARD
  useEffect(() => {

    fetchDashboard();

  }, []);

  const fetchDashboard = async () => {

    try {

      const token =
        localStorage.getItem(
          "deliveryToken"
        );

      const { data } = await axios.get(
        "http://localhost:4000/api/delivery/dashboard",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "DASHBOARD DATA 👉",
        data
      );

      setDashboard(data);

    } catch (error) {

      console.log(
        "DASHBOARD ERROR 👉",
        error
      );

    }

  };

  return (

    <div className="dn2-page-wrap">

     

      {/* MAIN */}
      <div className="delivery-dashboard-main">

        {/* TOP NAVBAR */}
        <div className="delivery-dashboard-navbar">

          <div>

            <h2 className="delivery-dashboard-title">
              Welcome back 👋
            </h2>

            <p className="delivery-dashboard-subtitle">
              Manage your delivery tasks easily
            </p>

          </div>

          <div className="delivery-dashboard-profile">

            <div className="delivery-dashboard-user">

              <FaUserCircle
                className="delivery-dashboard-user-icon"
              />

              <div>

                <h4>
                  Delivery Partner
                </h4>

                <span>
                  ● Online
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* STATS */}
        <div className="delivery-dashboard-stats">

          {/* EARNINGS */}
          <div className="delivery-dashboard-card">

            <div className="delivery-dashboard-card-top">

              <FaWallet
                className="delivery-dashboard-card-icon purple"
              />

            </div>

            <h3>
              ₹ {dashboard?.totalEarnings || 0}
            </h3>

            <p>
              Total Earnings
            </p>

          </div>

          {/* PENDING */}
          <div className="delivery-dashboard-card">

            <div className="delivery-dashboard-card-top">

              <FaBell
                className="delivery-dashboard-card-icon orange"
              />

            </div>

            <h3>
              {dashboard?.pendingOrders || 0}
            </h3>

            <p>
              Pending Orders
            </p>

          </div>

          {/* TOTAL */}
          <div className="delivery-dashboard-card">

            <div className="delivery-dashboard-card-top">

              <FaClipboardList
                className="delivery-dashboard-card-icon blue"
              />

            </div>

            <h3>
              {dashboard?.totalOrders || 0}
            </h3>

            <p>
              Total Orders
            </p>

          </div>

          {/* SUCCESS */}
          <div className="delivery-dashboard-card">

            <div className="delivery-dashboard-card-top">

              <FaCheckCircle
                className="delivery-dashboard-card-icon green"
              />

            </div>

            <h3>
              {dashboard?.deliveredOrders || 0}
            </h3>

            <p>
              Successful Deliveries
            </p>

          </div>

        </div>

        {/* CHART SECTION */}
        <div className="delivery-dashboard-chart-grid">

          {/* LINE CHART */}
          <div className="delivery-dashboard-chart-card">

            <div className="delivery-dashboard-chart-header">

              <h3>
                <FaChartLine /> Deliveries Overview
              </h3>

              <button>
                Today
              </button>

            </div>

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <LineChart
                data={
                  dashboard?.chartData || []
                }
              >

                <XAxis dataKey="time" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8e44ad"
                  strokeWidth={4}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          {/* PIE CHART */}
          <div className="delivery-dashboard-chart-card">

            <h3 className="delivery-dashboard-pie-title">
              Order Status
            </h3>

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <PieChart>

                <Pie
                  data={
                    dashboard?.orderStatus || []
                  }
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={4}
                >

                  {(dashboard?.orderStatus || []).map(
                    (entry, index) => (

                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index % COLORS.length
                          ]
                        }
                      />

                    )
                  )}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

            {/* LEGEND */}
            <div className="delivery-dashboard-legend">

              {(dashboard?.orderStatus || []).map(
                (item, index) => (

                  <div
                    key={index}
                    className="delivery-dashboard-legend-item"
                  >

                    <span
                      className="legend-color"
                      style={{
                        background:
                          COLORS[
                            index % COLORS.length
                          ],
                      }}
                    ></span>

                    {item.name}

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}