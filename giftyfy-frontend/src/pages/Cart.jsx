import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/cart.css";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState({
    items: [],
    summary: {}
  });

  // UI-only state for the wishlist heart toggle — purely cosmetic,
  // does not touch cart data, API calls, or business logic.
  const [savedIds, setSavedIds] = useState(() => new Set());

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/cart", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        console.log("CART DATA:", res.data);

        setCart({
          items: res.data.items.map(item => ({
            ...item,
            allowedPincodes: item.allowedPincodes || [] // ⭐ safety
          })),
          summary: res.data.summary
        });
      })
      .catch((err) => console.log(err));
  }, []);

  const updateQty = async (item, newQty) => {
    
    if (newQty < 1) return;

    const diff = newQty - item.quantity; // 🔥 important

    try {
      const res = await axios.post(
        "http://localhost:4000/api/cart/add",
        {
          productId: item.product._id || item.product,
          quantity: diff, // ✅ ONLY CHANGE
          name: item.name,
          image: item.image,
          price: item.price,
          originalPrice: item.originalPrice,
          discountType: item.discountType,
          discountValue: item.discountValue,
          gst: item.gst,
          size: item.size,
          variant: item.variant,
          message: item.message
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
console.log("UPDATE RESPONSE", res.data);

      setCart(res.data);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.log(err);
    }
  };

  const removeItem = async (id) => {
    try {
      const res = await axios.delete(
        `http://localhost:4000/api/cart/remove/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setCart(res.data); 
      window.dispatchEvent(new Event("cartUpdated"));

    } catch (err) {
      console.log(err);
    }
  };

  // Cosmetic-only toggle, no API call, no effect on cart/business logic
  const toggleSaved = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const summary = cart.summary || {};

  return (
    <div className="giftfy-cart-page">
      <div className="giftfy-cart-page__container">
        <div className="giftfy-cart-page__header">
          <h2 className="giftfy-cart-heading">
            Your Cart
            {cart.items?.length > 0 && (
              <span className="giftfy-cart-heading__count">
                {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
              </span>
            )}
          </h2>
        </div>

        <div className="giftfy-cart-wrapper">
          {/* LEFT SIDE */}
          <div className="giftfy-cart-products">
            {cart.items?.length === 0 ? (
              <div className="giftfy-empty-cart">
                <div className="giftfy-empty-cart__illustration">
                  <svg
                    viewBox="0 0 200 160"
                    className="giftfy-empty-cart__svg"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#DB2777" />
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="80" r="70" fill="url(#cartGrad)" opacity="0.08" />
                    <path
                      d="M40 40h14l10 66h84l12-52H70"
                      fill="none"
                      stroke="url(#cartGrad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="90" cy="126" r="8" fill="url(#cartGrad)" />
                    <circle cx="140" cy="126" r="8" fill="url(#cartGrad)" />
                  </svg>
                </div>

                <h3 className="giftfy-empty-cart__heading">Your Cart is Empty</h3>
                <p className="giftfy-empty-cart__description">
                  Looks like you haven't added anything yet. Start exploring
                  and find something you'll love.
                </p>

                <button
                  className="giftfy-shop-btn"
                  onClick={() => navigate("/")}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              (cart.items || []).map((item, idx) => {
                const finalPrice = item.price;
                const saved = item.originalPrice - item.price;
                const isSaved = savedIds.has(item._id);

                return (
                  <div
                    className="giftfy-cart-product-card"
                    key={item._id}
                    style={{ animationDelay: `${idx * 60}ms` }}
onClick={() =>
navigate(`/product/${item.product._id || item.product}`)
}                  >
                    <div className="giftfy-cart-product-card__image-wrap">
                      <img
                        src={`http://localhost:4000/uploads/${item.image}`}
                        alt={item.name}
                        className="giftfy-cart-product-image"
                      />
                    </div>

                    <div className="giftfy-cart-product-info">
                      {item.category && (
                        <span className="giftfy-cart-product-category">
                          {item.category}
                        </span>
                      )}

                      <h4 className="giftfy-cart-product-name">{item.name}</h4>

                      <div className="giftfy-cart-product-meta">
                        {item.size && (
                          <span className="giftfy-cart-product-meta__tag">
                            Size: {item.size}
                          </span>
                        )}
                        {item.variant && (
                          <span className="giftfy-cart-product-meta__tag">
                            Color: {item.variant}
                          </span>
                        )}
                      </div>

                      {/* <div className="giftfy-cart-product-status">
                        <span className="giftfy-cart-product-status__stock">
                          <span className="giftfy-dot giftfy-dot--success" />
                          {item.stockStatus || "In Stock"}
                        </span>
                       
                      </div> */}

                      {item.seller && (
                        <p className="giftfy-cart-product-seller">
                          Sold by <strong>{item.seller}</strong>
                        </p>
                      )}

                      <div className="giftfy-cart-product-price">
                        <span className="giftfy-cart-product-price__current">
                          ₹{finalPrice}
                        </span>
                        <span className="giftfy-cart-old-price">
                          ₹{item.originalPrice}
                        </span>
                        {item.discountValue ? (
                          <span className="giftfy-cart-offer">
                            {item.discountType === "percentage"
                              ? `${item.discountValue}% OFF`
                              : `₹${item.discountValue} OFF`}
                          </span>
                        ) : null}
                      </div>

                      {saved > 0 && (
                        <p className="giftfy-cart-saving">
                          You saved ₹{saved.toFixed(2)}
                        </p>
                      )}

                      <div className="giftfy-cart-product-actions">
                        {/* <button
                          className={`giftfy-cart-action-btn giftfy-cart-action-btn--save ${
                            isSaved ? "is-active" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaved(item._id);
                          }}
                        >
                          <span className="giftfy-cart-action-btn__icon">
                            {isSaved ? "♥" : "♡"}
                          </span>
                          Save for Later
                        </button> */}

                        <button
                          className="giftfy-cart-action-btn giftfy-cart-action-btn--remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item._id);
                          }}
                        >
                          <span className="giftfy-cart-action-btn__icon">🗑</span>
                          Remove
                        </button>
                      </div>
                    </div>

                    <div
                      className="giftfy-cart-qty-box"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="giftfy-cart-qty-box__btn"
                        onClick={() => updateQty(item, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span className="giftfy-cart-qty-box__value" key={item.quantity}>
                        {item.quantity}
                      </span>

                      <button
                        className="giftfy-cart-qty-box__btn"
                        onClick={() => updateQty(item, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT SIDE */}
          {cart.items?.length > 0 && (
            <div className="giftfy-cart-summary-wrap">
              <div className="giftfy-cart-summary-box">
                <h3 className="giftfy-cart-summary-box__heading">
                  Order Summary
                </h3>

                <div className="giftfy-summary-line">
                  <p>Subtotal</p>
                  <h5>₹{summary.subtotal}</h5>
                </div>

                <div className="giftfy-summary-line">
                  <p>Discount</p>
                  <h5 className="giftfy-summary-red">₹{summary.discount}</h5>
                </div>

                <div className="giftfy-summary-line">
                  <p>Delivery Charges</p>
                  <h5 className="giftfy-summary-green">Free</h5>
                </div>

                {summary.coupon && (
                  <div className="giftfy-summary-line">
                    <p>Coupon Applied</p>
                    <h5 className="giftfy-summary-green">{summary.coupon}</h5>
                  </div>
                )}

                <p className="giftfy-summary-tax">
                  Inclusive of all taxes (GST)
                </p>

              

                <hr className="giftfy-summary-divider" />

                <div className="giftfy-summary-total">
                  <p>Total</p>
                  <h4>₹{summary.total?.toFixed(2)}</h4>
                </div>

                <button
                  className="giftfy-cart-checkout-btn"
                  onClick={() =>
                    navigate("/checkout", {
                      state: {
                        cartItems: cart.items,
                        summary: cart.summary,
                      },
                    })
                  }
                >
                  <span>Proceed to Checkout</span>
                  <span className="giftfy-cart-checkout-btn__arrow">→</span>
                </button>

                <p className="giftfy-summary-secure-note">
                  🔒 100% Secure Checkout
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}