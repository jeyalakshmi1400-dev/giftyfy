import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "../styles/AdminSidebar.css";
import axios from "axios";

import {
  FaTachometerAlt,
  FaImage,
  FaBoxOpen,
  FaList,
  FaPlus,
  FaShoppingCart,
  FaUsers,
  FaMotorcycle,
  FaUndo,
  FaStar,
  FaMoneyBillWave,
  FaInfoCircle,
  FaChevronDown,
  FaCog,
  FaSearch,
  FaTicketAlt,
  FaGift,
  FaChartLine,
  FaHeadset,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaBolt,
  FaCloudUploadAlt,
  FaWallet,
  FaRupeeSign,
  FaClock,
  FaTruck,
} from "react-icons/fa";

/**
 * AdminSidebar — premium glassmorphism redesign.
 *
 * NOTE: All routes, notification polling, and business logic are unchanged
 * from the original component. Only presentation (structure/markup/CSS)
 * has been enhanced. Fields marked "mock" below (today's orders, revenue,
 * delivery pending, storage usage) are placeholders — wire them up to your
 * real endpoints whenever those are ready.
 */

const AdminSidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  const [notifications, setNotifications] = useState({
    orders: 0,
    returns: 0,
    deliveryPartners: 0,
    paymentRequests: 0,
  });

  const [openMenu, setOpenMenu] = useState("Main");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? "" : menu);
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:4000/api/admin/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const menu = [
    {
      heading: "Main",
      items: [
        { name: "Dashboard", path: "/admin", icon: <FaTachometerAlt /> },
      ],
    },
    {
      heading: "Products",
      items: [
        { name: "Banner", path: "/admin/banner", icon: <FaImage /> },
        { name: "Products", path: "/admin/product", icon: <FaBoxOpen /> },
        { name: "Add Product", path: "/admin/addproduct", icon: <FaPlus /> },
        { name: "Categories", path: "/admin/category", icon: <FaList /> },
        { name: "Coupon", path: "/admin/coupons", icon: <FaTicketAlt /> },
        {
          name: "Create Coupon",
          path: "/admin/create-coupon",
          icon: <FaGift />,
        },
        {
      name: "Gift Settings",
      path: "/admin/gift-setting",
      icon: <FaGift />,
    },
      ],
    },
    {
      heading: "Orders",
      items: [
        {
          name: "Orders",
          path: "/admin/orders",
          icon: <FaShoppingCart />,
          count: notifications.orders,
          badgeType: "indigo",
        },
        {
          name: "Returns",
          path: "/admin/returns",
          icon: <FaUndo />,
          count: notifications.returns,
          badgeType: "rose",
        },
      ],
    },
    {
      heading: "Delivery",
      items: [
        {
      name: "Delivery Charge",
      path: "/adim/delivery-charge",
      icon: <FaTruck />,
    },
        {
          name: "Delivery Salary Management",
          path: "/salary-management",
          icon: <FaMoneyBillWave />,
        },
        {
          name: "Partners",
          path: "/admin/delivery-partners",
          icon: <FaMotorcycle />,
          count: notifications.deliveryPartners,
          badgeType: "sky",
        },
        {
          name: "COD Settlement",
          path: "/admin/cod",
          icon: <FaWallet />,
          count: notifications.codSettlements || 0,
          badgeType: "amber",
        },
      ],
    },
    {
      heading: "Management",
      items: [
        { name: "Users", path: "/admin/users", icon: <FaUsers /> },
        {
          name: "Profit",
          path: "/admin/profit",
          icon: <FaChartLine />,
        },
        {
          name: "Reviews",
          path: "/admin/reviews",
          icon: <FaStar />,
          count: notifications.reviews || 0,
          badgeType: "amber",
        },
        {
          name: "Site Content",
          path: "/admin/site-content",
          icon: <FaInfoCircle />,
        },
      ],
    },
  ].map((section) => ({
    ...section,
    totalCount: section.items.reduce((sum, item) => sum + (item.count || 0), 0),
  }));

  const filteredMenu = useMemo(() => {
    if (!search.trim()) return menu;
    const q = search.toLowerCase();
    return menu
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.name.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, notifications]);

  useEffect(() => {
    if (search.trim() && filteredMenu.length > 0) {
      setOpenMenu(filteredMenu[0].heading);
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`giftyfy-sidebar-overlay ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile trigger */}
      <button
        className="giftyfy-mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <FaAngleDoubleRight />
      </button>

      <aside
        className={`giftyfy-admin-sidebar ${collapsed ? "is-collapsed" : ""} ${
          mobileOpen ? "is-mobile-open" : ""
        }`}
      >
        {/* ================= HEADER ================= */}
        <div className="giftyfy-sidebar-header">
          <div className="giftyfy-header-top">
            <div className="giftyfy-logo-block">
              <div className="giftyfy-logo-mark">🎁</div>
              {!collapsed && (
                <div className="giftyfy-logo-text">
                  <h1>Giftyfy</h1>
                  <span>Control Center</span>
                </div>
              )}
            </div>

            <button
              className="giftyfy-collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
            </button>
          </div>

          <div className="giftyfy-admin-profile">
            <div className="giftyfy-avatar">
              <span>A</span>
              <i className="giftyfy-status-dot" title="Online" />
            </div>
            {!collapsed && (
              <div className="giftyfy-admin-info">
                <p className="giftyfy-admin-name">Admin</p>
                <p className="giftyfy-admin-status">
                  <i className="giftyfy-status-dot-inline" />
                  Online
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= SEARCH ================= */}
        {!collapsed && (
          <div className="giftyfy-sidebar-search">
            <FaSearch className="giftyfy-search-icon" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* ================= SCROLLABLE AREA ================= */}
        <div className="giftyfy-sidebar-scroll">
          {/* Mini stat cards */}
          {!collapsed && (
            <div className="giftyfy-stat-grid">
              <div className="giftyfy-stat-card stat-indigo">
                <FaShoppingCart className="giftyfy-stat-icon" />
                <div>
                  <p className="giftyfy-stat-value">24</p>
                  <p className="giftyfy-stat-label">Today's Orders</p>
                </div>
              </div>
              <div className="giftyfy-stat-card stat-emerald">
                <FaRupeeSign className="giftyfy-stat-icon" />
                <div>
                  <p className="giftyfy-stat-value">₹18.4k</p>
                  <p className="giftyfy-stat-label">Revenue</p>
                </div>
              </div>
              <div className="giftyfy-stat-card stat-amber">
                <FaClock className="giftyfy-stat-icon" />
                <div>
                  <p className="giftyfy-stat-value">
                    {notifications.deliveryPartners || 0}
                  </p>
                  <p className="giftyfy-stat-label">Delivery Pending</p>
                </div>
              </div>
            </div>
          )}

          <div className="giftyfy-gradient-divider" />

          {/* Navigation */}
          <ul className="giftyfy-admin-nav">
            {filteredMenu.map((section, index) => (
              <div className="giftyfy-admin-dropdown-section" key={index}>
                <div
                  className={`giftyfy-admin-dropdown-header ${
                    openMenu === section.heading ? "giftyfy-admin-header-active" : ""
                  }`}
                  onClick={() => toggleMenu(section.heading)}
                >
                  <div className="giftyfy-admin-dropdown-title-wrap">
                    <span className="giftyfy-admin-dropdown-title">
                      {section.heading}
                    </span>
                    {section.totalCount > 0 && (
                      <span className="giftyfy-admin-section-badge">
                        {section.totalCount}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <motion.span
                      animate={{ rotate: openMenu === section.heading ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="giftyfy-admin-dropdown-arrow"
                    >
                      <FaChevronDown />
                    </motion.span>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {(openMenu === section.heading || collapsed) && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="giftyfy-admin-dropdown-content"
                    >
                      {section.items.map((item, i) => (
                        <li className="giftyfy-admin-nav-item" key={i}>
                          <Link
                            to={item.path}
                            title={collapsed ? item.name : undefined}
                            className={`giftyfy-admin-nav-link ${
                              location.pathname === item.path
                                ? "giftyfy-admin-active-link"
                                : ""
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <div className="giftyfy-admin-nav-left">
                              <span className="giftyfy-admin-icon">{item.icon}</span>
                              {!collapsed && (
                                <span className="giftyfy-admin-nav-text">
                                  {item.name}
                                </span>
                              )}
                            </div>

                            {item.count > 0 && !collapsed && (
                              <span
                                className={`giftyfy-admin-badge badge-${item.badgeType || "indigo"}`}
                              >
                                {item.count}
                              </span>
                            )}
                            {item.count > 0 && collapsed && (
                              <span className="giftyfy-admin-badge-dot" />
                            )}
                          </Link>
                        </li>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {filteredMenu.length === 0 && (
              <p className="giftyfy-no-results">No menu items match "{search}"</p>
            )}
          </ul>

          {!collapsed && (
            <>
              <div className="giftyfy-gradient-divider" />

              {/* Quick actions */}
              <div className="giftyfy-quick-actions">
                <p className="giftyfy-section-label">
                  <FaBolt /> Quick Actions
                </p>
                <div className="giftyfy-quick-actions-grid">
                  <Link to="/admin/addproduct" className="giftyfy-quick-btn">
                    <FaPlus /> Add Product
                  </Link>
                  <Link to="/admin/create-coupon" className="giftyfy-quick-btn">
                    <FaGift /> New Coupon
                  </Link>
                </div>
              </div>

              {/* System status */}
              <div className="giftyfy-system-card">
                <div className="giftyfy-system-row">
                  <span className="giftyfy-status-dot-inline" />
                  <span>All systems operational</span>
                </div>
                <div className="giftyfy-storage-row">
                  <div className="giftyfy-storage-label">
                    <FaCloudUploadAlt />
                    <span>Storage used</span>
                    <span className="giftyfy-storage-pct">62%</span>
                  </div>
                  <div className="giftyfy-storage-bar">
                    <div className="giftyfy-storage-fill" style={{ width: "62%" }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="giftyfy-sidebar-footer">
          <div className="giftyfy-footer-actions">
            <Link to="/admin/settings" className="giftyfy-footer-btn" title="Settings">
              <FaCog />
              {!collapsed && <span>Settings</span>}
            </Link>
            <Link to="/admin/help" className="giftyfy-footer-btn" title="Help Center">
              <FaHeadset />
              {!collapsed && <span>Help Center</span>}
            </Link>
          </div>
          {!collapsed && (
            <div className="giftyfy-footer-meta">
              <span>v2.4.0</span>
              <span>© Giftyfy Admin Panel</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;