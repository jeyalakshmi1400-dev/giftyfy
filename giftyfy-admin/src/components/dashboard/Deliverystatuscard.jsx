import React from "react";

/**
 * DeliveryStatusCard
 * Expects data as: [{ label, count, icon, tone }]
 * e.g. { label: "Out for delivery", count: 12, icon: "bi-truck", tone: "info" }
 * NOTE: wire to a real delivery-status endpoint when available.
 */
const DeliveryStatusCard = ({ data = [] }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Delivery Status</h3>
      </div>

      <div className="gy-card-body">
        <div className="d-flex flex-column gap-3">
          {data.map((item) => (
            <div key={item.label} className="d-flex align-items-center gap-3">
              <div
                className="kpi-icon"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 0,
                  background: `var(--gy-${item.tone}-bg)`,
                  color: `var(--gy-${item.tone})`,
                  boxShadow: "none",
                }}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
              </div>
              <span style={{ fontSize: 13.5, color: "var(--gy-ink-muted)", flex: 1 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{item.count}</span>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center text-muted py-3" style={{ fontSize: 13.5 }}>
              No delivery data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryStatusCard;