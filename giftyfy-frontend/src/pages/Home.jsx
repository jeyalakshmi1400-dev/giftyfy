import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Carousel } from "bootstrap";
import "../styles/home.css";
import { useNavigate } from "react-router-dom";
import {
  FaRegHeart,
  FaHeart,
  FaEye,
  FaStar,
  FaTruck,
  FaGem,
  FaSyncAlt,
  FaShieldAlt,
  FaInstagram,
  FaQuoteLeft,
  FaChevronLeft,
  FaChevronRight,
  FaPaperPlane,
  FaGift,
} from "react-icons/fa";
import { toast } from "react-toastify";

/* =========================================================================
   STATIC PRESENTATIONAL CONTENT
   These arrays only drive layout/copy for the new sections requested in the
   redesign brief (Featured Collections, Shop by Recipient, Reviews, etc).
   They do NOT call any API and do NOT replace any real product/category
   data coming from the backend.
========================================================================= */

const RECIPIENTS = [
  { label: "For Him", tag: "Sharp & thoughtful picks", emoji: "🎩" },
  { label: "For Her", tag: "Elegant everyday delights", emoji: "💐" },
  { label: "For Kids", tag: "Playful & pastel-perfect", emoji: "🧸" },
  { label: "For Couples", tag: "Made for two", emoji: "💞" },
];

const OCCASIONS = [
  { label: "Birthday", emoji: "🎂" },
  { label: "Anniversary", emoji: "💍" },
  { label: "Wedding", emoji: "👰" },
  { label: "Baby Shower", emoji: "🍼" },
  { label: "Festival", emoji: "🎄" },
];

const COLLECTIONS = [
  {
    title: "Personalised Keepsakes",
    caption: "Names, photos & little details that matter",
    seed: "giftyfy-collection-1",
  },
  {
    title: "Luxury Hampers",
    caption: "Curated boxes for a grand gesture",
    seed: "giftyfy-collection-2",
  },
  {
    title: "Everyday Little Joys",
    caption: "Small gifts, big smiles",
    seed: "giftyfy-collection-3",
  },
];

const REVIEWS = [
  {
    name: "Ananya Rao",
    initial: "A",
    rating: 5,
    text:
      "The packaging alone felt like a gift. Ordered a personalised hamper for my sister and it arrived exactly on time, beautifully wrapped.",
  },
  {
    name: "Karthik Iyer",
    initial: "K",
    rating: 5,
    text:
      "Quick view made it so easy to compare sizes before buying. The quality was way better than I expected for the price.",
  },
  {
    name: "Meera Nair",
    initial: "M",
    rating: 4,
    text:
      "Loved the customisation options. Delivery took a day longer than expected but customer support kept me updated throughout.",
  },
];

const BRAND_TRUST = [
  { icon: <FaTruck />, label: "Free Shipping", caption: "On orders above ₹999" },
  { icon: <FaGem />, label: "Premium Quality", caption: "Hand-checked before dispatch" },
  { icon: <FaSyncAlt />, label: "Easy Returns", caption: "7-day hassle-free policy" },
  { icon: <FaShieldAlt />, label: "Secure Payments", caption: "100% encrypted checkout" },
];

const INSTAGRAM_POSTS = [
  "https://picsum.photos/seed/giftyfy-insta-1/400/400",
  "https://picsum.photos/seed/giftyfy-insta-2/400/400",
  "https://picsum.photos/seed/giftyfy-insta-3/400/400",
  "https://picsum.photos/seed/giftyfy-insta-4/400/400",
  "https://picsum.photos/seed/giftyfy-insta-5/400/400",
  "https://picsum.photos/seed/giftyfy-insta-6/400/400",
];

/* =========================================================================
   PURE HELPERS
   Moved out of the component body because they don't depend on state —
   same logic as before, just reusable across every product grid section.
========================================================================= */

const getProductImage = (product) => {
  if (product.category === "Dress") {
    const variantWithImage = product.variants?.find(
      (v) => v.images?.length > 0
    );

    return variantWithImage
      ? `http://localhost:4000/uploads/${variantWithImage.images[0]}`
      : "/no-image.png";
  }

  return product.image?.length
    ? `http://localhost:4000/uploads/${product.image[0]}`
    : "/no-image.png";
};

// BASE PRICE (Dress + Normal fix)
const getBasePrice = (product) => {
  const isPhotoFrame =
    product?.subcategory?.trim()?.toLowerCase() === "photo frame" ||
    product?.category?.trim()?.toLowerCase() === "photo frame";

  if (isPhotoFrame) {
    return Number(
      product?.frameSizes?.[0]?.price ??
      product?.price ??
      0
    );
  }
  if (product?.category === "Dress") {
    const variant = product?.variants?.find((v) => v.sizes?.length > 0);
    return variant?.sizes?.[0]?.price || 0;
  }
  return product?.price || 0;
};

// FINAL PRICE (GST + DISCOUNT)
const getFinalPrice = (product) => {
  const basePrice = getBasePrice(product);

  const gst = (basePrice * (product?.gst || 0)) / 100;
  const priceWithGST = basePrice + gst;

  const type = (product?.discountType || "").toLowerCase();
  const value = Number(product?.discountValue || 0);

  let final = priceWithGST;

  if (type === "percentage") {
    final = priceWithGST - (priceWithGST * value) / 100;
  } else if (type === "flat" || type === "amount") {
    final = priceWithGST - value;
  }

  return Math.max(0, Math.round(final));
};

const getColor = (color) => {
  switch (color?.toLowerCase()) {
    case "white":
      return "#ffffff";
    case "black":
      return "#000000";
    case "red":
      return "#ff0000";
    case "blue":
      return "#0066ff";
    case "green":
      return "#00aa55";
    case "yellow":
      return "#ffd700";
    case "pink":
      return "#ff69b4";
    case "lavender":
      return "#E6E6FA";
    case "sandal":
      return "#d2b48c";
    case "cream":
      return "#fffdd0";
    case "maroon":
      return "#800000";
    default:
      return "#ddd";
  }
};

// Deterministic display-only rating so it doesn't flicker between renders.
// Purely presentational — no backend rating field exists yet.
const getDisplayRating = (id) => {
  if (!id) return "4.5";
  const hash = String(id)
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (4 + (hash % 10) / 10).toFixed(1);
};

// Purely presentational badge derived from existing fields only.
const getBadge = (product) => {
  const hasDiscount = (product?.discountValue || 0) > 0;
  const created = product?.createdAt ? new Date(product.createdAt).getTime() : 0;
  const isNew = created && Date.now() - created < 1000 * 60 * 60 * 24 * 10;

  if (hasDiscount) return { label: "SALE", type: "sale" };
  if (isNew) return { label: "NEW", type: "new" };
  return { label: "HOT", type: "hot" };
};

/* =========================================================================
   REUSABLE PRESENTATIONAL COMPONENTS
========================================================================= */

function SectionHeading({ eyebrow, title, subtitle, align, action }) {
  return (
    <div className={`gfy-section-head${align === "center" ? " is-center" : ""}`}>
      <div className="gfy-heading-copy">
        {eyebrow && (
          <span className="gfy-tag-eyebrow">
            <FaGift aria-hidden="true" />
            {eyebrow}
          </span>
        )}
        <h2 className="gfy-heading">{title}</h2>
        {subtitle && <p className="gfy-subheading">{subtitle}</p>}
      </div>
      {action && <div className="gfy-heading-action">{action}</div>}
    </div>
  );
}

function ProductCard({ product, isWishlisted, onWishlistToggle, onQuickView, onOpen, index }) {
  const image = getProductImage(product);
  const basePrice = getBasePrice(product);
  const finalPrice = getFinalPrice(product);
  const hasDiscount = (product.discountValue || 0) > 0;
  const rating = getDisplayRating(product._id);
  const badge = getBadge(product);
  const filledStars = Math.round(Number(rating));

  return (
    <div
      className="gfy-card"
      style={{ animationDelay: `${Math.min(index || 0, 8) * 60}ms` }}
      onClick={onOpen}
    >
      <div className="gfy-card-media">
        <span className={`gfy-badge gfy-badge--${badge.type}`}>{badge.label}</span>

        <div className="gfy-card-actions">
          <button
            type="button"
            className="gfy-icon-btn"
            onClick={(e) => onWishlistToggle(e, product)}
            aria-label="Toggle wishlist"
          >
            {isWishlisted ? <FaHeart className="is-active" /> : <FaRegHeart />}
          </button>

          <button
            type="button"
            className="gfy-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            aria-label="Quick view"
          >
            <FaEye />
          </button>
        </div>

        <img src={image} alt={product.name} loading="lazy" />
      </div>

      <div className="gfy-card-body">
        <div className="gfy-card-rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <FaStar key={n} className={n <= filledStars ? "is-filled" : "is-empty"} />
          ))}
          <span className="gfy-card-rating-num">{rating}</span>
        </div>

        <h6 className="gfy-card-title">{product.name}</h6>

        <div className="gfy-card-price">
          <span className="gfy-price-final">₹{finalPrice}</span>

          {hasDiscount && (
            <>
              <span className="gfy-price-original">₹{basePrice}</span>
              <span className="gfy-price-off">
                {product.discountType === "percentage"
                  ? `${product.discountValue}% OFF`
                  : `₹${product.discountValue} OFF`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   HOME PAGE
========================================================================= */

function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const scrollRef = useRef();
  const [wishlist, setWishlist] = useState([]);
  const [quickView, setQuickView] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [reviews, setReviews] = useState([]);
  // ===== Fetch Data =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, catRes, productRes,reviewRes] = await Promise.all([
          axios.get("http://localhost:4000/api/banner/active"),
          axios.get("http://localhost:4000/api/categories"),
          axios.get("http://localhost:4000/api/product"),
          axios.get("http://localhost:4000/api/reviews/product-home"),
        ]);
        

        setBanners(bannerRes.data);
        setCategories(catRes.data);
        setProducts(productRes.data);
        setReviews(reviewRes.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  // ===== Carousel Start =====
  useEffect(() => {
    if (banners.length > 0) {
      const el = document.getElementById("bannerCarousel");
      if (el) {
        new Carousel(el, {
          interval: 2500,
          ride: "carousel",
          pause: false,
        });
      }
    }
  }, [banners]);

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

  const originalPrice = quickView
    ? quickView.category === "Dress"
      ? selectedSize?.price || 0
      : quickView.price || 0
    : 0;

  const discountValue = quickView?.discountValue || 0;

  const discountType = quickView?.discountType || "percentage";

  const finalPrice =
    discountType === "percentage"
      ? originalPrice - (originalPrice * discountValue) / 100
      : originalPrice - discountValue;

  // Unique Categories
  const uniqueCategories = [
    ...new Map(categories.map((item) => [item.category, item])).values(),
  ];

  const scrollRight = () => {
    scrollRef.current.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  };

  const scrollLeft = () => {
    scrollRef.current.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  };

  const handleWishlist = async (e, product) => {
    e.stopPropagation();

    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("Please Login First");
      return;
    }

    try {
      // Already in wishlist check
      const existing = wishlist.find(
        (item) => String(item.productId) === String(product._id)
      );

      // Remove from wishlist
      if (existing) {
        await axios.delete(
          `http://localhost:4000/api/wishlist/remove/${existing._id}`
        );

        setWishlist((prev) => prev.filter((item) => item._id !== existing._id));

        toast.info("Removed from Wishlist 💔");
        return;
      }

      // Add to wishlist
      const res = await axios.post("http://localhost:4000/api/wishlist", {
        userId,
        productId: product._id,
      });

      if (res.data?.newItem) {
        setWishlist((prev) => [...prev, res.data.newItem]);
      }

      toast.success("Added to Wishlist ❤️");
    } catch (err) {
      console.log("Wishlist Error:", err);
      toast.error("Something went wrong");
    }
  };

  const openQuickView = async (productId) => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/product/${productId}`
      );

      const product = res.data;

      setQuickView(product);

      if (product.category === "Dress" && product.variants?.length) {
        const firstVariant = product.variants[0];

        setSelectedColor(firstVariant);
        setSelectedSize(firstVariant.sizes?.[0]);
        setSelectedImage(firstVariant.images?.[0]);
      } else {
        setSelectedColor(null);
        setSelectedSize(null);
        setSelectedImage(product.image?.[0]);
      }

      setQty(1);
    } catch (err) {
      console.log(err);
    }
  };

  // Same behaviour as the original inline "Quick View" click on the
  // trending grid — reused for every product grid on the page.
  const handleGridQuickView = (product) => {
    setQuickView(product);

    if (product.category === "Dress") {
      const firstVariant = product.variants?.[0];

      setSelectedColor(firstVariant || null);
      setSelectedSize(firstVariant?.sizes?.[0] || null);
    }
  };

  const handleQuickAddToCart = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("Please Login First");
      return;
    }
    const handleQuickViewCart = async () => {
      if (quickView.category === "Dress") {
        if (!selectedColor) {
          toast.error("Select Color");
          return;
        }

        if (!selectedSize) {
          toast.error("Select Size");
          return;
        }

        if (qty > selectedSize.quantity) {
          toast.error(`Only ${selectedSize.quantity} stock available`);
          return;
        }

        // API call
      }
    };

    try {
      let payload = {
        userId,
        productId: quickView._id,
        quantity: 1,
      };

      if (quickView.category === "Dress") {
        if (!selectedColor || !selectedSize) {
          toast.error("Select Color & Size");
          return;
        }

        payload.color = selectedColor.color;

        payload.size = selectedSize.size;
      }

      await axios.post("http://localhost:4000/api/cart/add", payload);

      toast.success("Added To Cart 🛒");

      setQuickView(null);
    } catch (err) {
      console.log(err);
      toast.error("Failed To Add Cart");
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    toast.success("Subscribed! Welcome to Giftyfy 🎁");
    setNewsletterEmail("");
  };

  const trendingProducts = [...products].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const newArrivals = trendingProducts.slice(0, 8);
  const bestSellers = [...products].reverse().slice(0, 8);

  const isWishlisted = (product) =>
    wishlist.some((item) => item.productId === product._id);

  return (
    <div className="giftyfy-home-container">
      {/* ===== HERO BANNER ===== */}
      <div className="gfy-hero">

{/* ===== BANNER ===== */}
<div id="bannerCarousel" className="carousel slide carousel-fade">

  <div className="carousel-inner">

    {banners.map((banner, index) => (

      <div
        key={banner._id}
        className={`carousel-item ${index === 0 ? "active" : ""}`}
      >

        <div className="giftyfy-banner-wrapper">

          <img
            src={`http://localhost:4000/uploads/${banner.image}`}
            className="giftyfy-banner-img"
            alt="banner"
          />

          <div className="giftyfy-banner-overlay">

            <h1>
              Make Every Gift Special
            </h1>

            <p>
              Personalized gifts for every occasion
            </p>

            <button
              onClick={() => navigate("/products")}
            >
              Shop Now
            </button>

          </div>

        </div>

      </div>

    ))}

  </div>

</div>      </div>

      {/* ===== CATEGORIES ===== */}
      <div className="gfy-section" id="giftyfy-categories">
        <SectionHeading eyebrow="Curated for you" title="Gift Categories" />

        <div className="giftyfy-hscroll-container">
          <button
            className="gfy-hscroll-btn left"
            onClick={scrollLeft}
            aria-label="Scroll categories left"
          >
            <FaChevronLeft />
          </button>

          <div className="giftyfy-category-row" ref={scrollRef}>
            {uniqueCategories.map((cat) => (
              <div
                className="gfy-category-card"
                key={cat._id}
                onClick={() =>
                  navigate(`/category/${encodeURIComponent(cat.category)}`)
                }
              >
                <div className="gfy-category-ring">
                  <img
                    src={`http://localhost:4000/uploads/${cat.image}`}
                    alt={cat.category}
                  />
                </div>
                <p>{cat.category}</p>
              </div>
            ))}
          </div>

          <button
            className="gfy-hscroll-btn right"
            onClick={scrollRight}
            aria-label="Scroll categories right"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* ===== TRENDING PRODUCTS ===== */}
      <div className="gfy-section">
        <SectionHeading
          eyebrow="Loved right now"
          title="Trending Gifts"
          action={
            <button className="gfy-btn gfy-btn--outline" onClick={() => navigate("/products")}>
              View All
            </button>
          }
        />

        <div className="gfy-products-grid">
          {trendingProducts.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
              isWishlisted={isWishlisted(product)}
              onWishlistToggle={handleWishlist}
              onQuickView={handleGridQuickView}
              onOpen={() => navigate(`/product/${product._id}`)}
            />
          ))}
        </div>
      </div>

      {/* ===== FEATURED COLLECTIONS ===== */}
      <div className="gfy-section">
        <SectionHeading eyebrow="Handpicked sets" title="Featured Collections" />

        <div className="gfy-collections-grid">
          {COLLECTIONS.map((c) => (
            <div
              className="gfy-collection-card"
              key={c.title}
              onClick={() => navigate("/products")}
            >
              <img src={`https://picsum.photos/seed/${c.seed}/700/500`} alt={c.title} />
              <div className="gfy-collection-overlay">
                <h4>{c.title}</h4>
                <p>{c.caption}</p>
                <span className="gfy-collection-link">Shop the edit →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== PERSONALIZED BANNER ===== */}
      <div className="gfy-personalize-banner">
        <div className="gfy-personalize-copy">
          <span className="gfy-tag-eyebrow gfy-tag-eyebrow--light">
            <FaGift aria-hidden="true" /> Personalized Gifts
          </span>
          <h2>Create Something Only They Could Have</h2>
          <p>
            Upload your favourite memories and we'll turn them into a gift
            that feels made for one person only.
          </p>
          <button className="gfy-btn gfy-btn--light" onClick={() => navigate("/products")}>
            Customize Now
          </button>
        </div>
        <div className="gfy-personalize-art" aria-hidden="true">
          <FaGift />
        </div>
      </div>

      {/* ===== SHOP BY RECIPIENT ===== */}
      <div className="gfy-section">
        <SectionHeading eyebrow="Who's it for" title="Shop by Recipient" />

        <div className="gfy-recipient-grid">
          {RECIPIENTS.map((r) => (
            <div
              className="gfy-recipient-card"
              key={r.label}
              onClick={() => navigate("/products")}
            >
              <span className="gfy-recipient-emoji">{r.emoji}</span>
              <h5>{r.label}</h5>
              <p>{r.tag}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SHOP BY OCCASION ===== */}
      <div className="gfy-section">
        <SectionHeading eyebrow="Every moment counts" title="Shop by Occasion" />

        <div className="gfy-occasion-grid">
          {OCCASIONS.map((o) => (
            <div
              className="gfy-occasion-card"
              key={o.label}
              onClick={() => navigate("/products")}
            >
              <span className="gfy-occasion-emoji">{o.emoji}</span>
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BEST SELLERS ===== */}
      {bestSellers.length > 0 && (
        <div className="gfy-section">
          <SectionHeading eyebrow="Customer favourites" title="Best Sellers" />

          <div className="gfy-products-scroll">
            {bestSellers.map((product, index) => (
              <div className="gfy-products-scroll-item" key={product._id}>
                <ProductCard
                  product={product}
                  index={index}
                  isWishlisted={isWishlisted(product)}
                  onWishlistToggle={handleWishlist}
                  onQuickView={handleGridQuickView}
                  onOpen={() => navigate(`/product/${product._id}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== NEW ARRIVALS ===== */}
      {newArrivals.length > 0 && (
        <div className="gfy-section">
          <SectionHeading eyebrow="Fresh in store" title="New Arrivals" />

          <div className="gfy-products-grid">
            {newArrivals.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
                isWishlisted={isWishlisted(product)}
                onWishlistToggle={handleWishlist}
                onQuickView={handleGridQuickView}
                onOpen={() => navigate(`/product/${product._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ===== WHY CHOOSE US ===== */}
      <div className="gfy-why-section">
        <SectionHeading eyebrow="The Giftyfy promise" title="Why Choose Us?" align="center" />

        <div className="gfy-why-grid">
          {BRAND_TRUST.map((item) => (
            <div className="gfy-why-card" key={item.label}>
              <div className="gfy-why-icon">{item.icon}</div>
              <h5>{item.label}</h5>
              <p>{item.caption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CUSTOMER REVIEWS ===== */}
      <div className="gfy-section">
        <SectionHeading eyebrow="Real stories" title="Customer Reviews" align="center" />

       <div className="gfy-reviews-grid">
  {reviews.map((r) => (
    <div className="gfy-review-card" key={r._id}>
      <FaQuoteLeft className="gfy-review-quote" />

      <p className="gfy-review-text">{r.comment}</p>

      <div className="gfy-review-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <FaStar
            key={n}
            className={n <= r.rating ? "is-filled" : "is-empty"}
          />
        ))}
      </div>

      <div className="gfy-review-person">
        <span className="gfy-review-avatar">
          {r.user?.name?.charAt(0).toUpperCase()}
        </span>

        <div>
          <strong>{r.user?.name}</strong>
          <br />
          <small>{r.product?.name}</small>
        </div>
      </div>
    </div>
  ))}
</div>
      </div>

      {/* ===== INSTAGRAM GALLERY ===== */}
      <div className="gfy-section">
        <SectionHeading
          eyebrow="@giftyfy"
          title="Follow Our Gifting Diaries"
          align="center"
        />

        <div className="gfy-instagram-grid">
          {INSTAGRAM_POSTS.map((src, i) => (
            <a
              className="gfy-instagram-item"
              href="#"
              key={i}
              onClick={(e) => e.preventDefault()}
            >
              <img src={src} alt="Giftyfy on Instagram" loading="lazy" />
              <span className="gfy-instagram-overlay">
                <FaInstagram />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* ===== NEWSLETTER ===== */}
      <div className="gfy-newsletter">
        <div className="gfy-newsletter-inner">
          <h2>Never Miss a Gifting Idea</h2>
          <p>Subscribe for early access to new drops, offers and gifting guides.</p>

          <form className="gfy-newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
            />
            <button type="submit">
              Subscribe <FaPaperPlane aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      {/* ===== FOOTER ===== */}

      {quickView && (
        <div className="quickview-overlay" onClick={() => setQuickView(null)}>
          <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
            <span className="quickview-close" onClick={() => setQuickView(null)}>
              ×
            </span>

            <div className="quickview-content">
              <div className="quickview-gallery">
                <img
                  className="quickview-main-image"
                  src={
                    selectedImage
                      ? `http://localhost:4000/uploads/${selectedImage}`
                      : quickView.category === "Dress"
                      ? `http://localhost:4000/uploads/${selectedColor?.images?.[0]}`
                      : `http://localhost:4000/uploads/${quickView.image?.[0]}`
                  }
                  alt={quickView.name}
                />

                <div className="quickview-thumbnails">
                  {quickView.category === "Dress"
                    ? selectedColor?.images?.map((img, i) => (
                        <img
                          key={i}
                          src={`http://localhost:4000/uploads/${img}`}
                          className={selectedImage === img ? "active-thumb" : ""}
                          onClick={() => setSelectedImage(img)}
                        />
                      ))
                    : quickView.image?.map((img, i) => (
                        <img
                          key={i}
                          src={`http://localhost:4000/uploads/${img}`}
                          className={selectedImage === img ? "active-thumb" : ""}
                          onClick={() => setSelectedImage(img)}
                        />
                      ))}
                </div>
              </div>

              <div className="quickview-details">
                <h2>{quickView.name}</h2>

                <div className="quickview-price">
                  <h3>₹{Math.round(finalPrice)}</h3>

                  {discountValue > 0 && (
                    <>
                      <del>₹{originalPrice}</del>

                      <span className="quickview-off">
                        {discountType === "percentage"
                          ? `${discountValue}% OFF`
                          : `₹${discountValue} OFF`}
                      </span>
                      <span className="quickview-save">
                        You save ₹{Math.round(originalPrice - finalPrice)}
                      </span>
                    </>
                  )}
                </div>

                <p className="quickview-tax">Inclusive of all taxes</p>

                <p>
                  <strong>Category :</strong> {quickView.category}
                </p>

                {quickView.brand && (
                  <p>
                    <strong>Brand :</strong> {quickView.brand}
                  </p>
                )}

                <p>
                  <strong>Stock :</strong>{" "}
                  {quickView.category === "Dress"
                    ? selectedSize?.quantity || 0
                    : quickView.stock || quickView.quantity || 0}
                </p>

                {quickView.category === "Dress" && (
                  <>
                    <h5>Select Color</h5>

                    <div className="quickview-colors">
                      {quickView.variants?.map((v, i) => (
                        <button
                          key={i}
                          className={selectedColor?.color === v.color ? "active" : ""}
                          onClick={() => {
                            setSelectedColor(v);
                            setSelectedSize(v.sizes?.[0]);
                            setQty(1);
                            setSelectedImage(v.images?.[0]);
                          }}
                          style={{ background: getColor(v.color) }}
                        >
                          {v.color}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Dress Sizes */}
                {selectedColor && (
                  <>
                    <h5>Sizes</h5>

                    <div className="quickview-sizes">
                      {selectedColor?.sizes?.map((s, i) => (
                        <button
                          key={i}
                          className={selectedSize?.size === s.size ? "active" : ""}
                          onClick={() => {
                            setSelectedSize(s);
                            setQty(1);
                          }}
                        >
                          {s.size}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="quickview-qty">
                  <button onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>-</button>

                  <span>{qty}</span>

                  <button
                    onClick={() => {
                      if (qty < (selectedSize?.quantity || 0)) {
                        setQty(qty + 1);
                      }
                    }}
                  >
                    +
                  </button>
                </div>

                <div className="quickview-actions">
                  <button
                    className="quickview-cart-btn"
                    disabled={quickView.isCustomized}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (!quickView.isCustomized) {
                        handleQuickAddToCart(quickView);
                      }
                    }}
                  >
                    {quickView.isCustomized ? "Customization Required" : "Add To Cart"}
                  </button>

                  <button
                    className="quickview-full-btn"
                    onClick={() => navigate(`/product/${quickView._id}`)}
                  >
                    View Full Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;