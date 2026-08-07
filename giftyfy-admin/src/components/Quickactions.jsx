import React from "react";

/**
 * QuickActions
 * Renders the shortcut buttons. Pass in `onNavigate` (or wire your own
 * router `navigate` / `Link` in place of the buttons) to route each
 * action to its real page — kept generic here since routing isn't
 * part of the original component.
 */
const DEFAULT_ACTIONS = [
  { key: "add-product", label: "Add Product", icon: "bi-bag-plus-fill" },
  { key: "add-category", label: "Add Category", icon: "bi-tags-fill" },
  { key: "create-coupon", label: "Create Coupon", icon: "bi-ticket-perforated-fill" },
  { key: "add-banner", label: "Add Banner", icon: "bi-image-fill" },
];

const QuickActions = ({ onAction }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Quick Actions</h3>
      </div>

      <div className="gy-card-body">
        <div className="quick-actions-grid">
          {DEFAULT_ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              className="quick-action-btn"
              onClick={() => onAction && onAction(action.key)}
            >
              <span className="qa-icon">
                <i className={`bi ${action.icon}`} aria-hidden="true" />
              </span>
              <span className="qa-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;