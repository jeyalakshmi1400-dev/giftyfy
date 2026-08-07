import React from "react";

/**
 * LatestCustomers
 * Expects customers as: [{ id, name, email, avatar, joinedOn }]
 * NOTE: wire to a real "latest customers" endpoint when available.
 */
const LatestCustomers = ({ customers = [] }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Latest Customers</h3>
        <span className="gy-card-link">View all</span>
      </div>

      <div className="gy-card-body p-0 mt-2">
        {customers.map((customer) => (
          <div key={customer.id} className="gy-list-row">
            <img
              src={customer.avatar || "https://via.placeholder.com/40x40.png?text=%20"}
              alt={customer.name}
              className="gy-avatar gy-avatar-round"
            />
            <div>
              <p className="gy-list-title">{customer.name}</p>
              <p className="gy-list-sub">{customer.email}</p>
            </div>
            <div className="gy-list-value" style={{ fontWeight: 500, color: "var(--gy-ink-muted)", fontSize: 12 }}>
              {customer.joinedOn}
            </div>
          </div>
        ))}

        {customers.length === 0 && (
          <div className="text-center text-muted py-4" style={{ fontSize: 13.5 }}>
            No new customers yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestCustomers;