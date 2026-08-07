import React from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/**
 * RevenueAreaChart
 * Renders the "Daily Revenue" area chart.
 * Data shape is unchanged from the original implementation:
 *   [{ day, revenue }]
 */
const RevenueAreaChart = ({ data }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Revenue Analytics</h3>
        <span className="gy-card-link">View report</span>
      </div>

      <div className="gy-card-body" style={{ paddingTop: 8 }}>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ecebf6" vertical={false} />

            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#a3a1b8" }}
              axisLine={{ stroke: "#ecebf6" }}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 12, fill: "#a3a1b8" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              formatter={(value) => [`₹ ${value}`, "Revenue"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #ecebf6",
                boxShadow: "0 8px 24px rgba(30,27,46,0.08)",
                fontSize: 13,
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#7c3aed"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueAreaChart;