
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaWallet,
  FaUser,
  FaUndo,
  FaBell,
  FaTimesCircle,
} from "react-icons/fa";

import "../styles/deliverySidebar.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "https://giftyfy-backend.onrender.com"
    : "https://giftyfy-backend.onrender.com")
).replace(/\/+$/, "");

export default function DeliverySidebar({
  showSidebar = false,
  setShowSidebar = () => {},
}) {
  const [notifications, setNotifications] = useState([]);
  const [partner, setPartner] = useState(null);

  const location = useLocation();

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("deliveryToken")}`,
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      if (!token) return;

      const res = await axios.get(
        `${API_BASE}/api/delivery/profile`,
        { headers: getAuthHeaders() }
      );

      setPartner(res.data.partner || null);
    } catch (error) {
      console.log("Sidebar profile error:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      if (!token) return;

      const res = await axios.get(
        `${API_BASE}/api/notifications/my`,
        { headers: getAuthHeaders() }
      );

      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.log("Sidebar notification error:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchNotifications();

    const profileInterval = setInterval(fetchProfile, 30000);
    const notificationInterval = setInterval(fetchNotifications, 10000);

    const handleProfileUpdate = () => fetchProfile();

    window.addEventListener(
      "deliveryProfileUpdated",
      handleProfileUpdate
    );

    return () => {
      clearInterval(profileInterval);
      clearInterval(notificationInterval);
      window.removeEventListener(
        "deliveryProfileUpdated",
        handleProfileUpdate
      );
    };
  }, []);

  const photoUrl = partner?.photo
    ? /^https?:\/\//i.test(partner.photo)
      ? partner.photo
      : `${API_BASE}/uploads/${encodeURIComponent(partner.photo)}`
    : null;

  return (
    <>
      {showSidebar && (
        <div
          className="mobile-overlay"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div
        className={`delivery-sidebar ${showSidebar ? "open" : ""}`}
      >
        <button
          className="close-sidebar"
          onClick={() => setShowSidebar(false)}
        >
          <FaTimesCircle />
        </button>

        {/* DELIVERY PARTNER PROFILE */}
        <Link
          to="/profile"
          className="sidebar-profile-card"
          onClick={() => setShowSidebar(false)}
        >
          <div className="sidebar-profile-avatar">
            <FaUser />
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Delivery Partner"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          <div className="sidebar-profile-info">
            <strong>{partner?.name || "Delivery Partner"}</strong>
            <span>View Profile</span>
          </div>
        </Link>

        {/* MENU */}
        <div className="sidebar-menu">
          <Link
            to="/"
            className={
              location.pathname === "/delivery/dashboard"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaHome />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/delivery-requests"
            className={
              location.pathname === "/delivery-requests"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaBell />
            <span>Delivery Requests</span>

            {notifications.length > 0 && (
              <span className="sidebar-badge">
                {notifications.length}
              </span>
            )}
          </Link>

          <Link
            to="/order-pickup"
            className={
              location.pathname === "/delivery/orders"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaClipboardList />
            <span>Order Pickup</span>
          </Link>

          <Link
            to="/reports"
            className={
              location.pathname === "/delivery/reports"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaChartBar />
            <span>Delivered Orders</span>
          </Link>

          <Link
            to="/delivery/cancel-orders"
            className={
              location.pathname === "/delivery/cancel-orders"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaTimesCircle />
            <span>Cancel Orders</span>
          </Link>

          <Link
            to="/wallet"
            className={
              location.pathname === "/delivery/wallet"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaWallet />
            <span>Wallet</span>
          </Link>

          <Link
            to="/profile"
            className={
              location.pathname === "/delivery/profile"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaUser />
            <span>Profile</span>
          </Link>

          <Link
            to="/returns"
            className={
              location.pathname === "/delivery/returns"
                ? "active"
                : ""
            }
            onClick={() => setShowSidebar(false)}
          >
            <FaUndo />
            <span>User Return Orders</span>
          </Link>
        </div>
      </div>
    </>
  );
}
