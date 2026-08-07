import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Collapse from "bootstrap/js/dist/collapse";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [logo, setLogo] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [category, setCategory] = useState("All");
  const [subcategory, setSubcategory] = useState("All");
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
const navbarRef = useRef(null);
const [showSearch, setShowSearch] = useState(false);

  const boxRef = useRef(); // ✅ for outside click

  // ===== LOGO FETCH =====
  useEffect(() => {

  const fetchLogo = async () => {

    const res = await axios.get(
      "http://localhost:4000/api/logo"
    );


    setLogo(res.data);

  };

  fetchLogo();

}, []);
useEffect(() => {
  const navbar = document.getElementById("navbarContent");

  const handleShown = () => setMenuOpen(true);
  const handleHidden = () => setMenuOpen(false);

  navbar?.addEventListener("shown.bs.collapse", handleShown);
  navbar?.addEventListener("hidden.bs.collapse", handleHidden);

  return () => {
    navbar?.removeEventListener("shown.bs.collapse", handleShown);
    navbar?.removeEventListener("hidden.bs.collapse", handleHidden);
  };
}, []);

  // ===== SEARCH SUGGESTIONS =====
  useEffect(() => {
    if (search.length > 1) {
      axios.get("http://localhost:4000/api/product")
        .then((res) => {
          const searchText = search.toLowerCase().trim();

const filtered = res.data.filter((p) =>
  p.name?.toLowerCase().includes(searchText) ||
  p.category?.toLowerCase().includes(searchText) ||
  p.subcategory?.toLowerCase().includes(searchText)
);

setSuggestions(filtered.slice(0, 8));
          
        });
    } else {
      setSuggestions([]);
    }
  }, [search]);

  // ===== OUTSIDE CLICK CLOSE =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);


useEffect(() => {

  const fetchCart = async () => {

    try {

      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await axios.get(
        "http://localhost:4000/api/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("CART 👉", res.data);

      // ✅ cart items
      const items = res.data.items || [];

      // ✅ quantity total
      const totalCount = items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      setCartCount(totalCount);

    } catch (err) {
      console.log(err);
    }
  };

  fetchCart();

  window.addEventListener("cartUpdated", fetchCart);

  return () => {
    window.removeEventListener("cartUpdated", fetchCart);
  };

}, []);


  // ===== SEARCH BUTTON =====
const handleSearch = (e) => {
  e.preventDefault();

  if (!search.trim()) return;

  const text = search.trim().toLowerCase();

  const categoryMatch = suggestions.find(
    (p) => p.category?.toLowerCase() === text
  );

  const subcategoryMatch = suggestions.find(
    (p) => p.subcategory?.toLowerCase() === text
  );

if (categoryMatch) {
  navigate(`/category/${encodeURIComponent(categoryMatch.category)}`);
} else if (subcategoryMatch) {
  navigate(`/category/${encodeURIComponent(subcategoryMatch.category)}`);
} else {
  navigate(`/products?search=${encodeURIComponent(search)}`);
}

  setSuggestions([]);
  setShowSearch(false);
  closeMobileMenu();
};

  // ===== LOGOUT =====
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

const closeMobileMenu = () => {
  setMenuOpen(false);

  if (navbarRef.current) {
    const bsCollapse =
      Collapse.getInstance(navbarRef.current) ||
      new Collapse(navbarRef.current, {
        toggle: false,
      });

    bsCollapse.hide();
  }
};

  return (
  <nav className="navbar navbar-expand-lg custom-navbar">
  <div className="container">

    <Link className="navbar-brand" to="/">
      <img
        src={
          logo?.image
            ? `http://localhost:4000/uploads/${encodeURIComponent(
                logo.image
              )}`
            : "/no-logo.png"
        }
        alt="Logo"
        className="navbar-logo"
      />
    </Link>

    <button
      className="navbar-toggler"
      type="button"
      onClick={() => {
        const bsCollapse =
          Collapse.getInstance(navbarRef.current) ||
          new Collapse(navbarRef.current, {
            toggle: false,
          });

        menuOpen ? bsCollapse.hide() : bsCollapse.show();
      }}
    >
      <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`}></i>
    </button>

      <div
      className="collapse navbar-collapse"
      id="navbarContent"
      ref={navbarRef}
    >
      <div className="navbar-center">

  <ul className="navbar-nav navbar-menu">

    <li>
      <Link to="/" className="nav-link">
        Home
      </Link>
    </li>

    <li>
      <Link to="/products" className="nav-link">
        Shop
      </Link>
    </li>

    <li>
      <Link to="/about" className="nav-link">
        About
      </Link>
    </li>

    <li>
      <Link to="/contact" className="nav-link">
        Contact
      </Link>
    </li>

  </ul>

</div>
<div className="navbar-right">
  {!showSearch ? (

<button
className="search-icon-btn"
onClick={()=>setShowSearch(true)}
>

<i className="bi bi-search"></i>

</button>

):(

<div className="search-box">

<div className="input-group">

<input
className="form-control search-input"
placeholder="Search Gifts..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<button
className="btn search-btn"
onClick={handleSearch}
>

<i className="bi bi-search"></i>

</button>

<button
className="btn close-search-btn"
onClick={()=>{
setShowSearch(false);
setSearch("");
setSuggestions([]);
}}
>

<i className="bi bi-x"></i>

</button>

</div>

{/* Dropdown */}

</div>

)}
{suggestions.length > 0 && (
  <div className="search-dropdown">
    {suggestions.map((item) => (
      <div
        key={item._id}
        className="search-item"
        onClick={() => {
          setSuggestions([]);
          setSearch("");
          setShowSearch(false);
          closeMobileMenu();

          const searchText = search.trim().toLowerCase();

          // Category
          if (
            item.category &&
            item.category.toLowerCase() === searchText
          ) {
            navigate(
              `/category/${encodeURIComponent(item.category)}`
            );
            return;
          }

          // SubCategory
          if (
            item.subcategory &&
            item.subcategory.toLowerCase() === searchText
          ) {
            navigate(
              `/category/${encodeURIComponent(item.category)}`
            );
            return;
          }

          // Product
          navigate(`/product/${item._id}`);
        }}
      >
        <img
  src={`http://localhost:4000/uploads/${
    item.image?.[0] ||
    item.images?.[0] ||
    item.variants?.[0]?.images?.[0] ||
    item.colors?.[0]?.images?.[0]
  }`}
  alt={item.name}
  className="search-thumb"
/>

        <div className="search-info">
          <h6>{item.name}</h6>
          

          <small className="text-muted">
            {item.category}
            {item.subcategory && ` • ${item.subcategory}`}
          </small>
        </div>
      </div>
    ))}
  </div>
)}
<Link
  to="/wishlist"
  className="nav-icon"
  onClick={closeMobileMenu}
>
  <i className="bi bi-heart"></i>
</Link>
<Link
  to="/orders"
  className="nav-icon"
  onClick={closeMobileMenu}
>
  <i className="bi bi-bag-check"></i>
</Link>
<Link
  to="/cart"
  className="nav-icon cart-link"
  onClick={closeMobileMenu}
>
  <i className="bi bi-cart3"></i>

  {cartCount > 0 && (
    <span className="cart-badge">
      {cartCount}
    </span>
  )}
</Link>
<Link
  to="/profile"
  className="nav-icon"
  onClick={closeMobileMenu}
>
  <i className="bi bi-person-circle"></i>
</Link>
{!token ? (
  <Link
    to="/login"
    className="login-btn"
    onClick={closeMobileMenu}
  >
    Login
  </Link>
) : (
  <button
    className="logout-btn"
    onClick={handleLogout}
  >
    Logout
  </button>
)}
</div>

</div>

  </div>
</nav>
  );
}

export default Navbar;