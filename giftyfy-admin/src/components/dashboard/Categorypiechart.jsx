import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Indigo/violet-led palette so category slices stay on-brand
const COLORS = ["#4f46e5", "#7c3aed", "#a78bfa", "#c4b5fd", "#0ea5e9", "#10b981"];

/**
 * CategoryPieChart
 * Expects data as: [{ name: string, value: number }]
 *
 * NOTE: The original dashboard API did not return category-wise sales.
 * Wire this to a real endpoint (e.g. GET /api/admin/dash/category-sales)
 * when available — until then it safely renders whatever is passed in,
 * including an empty array.
 */
const CategoryPieChart = ({ data = [] }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Category-wise Sales</h3>
      </div>

      <div className="gy-card-body" style={{ paddingTop: 8 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                cornerRadius={6}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #ecebf6",
                  boxShadow: "0 8px 24px rgba(30,27,46,0.08)",
                  fontSize: 13,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: "#6b6a80" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-5 text-muted" style={{ fontSize: 13.5 }}>
            No category sales data yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPieChart;