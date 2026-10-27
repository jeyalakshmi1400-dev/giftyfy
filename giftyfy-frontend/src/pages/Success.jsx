/**
 * Success.jsx — Premium Order Success Page
 * Keeps existing functionality: Order ID display, View Order, Continue Shopping
 * Design: glassmorphism card, animated checkmark, floating particles, receipt-tape bottom
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link,useLocation } from "react-router-dom";
import "../styles/success.css"

/* ── Tiny icon components (inline SVG, no external deps) ── */
const IconCopy    = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconCheck   = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconTruck   = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const IconShield  = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconClock   = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);
const IconHeadset = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);
const IconSearch  = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

/* ── Particle data (generated once, stable) ── */
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:     `${Math.round(Math.random() * 95)}%`,
  top:      `${Math.round(Math.random() * 95)}%`,
  size:     6 + Math.round(Math.random() * 8),
  delay:    (Math.random() * 5).toFixed(2),
  duration: (4 + Math.random() * 5).toFixed(2),
  shape:    ["circle", "square", "diamond"][Math.floor(Math.random() * 3)],
  hue:      ["#22c55e", "#34d399", "#6ee7b7", "#a7f3d0", "#86efac"][Math.floor(Math.random() * 5)],
}));

export default function Success() {
  const { id } = useParams();
const location = useLocation();

const paymentMethod = location.state?.paymentMethod || "Online";
const order = location.state?.order;


  /* ── copy-to-clipboard state ── */
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [id]);

  /* ── stagger card-content lines in via class after mount ── */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="sc-root">

      {/* ── Background floating particles ── */}
      <div className="sc-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className={`sc-particle sc-particle--${p.shape}`}
            style={{
              left:            p.left,
              top:             p.top,
              width:           p.size,
              height:          p.size,
              background:      p.hue,
              animationDelay:  `${p.delay}s`,
              animationDuration:`${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* ── Floating decorative shopping bags ── */}
      <div className="sc-deco sc-deco--tl" aria-hidden="true">🛍️</div>
      <div className="sc-deco sc-deco--tr" aria-hidden="true">📦</div>
      <div className="sc-deco sc-deco--bl" aria-hidden="true">🎁</div>
      <div className="sc-deco sc-deco--br" aria-hidden="true">⭐</div>

      {/* ── Main success card ── */}
      <main className={`sc-card${mounted ? " sc-card--in" : ""}`} role="main">

        {/* Animated checkmark circle */}
        <div className="sc-check-wrap">
          <div className="sc-check-ring sc-check-ring--outer" />
          <div className="sc-check-ring sc-check-ring--inner" />
          <div className="sc-check-circle">
            {/* SVG checkmark with stroke-dashoffset animation */}
            <svg className="sc-check-svg" viewBox="0 0 52 52" aria-label="Success">
              <circle className="sc-check-svg__circle" cx="26" cy="26" r="24" />
              <polyline className="sc-check-svg__mark" points="14,26 22,34 38,18" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="sc-heading-wrap">
          <h1 className="sc-heading">Order Placed Successfully!</h1>
          <p className="sc-subheading">
            Thank you for shopping with us. Your order is confirmed and our team is already on it. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Order ID card */}
        <div className="sc-orderid-card">
          <span className="sc-orderid-label">Order Reference</span>
          <div className="sc-orderid-row">
            <span className="sc-orderid-value">{id || "ORD-0000000000"}</span>
            <button
              className={`sc-copy-btn${copied ? " sc-copy-btn--done" : ""}`}
              onClick={handleCopy}
              aria-label="Copy order ID"
              title="Copy to clipboard"
            >
              {copied ? <IconCheck /> : <IconCopy />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Order Summary grid */}
        <div className="sc-summary">
          <h2 className="sc-summary-title">Order Summary</h2>
          <ul className="sc-summary-list">
            <li className="sc-summary-item">
                    <span className="sc-summary-icon sc-summary-icon--green"><IconShield /></span>

      <span className="sc-summary-key">
        Mode of Payment
      </span>
      <span className="sc-summary-val">
        {paymentMethod}
      </span>
    </li>
         
            <li className="sc-summary-item">
              <span className="sc-summary-icon sc-summary-icon--orange"><IconPackage /></span>
              <span className="sc-summary-key">Order Status</span>
              <span className="sc-summary-val sc-badge sc-badge--orange">Confirmed</span>
            </li>
          </ul>
        </div>
        {order?.items?.length > 0 && (
  <div className="sc-products">
    <h3 className="sc-products-title">Products</h3>

    {order.items.map((item, index) => (
      <div className="sc-product-item" key={index}>
        <img
  src={`http://localhost:4000/uploads/${item.image}`}
  alt={item.name}
  className="sc-product-img"
/>

        <div className="sc-product-info">
          <p className="sc-product-name">{item.name}</p>
          <p className="sc-product-qty">
            Qty : {item.quantity}
          </p>
        </div>

        <span className="sc-product-price">
          ₹{item.price * item.quantity}
        </span>
      </div>
    ))}
  </div>
)}
{order && (
  <div className="sc-price-summary">

    <div className="sc-price-row">
      <span>Subtotal</span>
      <span>₹{order.subtotal}</span>
    </div>
      <div className="sc-price-row">
  <span>Delivery</span>
  <span>
    {Number(order.deliveryCharge ?? order.delivery ?? 0) === 0
      ? "FREE"
      : `₹${order.deliveryCharge ?? order.delivery}`}
  </span>
</div>

    {order.discount > 0 && (
      <div className="sc-price-row sc-discount">
        <span>Discount</span>
        <span>- ₹{Math.round(order.discount)}</span>
      </div>
    )}

  

  
    <div className="sc-price-row sc-total">
      <span>Total Paid</span>
      <span>₹{order.totalAmount}</span>
    </div>

  </div>
)}

        {/* CTA buttons */}
        <div className="sc-actions">
          <Link
            to={`/orders?orderId=${id}`}
            className="sc-btn sc-btn--primary"
          >
            <span className="sc-btn-ripple" />
            <IconPackage />
            View My Order
          </Link>
          <Link to="/" className="sc-btn sc-btn--secondary">
            Continue Shopping
          </Link>
        </div>

        {/* Receipt tear edge */}
        <div className="sc-tear" aria-hidden="true">
          <svg viewBox="0 0 400 20" preserveAspectRatio="none">
            <path d="M0,0 Q10,20 20,10 Q30,0 40,12 Q50,20 60,8 Q70,0 80,14 Q90,20 100,6 Q110,0 120,16 Q130,20 140,8 Q150,0 160,14 Q170,20 180,6 Q190,0 200,16 Q210,20 220,8 Q230,0 240,14 Q250,20 260,6 Q270,0 280,14 Q290,20 300,8 Q310,0 320,14 Q330,20 340,6 Q350,0 360,14 Q370,20 380,8 Q390,0 400,12 L400,20 L0,20 Z" />
          </svg>
        </div>

        {/* Help section (sits below the tear) */}
        <div className="sc-help">
          <p className="sc-help-title">Need Help?</p>
          <div className="sc-help-links">
            <a href="/support" className="sc-help-link">
              <IconHeadset />
              Contact Support
            </a>
            <span className="sc-help-divider" aria-hidden="true" />
            <Link to={`/orders?orderId=${id}`} className="sc-help-link">
              <IconSearch />
              Track Order
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}