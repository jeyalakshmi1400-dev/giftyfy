import { Link, useNavigate, useLocation } from "react-router-dom";
import "./DeliveryNavbar.css";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaWallet,
  FaUser,
  FaSignOutAlt,
  FaUndo,
  FaBell,
  FaTimesCircle,
  FaMoneyBillWave,
} from "react-icons/fa";
import {
  FiMenu,
  FiX,
  FiCheck,
  FiClock,
  FiUser as FiUserIcon,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

function DeliveryNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= STATES =================
  const [partner, setPartner] = useState(null);
  const [logo, setLogo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // mobile drawer open/close
  const [collapsed, setCollapsed] = useState(false); // desktop sidebar collapse (icons-only)

  const notifRef = useRef(null);

  // ================= TOKEN & ID =================
  const token = localStorage.getItem("deliveryToken");
  const deliveryId = localStorage.getItem("deliveryId");

  // ================= FETCH LOGO =================
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/logo");
        setLogo(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchLogo();
  }, []);

  // ================= FETCH PARTNER =================
  useEffect(() => {
    const fetchPartner = async () => {
      if (!deliveryId) return;
      try {
        const res = await axios.get(`http://localhost:4000/api/delivery/${deliveryId}`);
        setPartner(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchPartner();
  }, [deliveryId]);

  // ================= FETCH NOTIFICATIONS =================
  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/notifications/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data?.notifications || []);
    } catch (error) {
      console.log("FETCH ERROR 👉", error.response?.data || error);
    }
  };

  // ================= AUTO REFRESH NOTIFICATIONS (from old sidebar) =================
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // ================= CLOSE NOTIFICATION DROPDOWN ON OUTSIDE CLICK =================
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotification(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ================= SYNC COLLAPSE STATE → CSS VARIABLE =================
  // This lets ANY page/layout react to the sidebar width via CSS alone
  // (var(--dn2-sidebar-w)), without needing to pass collapsed as a prop.
  useEffect(() => {
    document.body.style.setProperty(
      "--dn2-sidebar-w",
      collapsed ? "75px" : "260px"
    );
    document.body.classList.toggle("dn2-sidebar-collapsed", collapsed);
  }, [collapsed]);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("deliveryToken");
    localStorage.removeItem("deliveryId");
    navigate("/login");
  };

  // ================= ACCEPT ORDER =================
  const acceptOrder = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/orders/${orderId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNotification(false);
      fetchNotifications();
      navigate("/order-pickup");
    } catch (error) {
      console.log(error.response?.data?.message);
      fetchNotifications();
    }
  };

  // ================= HANDLE NOTIFICATION =================
const handleNotification = async (notification) => {
  try {
    if (notification.type === "RETURN_PICKUP") {
      await acceptReturn(notification.order._id);
      return;
    }

    await acceptOrder(notification.order._id);
    setShowNotification(false);
    navigate("/order-pickup");
  } catch (err) {
    console.log(err.response?.data || err.message);
  }
};

const acceptReturn = async (orderId) => {
  try {
    const res = await axios.put(
      `http://localhost:4000/api/orders/${orderId}/accept-return`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(res.data);

    fetchNotifications();
    setShowNotification(false);

    navigate("/returns");
  } catch (error) {
    console.log(error.response?.data);
    alert(error.response?.data?.message || "Accept Failed");
  }
};
  // ================= REJECT ORDER =================
  const rejectOrder = async (notification) => {
    try {
      await axios.delete(
        `http://localhost:4000/api/delivery/notifications/${notification._id}/reject`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.filter((item) => item._id !== notification._id));
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  // ================= SIDEBAR MENU CONFIG (your original routes, unchanged) =================
  const menuItems = [
    { to: "/", label: "Dashboard", icon: FaHome, match: "/delivery/dashboard" },
    {
      to: "/delivery-requests",
      label: "Delivery Requests",
      icon: FaBell,
      match: "/delivery-requests",
      badge: notifications.length,
    },
    { to: "/order-pickup", label: "Order Pickup", icon: FaClipboardList, match: "/delivery/orders" },
    { to: "/reports", label: "Delivered Orders", icon: FaChartBar, match: "/delivery/reports" },
    { to: "/delivery/cancel-orders", label: "Cancel Orders", icon: FaTimesCircle, match: "/delivery/cancel-orders" },
   { to: "/cod", label: "Cod Amounts", icon: FaMoneyBillWave, match: "/delivery/profile" },

    { to: "/wallet", label: "Wallet", icon: FaWallet, match: "/delivery/wallet" },
    { to: "/profile", label: "Profile", icon: FaUser, match: "/delivery/profile" },
    { to: "/returns", label: "UserReturn Orders", icon: FaUndo, match: "/delivery/returns" },
  ];

  const logoSrc = logo?.image
    ? `http://localhost:4000/uploads/${encodeURIComponent(logo.image)}`
    : "/no-logo.png";

  const avatarSrc = partner?.photo
    ? `http://localhost:4000/uploads/${partner.photo}`
    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  // ================= SHARED SIDEBAR CONTENT (desktop + mobile drawer) =================
  // isMobile=true means this render is inside the mobile drawer, so nav clicks
  // and logout should also close the drawer (setShowSidebar(false)).
  const SidebarContent = ({ isMobile = false }) => (
    <div
      className={`dn2-sidebar-inner${
        collapsed && !isMobile ? " dn2-collapsed" : ""
      }`}
    >

      {/* Logo */}
      <div className="dn2-logo-row">
        <Link
          to="/"
          className="dn2-logo-link"
          onClick={() => isMobile && setShowSidebar(false)}
        >
          <img src={logoSrc} alt="Company Logo" className="dn2-logo-img" />
          {(!collapsed || isMobile) && (
            <div className="dn2-logo-text">
              <span className="dn2-brand-name">Giftyfy</span>
              <span className="dn2-brand-sub">Delivery Hub</span>
            </div>
          )}
        </Link>

        {/* Collapse toggle — desktop only, ChatGPT style */}
        {!isMobile && (
          <button
            className="dn2-collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="dn2-profile-card">
        <div className="dn2-avatar-wrap">
          <img src={avatarSrc} alt="profile" className="dn2-avatar" />
          <span className="dn2-online-dot dn2-dot--green" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="dn2-profile-info">
            <span className="dn2-partner-name">{partner?.name || "Delivery Partner"}</span>
            <span className="dn2-status-pill dn2-pill--online">
              <span className="dn2-pill-dot" />
              Online
            </span>
          </div>
        )}
      </div>

      {/* Section label */}
      {(!collapsed || isMobile) && (
        <span className="dn2-section-label">NAVIGATION</span>
      )}

      {/* Main Nav (your routes, unchanged) */}
      <nav className="dn2-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to || location.pathname === item.match;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`dn2-nav-item${active ? " dn2-nav-item--active" : ""}`}
              title={collapsed && !isMobile ? item.label : ""}
              onClick={() => isMobile && setShowSidebar(false)}
            >
              <span className="dn2-nav-icon"><Icon size={16} /></span>
              {(!collapsed || isMobile) && (
                <>
                  <span className="dn2-nav-label">{item.label}</span>
                  {!!item.badge && (
                    <span className="dn2-nav-badge">{item.badge}</span>
                  )}
                </>
              )}
              {active && <span className="dn2-nav-active-bar" />}
            </Link>
          );
        })}
      </nav>

      <div className="dn2-flex-grow" />

      {/* Auth / Logout */}
      {(!collapsed || isMobile) && (
        <span className="dn2-section-label">ACCOUNT</span>
      )}
      <nav className="dn2-nav dn2-nav-bottom">
        {!token ? (
          <Link
            to="/login"
            className="dn2-nav-item"
            title={collapsed && !isMobile ? "Login" : ""}
            onClick={() => isMobile && setShowSidebar(false)}
          >
            <span className="dn2-nav-icon"><FaSignOutAlt size={16} /></span>
            {(!collapsed || isMobile) && <span className="dn2-nav-label">Login</span>}
          </Link>
        ) : (
          <button
            className="dn2-nav-item dn2-nav-item--danger"
            title={collapsed && !isMobile ? "Logout" : ""}
            onClick={() => {
              if (isMobile) setShowSidebar(false);
              handleLogout();
            }}
          >
            <span className="dn2-nav-icon"><FaSignOutAlt size={16} /></span>
            {(!collapsed || isMobile) && <span className="dn2-nav-label">Logout</span>}
          </button>
        )}
      </nav>

      {(!collapsed || isMobile) && (
        <div className="dn2-sidebar-footer">
          <span>SwiftDrop Hub</span>
          <span className="dn2-footer-dot">·</span>
          <span>v2.0</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ══════════════ DESKTOP SIDEBAR ══════════════ */}
      <aside className={`dn2-sidebar${collapsed ? " dn2-sidebar--collapsed" : ""}`}>
        <SidebarContent />
      </aside>

      {/* ══════════════ TOP BAR ══════════════ */}
      <header className="dn2-topbar">
        {/* Mobile hamburger — opens drawer */}
        <button className="dn2-hamburger" onClick={() => setShowSidebar(true)}>
          <FiMenu size={22} />
        </button>

        <div className="dn2-topbar-title">
          {menuItems.find((m) => m.to === location.pathname || m.match === location.pathname)
            ?.label || "Dashboard"}
        </div>

        <div className="dn2-topbar-right">
          {/* Notifications */}
          <div className="dn2-notif-wrap" ref={notifRef}>
            <button
              className="dn2-topbar-btn"
              onClick={() => setShowNotification(!showNotification)}
              aria-label="Notifications"
            >
              <FaBell size={17} />
              {notifications.length > 0 && (
                <span className="dn2-topbar-badge">{notifications.length}</span>
              )}
            </button>

            {showNotification && (
              <div className="dn2-notif-panel">
                <div className="dn2-notif-head">
                  <div className="dn2-notif-head-left">
                    <FaBell size={14} />
                    <span>Delivery Requests</span>
                  </div>
                  <button
                    className="dn2-notif-close"
                    onClick={() => setShowNotification(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="dn2-notif-body">
                  {notifications.length === 0 ? (
                    <div className="dn2-notif-empty">
                      <FiCheck size={32} />
                      <p>All caught up!</p>
                      <span>No new requests right now.</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div className="dn2-req-card" key={n._id}>
                        <img
                          src={
                            n.order?.items?.[0]?.image
                              ? `http://localhost:4000/uploads/${n.order.items[0].image}`
                              : "/no-image.png"
                          }
                          alt="product"
                          className="dn2-req-img"
                        />
                        <div className="dn2-req-body">
                          <div className="dn2-req-top">
                            <span className="dn2-req-name">
                              {n.order?.items?.[0]?.product?.name}
                              {n.order?.items?.length > 1 && (
                                <span className="dn2-more-items">
                                  {" "}+{n.order.items.length - 1} more
                                </span>
                              )}
                            </span>
                            <span className="dn2-req-amount">
                              ₹{n.order?.totalAmount}
                            </span>
                          </div>
                          <div className="dn2-req-meta">
                            <FiUserIcon size={11} />
                            <span>{n.order?.user?.name}</span>
                            <span className="dn2-req-sep">·</span>
                            <FiClock size={11} />
                            <span>#{n.order.orderId?.slice(-9)}</span>
                          </div>
                          <div className="dn2-req-actions">
                            <button className="dn2-btn-reject" onClick={() => rejectOrder(n)}>
                              Reject
                            </button>
                            <button
                              className="dn2-btn-accept"
                              onClick={() => handleNotification(n)}
                            >
                              <FiCheck size={13} />
{n.type === "RETURN_PICKUP"
      ? "Accept Return"
      : "Accept Order"}                            </button>

                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <Link to="/profile" className="dn2-topbar-avatar" aria-label="Profile">
            <img src={avatarSrc} alt="profile" />
            <span className="dn2-topbar-dot dn2-dot--green" />
          </Link>
        </div>
      </header>

      {/* ══════════════ MOBILE OVERLAY + DRAWER (open/close via showSidebar) ══════════════ */}
      {showSidebar && (
        <div className="dn2-overlay" onClick={() => setShowSidebar(false)} />
      )}

      <aside className={`dn2-mobile-drawer${showSidebar ? " dn2-mobile-drawer--open" : ""}`}>
        <button className="dn2-drawer-close" onClick={() => setShowSidebar(false)}>
          <FiX size={20} />
        </button>
        <SidebarContent isMobile />
      </aside>
    </>
  );
}

export default DeliveryNavbar;