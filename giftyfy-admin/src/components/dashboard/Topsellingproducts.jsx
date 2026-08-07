import React from "react";

/**
 * TopSellingProducts
 * Expects products as: [{ id, name, image, unitsSold, revenue }]
 * NOTE: wire to a real "top products" endpoint when available.
 */
const TopSellingProducts = ({ products = [] }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Top Selling Products</h3>
        <span className="gy-card-link">View all</span>
      </div>

      <div className="gy-card-body p-0 mt-2">
        {products.map((product) => (
          <div key={product.id} className="gy-list-row">
            <img
              src={product.image || "https://via.placeholder.com/40x40.png?text=%20"}
              alt={product.name}
              className="gy-avatar"
            />
            <div>
              <p className="gy-list-title">{product.name}</p>
              <p className="gy-list-sub">{product.unitsSold} units sold</p>
            </div>
            <div className="gy-list-value">₹ {product.revenue}</div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center text-muted py-4" style={{ fontSize: 13.5 }}>
            No product sales data yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default TopSellingProducts;