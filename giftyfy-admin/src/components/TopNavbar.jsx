import React from "react";
import "../styles/TopNavbar.css";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const TopNavbar = () => {
  const navigate = useNavigate();

 const handleLogout = () => {
  const confirmLogout = window.confirm(
    "Are you sure you want to logout?"
  );

  if (!confirmLogout) {
    return;
  }

  localStorage.removeItem("token");
  navigate("/admin-login", { replace: true });
};

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h2 className="page-title">Admin Dashboard</h2>
      </div>

      <div className="navbar-right">
        <div className="admin-profile">
          <div className="profile-icon">
            <FiUser />
          </div>

          <div className="profile-info">
            <h4>Admin</h4>
            <span>Administrator</span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;