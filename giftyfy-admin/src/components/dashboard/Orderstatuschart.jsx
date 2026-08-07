import React from "react";

/**
 * OrderStatusChart
 * Lightweight status breakdown (not a chart library instance) — reads
 * cleanly at a glance and keeps the secondary-grid row from getting
 * too chart-heavy. Expects:
 *   data = [{ label: string, count: number, tone: "success"|"warning"|"danger"|"info"|"neutral" }]
 *
 * NOTE: wire this to your real order-status aggregation endpoint when
 * available; renders gracefully with an empty array in the meantime.
 */
const OrderStatusChart = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Order Status</h3>
      </div>

      <div className="gy-card-body">
        {/* stacked progress bar */}
        <div className="gy-stock-bar" style={{ height: 10, marginTop: 0, display: "flex" }}>
          {data.map((item) => (
            <div
              key={item.label}
              style={{
                width: `${(item.count / total) * 100}%`,
                background: `var(--gy-${item.tone})`,
                height: "100%",
              }}
            />
          ))}
        </div>

        <div className="mt-3 d-flex flex-column gap-2">
          {data.map((item) => (
            <div key={item.label} className="d-flex align-items-center justify-content-between">
              <span className={`gy-pill ${item.tone}`}>{item.label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{item.count}</span>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-3 text-muted" style={{ fontSize: 13.5 }}>
              No order status data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;