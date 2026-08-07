import React from "react";
import "../styles/modals.css";

const DELAY_REASONS = [
  {
    value: "Traffic",
    label: "Heavy Traffic",
    desc: "Roads are congested right now",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h14M6 17V9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v8" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
        <path d="M6 11h12" />
      </svg>
    ),
  },
  {
    value: "Rain",
    label: "Bad Weather",
    desc: "Rain or poor visibility",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13a4 4 0 0 0 .9-7.9A5.5 5.5 0 0 0 6.4 7 3.5 3.5 0 0 0 7 14h9z" />
        <line x1="8" y1="18" x2="8" y2="20" />
        <line x1="12" y1="18" x2="12" y2="21" />
        <line x1="16" y1="18" x2="16" y2="20" />
      </svg>
    ),
  },
  {
    value: "Breakdown",
    label: "Vehicle Issue",
    desc: "Mechanical or fuel problem",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-2.1 2.5-2.5z" />
      </svg>
    ),
  },
  {
    value: "Emergency",
    label: "Other",
    desc: "Something else came up",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function DelayModal({
  order,
  delayReason,
  setDelayReason,
  rescheduleDate,
  setRescheduleDate,
  rescheduleTime,
  setRescheduleTime,
  note,
  setNote,
  onClose,
  onSubmit,
}) {
  const formatPreview = () => {
    if (!rescheduleTime) return null;
    const [h, m] = rescheduleTime.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hr12 = hour % 12 === 0 ? 12 : hour % 12;
    const dayLabel = rescheduleDate
      ? new Date(rescheduleDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })
      : "Today";
    return `${dayLabel}, ${hr12}:${m} ${ampm}`;
  };

  const preview = formatPreview();

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="dm-header">
          <div className="dm-header-icon dm-header-icon--delay">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </div>
          <div className="dm-header-text">
            <h3 className="dm-title">Report Delivery Delay</h3>
            <p className="dm-subtitle">
              Order #{order?._id?.slice(-5)} &middot; {order?.user?.name}
            </p>
          </div>
          <button className="dm-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="dm-body">
          {/* NOTIFICATION BANNER */}
          <div className="dm-alert dm-alert--warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <strong>Customer notification will be sent immediately</strong>
              <p>
                Your customer will receive an SMS and push notification about the
                new delivery time.
              </p>
            </div>
          </div>

          {/* REASON CARDS */}
          <div className="dm-section">
            <span className="dm-label">Reason for delay</span>
            <div className="dm-reason-grid">
              {DELAY_REASONS.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  className={`dm-reason-card ${
                    delayReason === r.value ? "is-selected" : ""
                  }`}
                  onClick={() => setDelayReason(r.value)}
                >
                  <span className="dm-radio" />
                  <span className="dm-reason-icon">{r.icon}</span>
                  <span className="dm-reason-text">
                    <span className="dm-reason-label">{r.label}</span>
                    <span className="dm-reason-desc">{r.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* DATE + TIME */}
          <div className="dm-section">
            <span className="dm-label">New delivery time</span>
            <div className="dm-datetime">
              <div className="dm-field">
                <svg className="dm-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="dm-input"
                />
              </div>
              <div className="dm-field">
                <svg className="dm-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="dm-input"
                />
              </div>
            </div>
            {preview && (
              <p className="dm-preview">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {preview} &middot; Customer will receive updated time
              </p>
            )}
          </div>

          {/* NOTE */}
          <div className="dm-section">
            <span className="dm-label">Additional note (optional)</span>
            <textarea
              placeholder="Add any details for the customer or support team..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="dm-textarea"
            />
          </div>

          {/* TIP */}
          <div className="dm-alert dm-alert--info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
            </svg>
            <div>
              <p>
                Consistent on-time deliveries increase your rating. Communicate
                proactively with customers.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="dm-footer">
          <button className="dm-btn dm-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dm-btn dm-btn--delay"
            onClick={onSubmit}
            disabled={!delayReason}
          >
            Confirm New Time
          </button>
        </div>
      </div>
    </div>
  );
}
