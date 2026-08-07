import React, { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import TopNavbar from "../components/TopNavbar";
import "../styles/adminLayout.css";

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`admin-main ${
          collapsed ? "sidebar-collapsed" : "sidebar-expanded"
        }`}
      >
        <div className="admin-navbar">
          <TopNavbar />
        </div>

        <div className="admin-page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;