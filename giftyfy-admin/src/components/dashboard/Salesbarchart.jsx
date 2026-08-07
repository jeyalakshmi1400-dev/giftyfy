import React from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/**
 * SalesBarChart
 * Renders the "Purchase Frequency" bar chart.
 * Data shape is unchanged from the original implementation: [{ name, value }]
 */
const SalesBarChart = ({ data }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Sales Analytics</h3>
      </div>

      <div className="gy-card-body" style={{ paddingTop: 8 }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ecebf6" vertical={false} />

            <XAxis
              dataKey="name"
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
              cursor={{ fill: "rgba(124,58,237,0.06)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #ecebf6",
                boxShadow: "0 8px 24px rgba(30,27,46,0.08)",
                fontSize: 13,
              }}
            />

            <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesBarChart;