import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaFilter,
  FaStar,
  FaShoppingCart,
  FaTimes,
  FaChevronDown,
  FaThLarge,
  FaBars,
  FaEye,
  FaTruck,
  FaBolt,
  FaTag,
  FaUndoAlt,
  FaGift,
  FaCheckCircle,
  FaBoxOpen,
} from "react-icons/fa";
import { toast } from "react-toastify";

import "../styles/allproduct.css";

/* =========================================================
   HELPERS  (pure functions – shared by filter/sort/render
   so every part of the UI agrees on the same numbers)
========================================================= */

const getPrice = (product) =>
  product?.category === "Dress"
    ? product?.variants?.[0]?.sizes?.[0]?.price || 0
    : product?.price || 0;

const getOldPrice = (product) => getPrice(product) + 200;

const getDiscountPercent = (product) => {
  const price = getPrice(product);
  const old = getOldPrice(product);
  if (!old) return 0;
  return Math.round(((old - price) / old) * 100);
};

const getImage = (product) =>
  product?.category === "Dress"
    ? product?.variants?.find((v) => v.images?.length)?.images?.[0]
    : product?.image?.[0];

const getRating = (product) => product?.rating || 5;
const getReviewCount = (product) => product?.reviews ?? product?.numReviews ?? 18;
const getBrand = (product) => product?.brand || "Giftyfy";
const getStock = (product) => {
  if (typeof product?.stock === "number") return product.stock;
  if (product?.inStock === false) return 0;
  return 25; // sensible default when the API doesn't send stock
};

/* =========================================================
   SKELETON CARD – shown while the API request is in flight
========================================================= */

const SkeletonCard = React.memo(function SkeletonCard() {
  return (
    <div className="gp-card gp-skeleton" aria-hidden="true">
      <div className="gp-skeleton-block gp-skeleton-image" />
      <div className="gp-card-details">
        <div className="gp-skeleton-block gp-skeleton-line" style={{ width: "40%" }} />
        <div className="gp-skeleton-block gp-skeleton-line" style={{ width: "80%" }} />
        <div className="gp-skeleton-block gp-skeleton-line" style={{ width: "55%" }} />
        <div className="gp-skeleton-block gp-skeleton-line" style={{ width: "35%" }} />
        <div className="gp-skeleton-block gp-skeleton-btn" />
      </div>
    </div>
  );
});

/* =========================================================
   PRODUCT CARD
========================================================= */

const ProductCard = React.memo(function ProductCard({
  product,
  isWishlisted,
  wishPulse,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onQuickView,
  onOpen,
  viewMode,
}) {
  const image = getImage(product);
  const price = getPrice(product);
  const oldPrice = getOldPrice(product);
  const discount = getDiscountPercent(product);
  const rating = Math.round(getRating(product));
  const reviews = getReviewCount(product);
  const brand = getBrand(product);
  const stock = getStock(product);

  const stockLabel =
    stock === 0 ? "Out of Stock" : stock <= 5 ? `Only ${stock} left` : "In Stock";
  const stockClass = stock === 0 ? "gp-stock-out" : stock <= 5 ? "gp-stock-low" : "gp-stock-ok";

  return (
    <div
      className={`gp-card ${viewMode === "list" ? "gp-card-list" : ""}`}
      onClick={() => onOpen(product)}
    >
      <div className="gp-card-media">
        {discount > 0 && (
          <span className="gp-ribbon gp-ribbon-discount">-{discount}%</span>
        )}
        {discount >= 20 && (
          <span className="gp-chip gp-chip-hot">
            <FaBolt /> HOT
          </span>
        )}

        <button
          type="button"
          className={`gp-wishlist-btn ${wishPulse ? "gp-pulse" : ""}`}
          onClick={(e) => onToggleWishlist(e, product)}
          aria-label="Toggle wishlist"
        >
          {isWishlisted ? <FaHeart className="gp-heart-filled" /> : <FaRegHeart />}
        </button>

        <img
          className="gp-card-image"
          src={image ? `http://localhost:4000/uploads/${image}` : "/no-image.png"}
          alt={product.name}
          loading="lazy"
        />

        {/* <button
          type="button"
          className="gp-quickview-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
        >
          <FaEye /> Quick View
        </button> */}
      </div>

      <div className="gp-card-details">
        <div className="gp-card-toprow">
          <span className="gp-brand">{brand}</span>
          <span className="gp-category">{product.category}</span>
        </div>

        <h5 className="gp-title">{product.name}</h5>

        <div className="gp-rating-row">
          <span className="gp-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar key={i} className={i < rating ? "gp-star-on" : "gp-star-off"} />
            ))}
          </span>
          <span className="gp-review-count">({reviews})</span>
        </div>

        <div className="gp-price-row">
          <span className="gp-price">₹{price}</span>
          {oldPrice > price && <span className="gp-old-price">₹{oldPrice}</span>}
          {discount > 0 && <span className="gp-discount-text">{discount}% off</span>}
        </div>

        <div className="gp-meta-row">
          <span className={`gp-stock ${stockClass}`}>
            <FaCheckCircle /> {stockLabel}
          </span>
          <span className="gp-delivery">
            <FaTruck /> Free Delivery
          </span>
        </div>

        {/* <div className="gp-actions">
          <button
            type="button"
            className="gp-btn gp-btn-outline"
            disabled={stock === 0}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <FaShoppingCart /> Add to Cart
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-solid"
            disabled={stock === 0}
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product);
            }}
          >
            Buy Now
          </button>
        </div> */}
      </div>
    </div>
  );
});

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ onClearFilters, onContinueShopping }) {
  return (
    <div className="gp-empty">
      <div className="gp-empty-illustration">
        <FaGift />
      </div>
      <h3>No gifts match just yet</h3>
      <p>Try loosening a filter or two — there's likely something perfect nearby.</p>
      <div className="gp-empty-actions">
        <button className="gp-btn gp-btn-outline" onClick={onClearFilters}>
          <FaUndoAlt /> Clear Filters
        </button>
        <button className="gp-btn gp-btn-solid" onClick={onContinueShopping}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER DRAWER
========================================================= */

function FilterDrawer({
  show,
  onClose,
  price,
  setPrice,
  category,
  setCategory,
  categories,
  subcategory,
  setSubcategory,
  subcategories,
  brands,
  brandFilter,
  setBrandFilter,
  ratingFilter,
  setRatingFilter,
  availabilityFilter,
  setAvailabilityFilter,
  discountFilter,
  setDiscountFilter,
  onReset,
  onApply,
}) {
  return (
    <div className={`gp-overlay ${show ? "gp-overlay-active" : ""}`} onClick={onClose}>
      <div className="gp-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="gp-drawer-header">
          <h3>Filters</h3>
          <button className="gp-drawer-close" onClick={onClose} aria-label="Close filters">
            <FaTimes />
          </button>
        </div>

        <div className="gp-drawer-body">
          {/* PRICE */}
          <section className="gp-filter-section">
            <h4>Price</h4>
            <input
              type="range"
              min="0"
              max="5000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="gp-range"
            />
            <p className="gp-range-value">₹0 — ₹{price}</p>
          </section>

          {/* CATEGORY */}
          <section className="gp-filter-section">
            <h4>Category</h4>
            <div className="gp-chip-list">
              {categories.map((cat, i) => (
                <button
                  key={i}
                  type="button"
                  className={`gp-filter-chip ${category === cat ? "gp-filter-chip-active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  <FaTag /> {cat}
                </button>
              ))}
            </div>
          </section>

          {/* SUBCATEGORY */}
          {subcategories.length > 0 && (
            <section className="gp-filter-section">
              <h4>Subcategory</h4>
              <div className="gp-chip-list">
                {subcategories.map((sub, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`gp-filter-chip ${subcategory === sub ? "gp-filter-chip-active" : ""}`}
                    onClick={() => setSubcategory(sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* BRAND */}
          {brands.length > 1 && (
            <section className="gp-filter-section">
              <h4>Brand</h4>
              <div className="gp-chip-list">
                {brands.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`gp-filter-chip ${brandFilter === b ? "gp-filter-chip-active" : ""}`}
                    onClick={() => setBrandFilter(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* RATING */}
          {/* <section className="gp-filter-section">
            <h4>Minimum Rating</h4>
            <div className="gp-rating-filter">
              {[4, 3, 2, 1, 0].map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`gp-rating-option ${ratingFilter === r ? "gp-rating-option-active" : ""}`}
                  onClick={() => setRatingFilter(r)}
                >
                  {r === 0 ? (
                    "Any Rating"
                  ) : (
                    <>
                      {Array.from({ length: r }).map((_, i) => (
                        <FaStar key={i} />
                      ))}
                      <span>&amp; up</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </section> */}

          {/* AVAILABILITY */}
          {/* <section className="gp-filter-section">
            <h4>Availability</h4>
            <div className="gp-chip-list">
              {["All", "In Stock"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`gp-filter-chip ${availabilityFilter === opt ? "gp-filter-chip-active" : ""}`}
                  onClick={() => setAvailabilityFilter(opt)}
                >
                  <FaBoxOpen /> {opt}
                </button>
              ))}
            </div>
          </section> */}

          {/* DISCOUNT */}
          {/* <section className="gp-filter-section">
            <h4>Discount</h4>
            <div className="gp-chip-list">
              {[0, 10, 20, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`gp-filter-chip ${discountFilter === d ? "gp-filter-chip-active" : ""}`}
                  onClick={() => setDiscountFilter(d)}
                >
                  {d === 0 ? "Any" : `${d}% or more`}
                </button>
              ))}
            </div>
          </section> */}
        </div>

        <div className="gp-drawer-footer">
          <button className="gp-btn gp-btn-outline" onClick={onReset}>
            <FaUndoAlt /> Reset
          </button>
          <button className="gp-btn gp-btn-solid" onClick={onApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

function AllProducts() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [price, setPrice] = useState(5000);
  const [category, setCategory] = useState("All");
  const [subcategory, setSubcategory] = useState("All");

  const [showFilter, setShowFilter] = useState(false);

  // additive UI-only filters (do not touch the original filtering logic)
  const [brandFilter, setBrandFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [discountFilter, setDiscountFilter] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const searchQuery = params.get("search") || "";
  const [wishlist, setWishlist] = useState([]);

  // ===== FETCH (unchanged, only wrapped with a loading flag) =====
  useEffect(() => {
    setLoading(true);

    axios
      .get("http://localhost:4000/api/product")
      .then((res) => {
        setProducts(res.data);
        setFiltered(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  // ===== FILTER (original logic preserved exactly, extra
  //       filters/sort layered on top afterwards) =====
  useEffect(() => {
    let data = [...products];

    if (searchQuery) {
      data = data.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (category !== "All") {
      data = data.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }

    if (subcategory !== "All") {
      data = data.filter((p) => p.subcategory?.toLowerCase() === subcategory.toLowerCase());
    }

    data = data.filter((p) => {
      const productPrice =
        p.category === "Dress" ? p.variants?.[0]?.sizes?.[0]?.price || 0 : p.price;

      return productPrice <= price;
    });

    // ---- additive filters (new UI, do not replace anything above) ----
    if (brandFilter !== "All") {
      data = data.filter((p) => getBrand(p) === brandFilter);
    }

    if (ratingFilter > 0) {
      data = data.filter((p) => getRating(p) >= ratingFilter);
    }

    if (availabilityFilter === "In Stock") {
      data = data.filter((p) => getStock(p) > 0);
    }

    if (discountFilter > 0) {
      data = data.filter((p) => getDiscountPercent(p) >= discountFilter);
    }

    // ---- sort (additive, applied last) ----
    if (sortBy === "price-low") {
      data = [...data].sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === "price-high") {
      data = [...data].sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === "popularity") {
      data = [...data].sort((a, b) => getReviewCount(b) - getReviewCount(a));
    }
    // "newest" keeps the API's original ordering

    setFiltered(data);
  }, [
    products,
    searchQuery,
    category,
    subcategory,
    price,
    brandFilter,
    ratingFilter,
    availabilityFilter,
    discountFilter,
    sortBy,
  ]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) return;

    axios
      .get(`http://localhost:4000/api/wishlist/${userId}`)
      .then((res) => {
        setWishlist(res.data);
      })
      .catch(console.error);
  }, []);

  // ===== CART (unchanged) =====
  const addToCart = useCallback((product) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const exist = cart.find((item) => item._id === product._id);

    if (exist) {
      exist.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    toast.success("🛒 Added to cart");
  }, []);

  const handleBuyNow = useCallback(
    (product) => {
      addToCart(product);
      navigate("/cart");
    },
    [addToCart, navigate]
  );

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category))],
    [products]
  );

  const subcategories = useMemo(
    () => [
      ...new Set(
        products
          .filter((p) => category === "All" || p.category === category)
          .map((p) => p.subcategory)
          .filter(Boolean)
      ),
    ],
    [products, category]
  );

  const brands = useMemo(() => {
    const list = [...new Set(products.map((p) => getBrand(p)))];
    return list.length > 1 ? ["All", ...list] : [];
  }, [products]);

  const handleWishlist = useCallback(async (e, product) => {
    e.stopPropagation();

    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("Please Login First");
      return;
    }

    setPulseId(product._id);
    setTimeout(() => setPulseId(null), 450);

    try {
      const existing = wishlist.find(
        (item) => String(item.productId) === String(product._id)
      );

      // ❌ REMOVE
      if (existing) {
        await axios.delete(`http://localhost:4000/api/wishlist/remove/${existing._id}`);

        setWishlist((prev) => prev.filter((item) => item._id !== existing._id));

        toast.info("Removed from Wishlist 💔");
        return;
      }

      // ❤️ ADD
      const res = await axios.post("http://localhost:4000/api/wishlist", {
        userId,
        productId: product._id,
      });

      if (res.data?.newItem) {
        setWishlist((prev) => [...prev, res.data.newItem]);
      }

      toast.success("Added to Wishlist ❤️");
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlist]);

  const clearFilters = useCallback(() => {
    setCategory("All");
    setSubcategory("All");
    setPrice(5000);
    setBrandFilter("All");
    setRatingFilter(0);
    setAvailabilityFilter("All");
    setDiscountFilter(0);
  }, []);

  const sortLabels = {
    newest: "Newest",
    "price-low": "Price: Low to High",
    "price-high": "Price: High to Low",
    popularity: "Popularity",
  };

  return (
    <div className="giftyfy-allproducts-page">
      {/* HERO */}
      <div className="gp-hero">
        <div className="gp-hero-blob gp-hero-blob-1" />
        <div className="gp-hero-blob gp-hero-blob-2" />
        <div className="gp-hero-dots" />

        <div className="gp-hero-content">
          <span className="gp-hero-eyebrow">
            <FaGift /> Curated Gifting, Delivered With Care
          </span>
          <h1>
            Affordable Gifts,
            <br />
            Under <span className="gp-hero-highlight">₹199</span>
          </h1>
          <p>Surprise your loved ones with something they'll actually remember.</p>
          <button className="gp-hero-cta" onClick={() => window.scrollTo({ top: 480, behavior: "smooth" })}>
            Shop Collection
          </button>
        </div>
      </div>

      {/* PRODUCTS HEADER */}
      <div className="gp-header">
        <div className="gp-header-left">
          <span className="gp-header-count">{filtered.length} Products Found</span>
          {searchQuery && (
            <span className="gp-header-search">
              for <strong>&ldquo;{searchQuery}&rdquo;</strong>
            </span>
          )}
        </div>

        <div className="gp-header-right">
          <div className="gp-sort">
            <label htmlFor="gp-sort-select">Sort by</label>
            <div className="gp-sort-select-wrap">
              <select
                id="gp-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FaChevronDown className="gp-sort-caret" />
            </div>
          </div>

          <div className="gp-view-toggle">
            <button
              type="button"
              className={viewMode === "grid" ? "gp-view-active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <FaThLarge />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "gp-view-active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <FaBars />
            </button>
          </div>

          <button className="gp-filter-btn" onClick={() => setShowFilter(true)}>
            <FaFilter />
            Filters
          </button>
        </div>
      </div>

      {/* PRODUCT GRID */}
      {loading ? (
        <div className="gp-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          onClearFilters={clearFilters}
          onContinueShopping={() => navigate("/")}
        />
      ) : (
        <div className={`gp-grid ${viewMode === "list" ? "gp-grid-list" : ""}`}>
          {filtered.map((product, i) => (
            <div
              className="gp-fade-in"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              key={product._id}
            >
              <ProductCard
                product={product}
                isWishlisted={wishlist.some(
                  (item) => String(item.productId) === String(product._id)
                )}
                wishPulse={pulseId === product._id}
                onToggleWishlist={handleWishlist}
                onAddToCart={addToCart}
                onBuyNow={handleBuyNow}
                onQuickView={setQuickViewProduct}
                onOpen={(p) => navigate(`/product/${p._id}`)}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>
      )}

      {/* FILTER DRAWER */}
      <FilterDrawer
        show={showFilter}
        onClose={() => setShowFilter(false)}
        price={price}
        setPrice={setPrice}
        category={category}
        setCategory={setCategory}
        categories={categories}
        subcategory={subcategory}
        setSubcategory={setSubcategory}
        subcategories={subcategories}
        brands={brands}
        brandFilter={brandFilter}
        setBrandFilter={setBrandFilter}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        availabilityFilter={availabilityFilter}
        setAvailabilityFilter={setAvailabilityFilter}
        discountFilter={discountFilter}
        setDiscountFilter={setDiscountFilter}
        onReset={clearFilters}
        onApply={() => setShowFilter(false)}
      />

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="gp-qv-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="gp-qv-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="gp-qv-close"
              onClick={() => setQuickViewProduct(null)}
              aria-label="Close quick view"
            >
              <FaTimes />
            </button>
            <div className="gp-qv-image">
              <img
                src={
                  getImage(quickViewProduct)
                    ? `http://localhost:4000/uploads/${getImage(quickViewProduct)}`
                    : "/no-image.png"
                }
                alt={quickViewProduct.name}
              />
            </div>
            <div className="gp-qv-details">
              <span className="gp-brand">{getBrand(quickViewProduct)}</span>
              <h3>{quickViewProduct.name}</h3>
              <div className="gp-rating-row">
                <span className="gp-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < Math.round(getRating(quickViewProduct)) ? "gp-star-on" : "gp-star-off"}
                    />
                  ))}
                </span>
                <span className="gp-review-count">({getReviewCount(quickViewProduct)} reviews)</span>
              </div>
              <div className="gp-price-row">
                <span className="gp-price">₹{getPrice(quickViewProduct)}</span>
                <span className="gp-old-price">₹{getOldPrice(quickViewProduct)}</span>
                <span className="gp-discount-text">{getDiscountPercent(quickViewProduct)}% off</span>
              </div>
              <p className="gp-qv-desc">
                {quickViewProduct.description ||
                  "A thoughtfully picked gift, ready to make someone's day a little brighter."}
              </p>
              <div className="gp-actions">
                <button
                  className="gp-btn gp-btn-outline"
                  onClick={() => addToCart(quickViewProduct)}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <button className="gp-btn gp-btn-solid" onClick={() => handleBuyNow(quickViewProduct)}>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllProducts;