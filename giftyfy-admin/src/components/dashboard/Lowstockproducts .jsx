import React from "react";

/**
 * LowStockProducts
 * Expects products as: [{ id, name, image, stock, threshold }]
 * NOTE: wire to a real "low stock" endpoint when available.
 */
const LowStockProducts = ({ products = [] }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Low Stock Products</h3>
        <span className="gy-card-link">Manage</span>
      </div>

      <div className="gy-card-body p-0 mt-2">
        {products.map((product) => {
          const pct = Math.min(100, Math.round((product.stock / product.threshold) * 100));
          return (
            <div key={product.id} className="gy-list-row" style={{ alignItems: "flex-start" }}>
              <img
                src={product.image || "https://via.placeholder.com/40x40.png?text=%20"}
                alt={product.name}
                className="gy-avatar"
              />
              <div style={{ flex: 1 }}>
                <p className="gy-list-title">{product.name}</p>
                <p className="gy-list-sub">{product.stock} left in stock</p>
                <div className="gy-stock-bar">
                  <div className="gy-stock-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="gy-pill danger" style={{ marginTop: 2 }}>
                Low
              </span>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="text-center text-muted py-4" style={{ fontSize: 13.5 }}>
            All products are well stocked.
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockProducts;