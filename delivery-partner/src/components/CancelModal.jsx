import React from "react";
import "../styles/modals.css";

const CANCEL_REASONS = [
  {
    value: "Customer Issue",
    label: "Customer Not Reachable",
    desc: "Unable to contact the customer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7a2 2 0 0 1 1.72 2z" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    ),
  },
  {
    value: "Vehicle Issue",
    label: "Vehicle Issue",
    desc: "Unable to continue delivery",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-2.1 2.5-2.5z" />
      </svg>
    ),
  },
  {
    value: "Emergency",
    label: "Emergency",
    desc: "Personal or urgent situation",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    value: "Other",
    label: "Other",
    desc: "A different reason",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

export default function CancelModal({
  order,
  cancelReason,
  setCancelReason,
  note,
  setNote,
  onClose,
  onSubmit,
}) {
  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="dm-header">
          <div className="dm-header-icon dm-header-icon--danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="dm-header-text">
            <h3 className="dm-title">Cancel Delivery</h3>
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
          {/* WARNING BANNER */}
          <div className="dm-alert dm-alert--danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>This action cannot be undone</strong>
              <p>
                Cancelling will return this order to the dispatch pool and notify
                the customer. Frequent cancellations may affect your rating.
              </p>
            </div>
          </div>

          {/* REASON CARDS */}
          <div className="dm-section">
            <span className="dm-label">Reason for cancellation</span>
            <div className="dm-reason-grid">
              {CANCEL_REASONS.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  className={`dm-reason-card ${
                    cancelReason === r.value ? "is-selected is-selected--danger" : ""
                  }`}
                  onClick={() => setCancelReason(r.value)}
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

          {/* NOTE */}
          <div className="dm-section">
            <span className="dm-label">Additional details (optional)</span>
            <textarea
              placeholder="Explain what happened so support can follow up..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="dm-textarea"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="dm-footer">
          <button className="dm-btn dm-btn--ghost" onClick={onClose}>
            Keep Order
          </button>
          <button
            className="dm-btn dm-btn--danger"
            onClick={onSubmit}
            disabled={!cancelReason}
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}
