import React from "react";

const STATUS_TONE = {
  delivered: "success",
  processing: "info",
  pending: "warning",
  cancelled: "danger",
  shipped: "info",
};

/**
 * RecentOrdersTable
 * Expects orders as:
 *   [{ id, customer, date, amount, status }]
 *
 * NOTE: wire to a real "recent orders" endpoint when available.
 * Renders an empty state gracefully otherwise.
 */
const RecentOrdersTable = ({ orders = [] }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Recent Orders</h3>
        <span className="gy-card-link">View all</span>
      </div>

      <div className="gy-card-body">
        <div className="gy-table-scroll">
          <table className="gy-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>#{order.id}</td>
                  <td>{order.customer}</td>
                  <td className="text-muted">{order.date}</td>
                  <td style={{ fontWeight: 600 }}>₹ {order.amount}</td>
                  <td>
                    <span className={`gy-pill ${STATUS_TONE[order.status] || "neutral"}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No recent orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentOrdersTable;