import React, { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/wishlist.css";
import {
  FaHeart,
  FaRegHeart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaShoppingCart,
  FaCheck,
  FaArrowRight,
  FaBoxOpen,
} from "react-icons/fa";

/* =====================================================================
   DESIGN NOTES (read me first)
   ---------------------------------------------------------------------
   - Visual language: ink-black header + warm paper background + a single
     muted-gold accent for "premium" moments (prices, CTAs), with a rose
     accent reserved only for the wishlist heart. Two accents max.
   - Typography: 'Sora' for display/headings, 'Inter' for body/UI copy,
     'JetBrains Mono' for prices — numbers get a distinct, precise face
     so the price row reads like a receipt, not just bold text.
   - All original API calls / endpoints / state logic are preserved.
     Nothing about your backend contract changed — only the UI layer,
     plus a couple of optional fields (item.brand, item.rating,
     item.inStock, item.inCart) that are used *if present* and gracefully
     fall back if not, so nothing breaks against your current API.
   ===================================================================== */

const API_BASE = "http://localhost:4000";

/* ---------------------------------------------------------------------
   Reusable: Star rating display
--------------------------------------------------------------------- */
const StarRating = memo(function StarRating({ rating = 4 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<FaStar key={i} />);
    else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return (
    <div className="wl-rating" aria-label={`Rated ${rating} out of 5`}>
      <span className="wl-rating-stars">{stars}</span>
      <span className="wl-rating-value">{rating.toFixed(1)}</span>
    </div>
  );
});

/* ---------------------------------------------------------------------
   Reusable: Skeleton loading card (shown while fetch is in flight)
--------------------------------------------------------------------- */
const SkeletonCard = () => (
  <div className="wl-card wl-skeleton" aria-hidden="true">
    <div className="wl-skel-img shimmer" />
    <div className="wl-skel-body">
      <div className="wl-skel-line shimmer" style={{ width: "40%" }} />
      <div className="wl-skel-line shimmer" style={{ width: "85%" }} />
      <div className="wl-skel-line shimmer" style={{ width: "55%" }} />
      <div className="wl-skel-line shimmer" style={{ width: "70%" }} />
      <div className="wl-skel-btnrow">
        <div className="wl-skel-btn shimmer" />
        <div className="wl-skel-btn shimmer" />
      </div>
    </div>
  </div>
);

/* ---------------------------------------------------------------------
   Reusable: Empty state
--------------------------------------------------------------------- */
const EmptyWishlist = ({ onContinue }) => (
  <div className="wl-empty">
    <div className="wl-empty-illustration" aria-hidden="true">
      <svg viewBox="0 0 200 160" width="180" height="144">
        <ellipse cx="100" cy="140" rx="70" ry="10" fill="#EFEBE2" />
        <path
          d="M100 116
             C 60 88, 30 66, 30 40
             C 30 20, 46 8, 64 8
             C 80 8, 92 16, 100 30
             C 108 16, 120 8, 136 8
             C 154 8, 170 20, 170 40
             C 170 66, 140 88, 100 116 Z"
          fill="none"
          stroke="#B8863F"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="60" r="3" fill="#E8425B" />
      </svg>
    </div>
    <h2>Your wishlist is empty</h2>
    <p>Items you save show up here. Start browsing and tap the heart on anything you love.</p>
    <button className="wl-btn wl-btn-primary" onClick={onContinue}>
      Continue shopping
      <FaArrowRight />
    </button>
  </div>
);

/* ---------------------------------------------------------------------
   Reusable: single product card
--------------------------------------------------------------------- */
const WishlistCard = memo(function WishlistCard({
  item,
  onRemove,
  onMoveToCart,
  onView,
  removingId,
}) {
  const imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
  const hasDiscount = item.originalPrice > item.price;

  const discountLabel = hasDiscount
    ? (item.discountType || "").toLowerCase() === "flat"
      ? `₹${Math.round(item.originalPrice - item.price)} OFF`
      : `${Math.round(
          ((item.originalPrice - item.price) / item.originalPrice) * 100
        )}% OFF`
    : null;

  // Optional fields — safe fallbacks so nothing breaks if backend
  // doesn't send them yet.
  const brand = item.brand || null;
  const rating = typeof item.rating === "number" ? item.rating : 4;
  const inStock = item.inStock !== false; // default: assume in stock
  const inCart = Boolean(item.inCart);

  const isRemoving = removingId === item._id;

  return (
    <div className={`wl-card ${isRemoving ? "wl-card-removing" : ""}`}>
      {/* IMAGE */}
      <div className="wl-image" onClick={() => onView(item)}>
        {hasDiscount && <span className="wl-ribbon">{discountLabel}</span>}

        <button
          className="wl-heart-btn"
          aria-label="Remove from wishlist"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item._id);
          }}
        >
          <FaHeart className="wl-heart-filled" />
          <FaRegHeart className="wl-heart-outline" />
        </button>

        <img
          src={`${API_BASE}/uploads/${imageUrl}`}
          alt={item.name}
          loading="lazy"
        />

        {!inStock && (
          <div className="wl-oos-overlay">
            <FaBoxOpen />
            <span>Out of stock</span>
          </div>
        )}
      </div>

      {/* DETAILS */}
      <div className="wl-details">
        {brand && <span className="wl-brand">{brand}</span>}

        <h3 className="wl-name" onClick={() => onView(item)}>
          {item.name}
        </h3>

        <StarRating rating={rating} />

        <div className="wl-price-row">
          <span className="wl-price">₹{Math.round(item.price)}</span>
          {hasDiscount && (
            <>
              <span className="wl-price-old">₹{item.originalPrice}</span>
              <span className="wl-discount-pill">{discountLabel}</span>
            </>
          )}
        </div>

        <span className={`wl-stock ${inStock ? "in" : "out"}`}>
          <span className="wl-stock-dot" />
          {inStock ? "In stock" : "Currently unavailable"}
        </span>

        <div className="wl-actions">
          <button className="wl-btn wl-btn-ghost" onClick={() => onView(item)}>
            View product
          </button>

          {inCart ? (
            <button className="wl-btn wl-btn-cart-added" disabled>
              <FaCheck />
              In cart
            </button>
          ) : (
            <button
              className="wl-btn wl-btn-primary"
              disabled={!inStock}
              onClick={() => onMoveToCart(item)}
            >
              <FaShoppingCart />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */
function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null); // drives the remove animation

  const navigate = useNavigate();

  /* ================= FETCH ================= */
  const fetchWishlist = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/wishlist/${userId}`);
      setWishlist(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  /* ================= REMOVE ================= */
  const removeFromWishlist = useCallback(async (id) => {
    // Play the removal animation first, then call the API and update state
    // once the animation has had time to run — same end result as before,
    // just visually smoother instead of an instant pop.
    setRemovingId(id);

    try {
      await axios.delete(`${API_BASE}/api/wishlist/remove/${id}`);

      setTimeout(() => {
        setWishlist((prev) => prev.filter((item) => item._id !== id));
        setRemovingId(null);
      }, 260);
    } catch (err) {
      console.log(err);
      setRemovingId(null);
    }
  }, []);

  /* ================= MOVE TO CART ================= */
  const moveToCart = useCallback(async (item) => {
    try {
      const res = await axios.post(`${API_BASE}/api/wishlist/move-to-cart`, {
        wishlistId: item._id,
      });

      if (res.data.message === "Moved to cart") {
        setWishlist((prev) =>
          prev.map((w) => (w._id === item._id ? { ...w, inCart: true } : w))
        );
      }
    } catch (err) {
      console.log(err);
      alert("Move to cart failed");
    }
  }, []);

  const goToProduct = useCallback(
    (item) => navigate(`/product/${item.productId}`),
    [navigate]
  );

  const goShopping = useCallback(() => navigate("/"), [navigate]);

  return (
    <div className="wl-container">
      {/* HEADER */}
      <div className="wl-header">
        <div>
          <h2>
            <FaHeart className="wl-header-icon" />
            My Wishlist
          </h2>
          <p>Everything you've saved, in one place.</p>
        </div>

        <div className="wl-count">
          {loading ? "—" : wishlist.length}{" "}
          {wishlist.length === 1 ? "item" : "items"}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="wl-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <EmptyWishlist onContinue={goShopping} />
      ) : (
        <div className="wl-grid">
          {wishlist.map((item) => (
            <WishlistCard
              key={item._id}
              item={item}
              onRemove={removeFromWishlist}
              onMoveToCart={moveToCart}
              onView={goToProduct}
              removingId={removingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;