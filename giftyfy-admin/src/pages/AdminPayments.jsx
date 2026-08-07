import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/adminPayments.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AdminLayout from "../layout/AdminLayout";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);

  const [filter, setFilter] = useState({
    status: "",
    method: "",
    date: "",
  });

  const token = localStorage.getItem("token");

  const fetchPayments = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/payment/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("PAYMENTS 👉", res.data);

      setPayments(
        Array.isArray(res.data)
          ? res.data
          : res.data.payments || []
      );
    } catch (err) {
      console.log("PAYMENT FETCH ERROR 👉", err);
      setPayments([]);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (
      filter.method &&
      (p.paymentMethod || p.method) !== filter.method
    )
      return false;

    if (
      filter.status &&
      (p.status || "").toLowerCase() !==
        filter.status.toLowerCase()
    )
      return false;

    if (filter.date) {
      const d = new Date(p.createdAt)
        .toISOString()
        .split("T")[0];

      if (d !== filter.date) return false;
    }

    return true;
  });

  const onlineTotal = filteredPayments
  .filter((p) => p.method !== "COD")
  .reduce((a, b) => a + (b.amount || 0), 0);

const codTotal = filteredPayments
  .filter((p) => p.method === "COD")
  .reduce((a, b) => a + (b.amount || 0), 0);

const chartData = [
  {
    name: "Online",
    value: onlineTotal,
  },
  {
    name: "COD",
    value: codTotal,
  },
];

const COLORS = ["#6366f1", "#f59e0b"];

  return (
   <AdminLayout>

      <div className="admin-payment-content">
        <h2>Payments & Transactions 💰</h2>

        {/* FILTERS */}
        <div className="payment-filters">
          <select
            onChange={(e) =>
              setFilter({
                ...filter,
                method: e.target.value,
              })
            }
          >
            <option value="">All Methods</option>
            <option value="Online">Razorpay</option>
            <option value="COD">Cash On Delivery</option>
          </select>

          <select
            onChange={(e) =>
              setFilter({
                ...filter,
                status: e.target.value,
              })
            }
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>

          <input
            type="date"
            onChange={(e) =>
              setFilter({
                ...filter,
                date: e.target.value,
              })
            }
          />
        </div>

        {/* TABLE */}
        <div className="payment-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center" }}
                  >
                    No Payments Found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p._id}>
                    {/* ORDER ID */}
                    <td>
                      #
                      {p.orderId ||
                        p.order?._id?.slice(-6) ||
                        p.order?.slice?.(-6) ||
                        "N/A"}
                    </td>

                    {/* USER */}
                    <td>
                      <p>
                        {p.user?.name ||
                          p.customerName ||
                          "N/A"}
                      </p>

                      <small>
                        {p.user?.email ||
                          p.customerEmail ||
                          ""}
                      </small>
                    </td>

                    {/* DATE */}
                    <td>
                      {p.createdAt
                        ? new Date(
                            p.createdAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* AMOUNT */}
                    <td>
                      ₹
                      {p.amount ||
                        p.totalAmount ||
                        0}
                    </td>

                    {/* METHOD */}
                    <td>
                      <span
                      className={`badge ${(p.method || "online").toLowerCase()}`}
                      >
                        {p.method || "Online"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`status ${(
                          p.status || "pending"
                        ).toLowerCase()}`}
                      >
                        {p.status || "Pending"}
                      </span>
                    </td>

                    {/* TXN */}
                    <td>
                      {p.razorpay_payment_id ||
                        p.transactionId ||
                        "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* REPORT */}
<div className="payment-report">

  <h3>Payment Report 📊</h3>

  <div className="chart-wrapper">

    <ResponsiveContainer width="100%" height={320}>
      <PieChart>

        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={110}
          dataKey="value"
          label
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend />

      </PieChart>
    </ResponsiveContainer>

  </div>

</div>
      </div>
    </AdminLayout>
  );
}