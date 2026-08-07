import React from "react";

/**
 * NotificationsPanel
 * Expects notifications as: [{ id, icon, tone, message, time }]
 * NOTE: wire to a real notifications endpoint (or socket feed) when available.
 */
const NotificationsPanel = ({ notifications = [] }) => {
  return (
    <div className="gy-card gy-animate-in">
      <div className="gy-card-header">
        <h3>Notifications</h3>
        <span className="gy-card-link">Mark all read</span>
      </div>

      <div className="gy-card-body p-0 mt-2">
        {notifications.map((notif) => (
          <div key={notif.id} className="gy-notif-row">
            <div
              className="gy-notif-dot"
              style={{
                background: `var(--gy-${notif.tone}-bg)`,
                color: `var(--gy-${notif.tone})`,
              }}
            >
              <i className={`bi ${notif.icon}`} aria-hidden="true" />
            </div>
            <div className="gy-notif-text">
              <p>{notif.message}</p>
              <span>{notif.time}</span>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center text-muted py-4" style={{ fontSize: 13.5 }}>
            You're all caught up.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;