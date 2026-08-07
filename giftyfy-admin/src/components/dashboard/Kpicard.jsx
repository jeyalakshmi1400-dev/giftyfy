import React from "react";
import useCountUp from "./useCountUp";

/**
 * KpiCard
 * Displays a single KPI metric with an icon, an animated counter,
 * and an optional up/down trend pill.
 *
 * Props:
 *  - icon: bootstrap-icons class name, e.g. "bi-bag-check-fill"
 *  - label: string label, e.g. "Today Orders"
 *  - value: raw numeric value (already computed by the parent)
 *  - prefix: string prefixed before the number, e.g. "₹ "
 *  - decimals: number of decimal places to show (default 0)
 *  - delta: optional { value: number, direction: "up" | "down" } for trend
 */
const KpiCard = ({ icon, label, value, prefix = "", decimals = 0, delta }) => {
  const animated = useCountUp(value);

  const formatted = decimals > 0
    ? animated.toFixed(decimals)
    : Math.round(animated).toLocaleString("en-IN");

  return (
    <div className="kpi-card gy-animate-in">
      <div className="kpi-icon">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>

      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {prefix}
        {formatted}
      </div>

      {delta && (
        <span className={`kpi-delta ${delta.direction}`}>
          <i className={`bi ${delta.direction === "up" ? "bi-arrow-up-short" : "bi-arrow-down-short"}`} />
          {Math.abs(delta.value)}%
        </span>
      )}
    </div>
  );
};

export default KpiCard;