import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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

import "../styles/deliverySidebar.css";

export default function DeliverySidebar({
 showSidebar = false,
  setShowSidebar = () => {}
}) {


  const [notifications, setNotifications] = useState([]);



  useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const token =
        localStorage.getItem("deliveryToken");

      const res = await axios.get(
        "http://localhost:4000/api/notifications/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(
        res.data.notifications || []
      );
    } catch (error) {
      console.log(error);
    }
  };

  fetchNotifications();

  const interval = setInterval(
    fetchNotifications,
    10000
  );

  return () => clearInterval(interval);
}, []);

  const location = useLocation();

  const logoutHandler = () => {

    localStorage.removeItem("deliveryToken");

    window.location.href = "/delivery/login";

  };

  return (
    

    <>
  {showSidebar && (
    <div
      className="mobile-overlay"
      onClick={() =>
        setShowSidebar(false)
      }
    />
  )}

  <div
    className={`delivery-sidebar ${
      showSidebar ? "open" : ""
    }`}
  >
      <button
    className="close-sidebar"
    onClick={() => setShowSidebar(false)}
  >
    ✕
  </button>

      {/* LOGO */}
     

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
          <span>Deliverd orders</span>
        </Link>


        {/* <Link
  to="/cod"
  className={
    location.pathname === "/cod"
      ? "active"
      : ""
  }
  onClick={() => setShowSidebar(false)}
>
  <FaMoneyBillWave />
  <span>COD Collection</span>
</Link> */}

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
          <span>UserReturn Orders</span>
        </Link>

      </div>

      

    </div>

    </>

  );

}