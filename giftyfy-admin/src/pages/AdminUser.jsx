import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/adminUsers.css";
import AdminLayout from "../layout/AdminLayout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // ---- UI-only state (search, filters, confirm modal, toast, image preview) ----
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | blocked
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [previewImage, setPreviewImage] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get("http://localhost:4000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers(res.data.users || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleBlock = async (id) => {
  try {

    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:4000/api/users/block/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchUsers();

  } catch (error) {
    console.log(error);
  }
};

  // Delete flow: confirmation now happens via the modal below instead of
  // window.confirm(). The actual delete request/logic is unchanged.
  const handleDelete = (id) => {
    setUserToDelete(id);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    const id = userToDelete;
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:4000/api/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showToast("User deleted successfully", "success");
      fetchUsers();

    } catch (error) {
      console.log(error);
      showToast("Failed to delete user", "error");
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  // ---- Derived data for the dashboard (frontend only, no API changes) ----
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => !u.isBlocked).length;
  const blockedUsers = users.filter((u) => u.isBlocked).length;

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.isBlocked) ||
      (statusFilter === "blocked" && user.isBlocked);

    return matchesSearch && matchesStatus;
  });

  const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

  const getOrderTotal = (order) =>
    order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AdminLayout>
      <div className="usrm-page">

        {/* =========================
            HEADER
        ========================= */}
        <div className="usrm-header">
          <div>
            <h1 className="usrm-title">User Management</h1>
            <p className="usrm-subtitle">
              Review, search and manage every customer account in one place.
            </p>
          </div>
        </div>

        {/* =========================
            SUMMARY CARDS
        ========================= */}
        <div className="usrm-summary-grid">
          <div className="usrm-summary-card">
            <span className="usrm-summary-icon usrm-summary-icon-total">
              <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </span>
            <div>
              <p className="usrm-summary-label">Total Users</p>
              <p className="usrm-summary-value">{totalUsers}</p>
            </div>
          </div>

          <div className="usrm-summary-card">
            <span className="usrm-summary-icon usrm-summary-icon-active">
              <svg viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div>
              <p className="usrm-summary-label">Active Users</p>
              <p className="usrm-summary-value">{activeUsers}</p>
            </div>
          </div>

          <div className="usrm-summary-card">
            <span className="usrm-summary-icon usrm-summary-icon-blocked">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="m5.5 5.5 13 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </span>
            <div>
              <p className="usrm-summary-label">Blocked Users</p>
              <p className="usrm-summary-value">{blockedUsers}</p>
            </div>
          </div>
        </div>

        {/* =========================
            TOOLBAR: SEARCH + FILTERS
        ========================= */}
        <div className="usrm-toolbar">
          <div className="usrm-search">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input
              type="text"
              placeholder="Search by name, email or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="usrm-filters">
            <button
              className={`usrm-chip ${statusFilter === "all" ? "usrm-chip-active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Users
            </button>
            <button
              className={`usrm-chip ${statusFilter === "active" ? "usrm-chip-active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>
            <button
              className={`usrm-chip ${statusFilter === "blocked" ? "usrm-chip-active" : ""}`}
              onClick={() => setStatusFilter("blocked")}
            >
              Blocked
            </button>
          </div>
        </div>

        {/* =========================
            DATA TABLE (card/grid based)
        ========================= */}
        <div className="usrm-table-card">

          <div className="usrm-table-head">
            <span>User</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Status</span>
            <span>Total Orders</span>
            <span className="usrm-col-actions">Actions</span>
          </div>

          <div className="usrm-table-body">
            {filteredUsers.length ? (
              filteredUsers.map((user) => (
                <div className="usrm-user-row" key={user._id}>

                  <div
                    className="usrm-cell usrm-cell-user"
                    data-label="User"
                    onClick={() => setSelectedUser(user)}
                  >
                    <span className="usrm-avatar">
                      {user.image ? (
                        <img src={user.image} alt={user.name} />
                      ) : (
                        getInitial(user.name)
                      )}
                    </span>
                    <span className="usrm-user-name">{user.name}</span>
                  </div>

                  <div className="usrm-cell" data-label="Email" onClick={() => setSelectedUser(user)}>
                    {user.email}
                  </div>

                  <div className="usrm-cell" data-label="Phone" onClick={() => setSelectedUser(user)}>
                    {user.phone}
                  </div>

                  <div className="usrm-cell" data-label="Status">
                    <span className={`usrm-badge ${user.isBlocked ? "usrm-badge-blocked" : "usrm-badge-active"}`}>
                      <i /> {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </div>

                  <div className="usrm-cell" data-label="Total Orders">
                    {user.orders?.length || 0}
                  </div>

                  <div className="usrm-cell usrm-cell-actions" data-label="Actions">
                    <button
                      className="usrm-icon-btn usrm-icon-view"
                      title="View"
                      onClick={() => setSelectedUser(user)}
                    >
                      <svg viewBox="0 0 24 24" fill="none"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>
                    </button>

                    <button
                      className={`usrm-icon-btn ${user.isBlocked ? "usrm-icon-unblock" : "usrm-icon-block"}`}
                      title={user.isBlocked ? "Unblock" : "Block"}
                      onClick={() => handleBlock(user._id)}
                    >
                      {user.isBlocked ? (
                        <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 11V7a4 4 0 0 1 7.6-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                      )}
                    </button>

                    <button
                      className="usrm-icon-btn usrm-icon-delete"
                      title="Delete"
                      onClick={() => handleDelete(user._id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" strokeWidth="1.7"/></svg>
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="usrm-empty">No users match your search or filters.</div>
            )}
          </div>
        </div>

        {/* =========================
            USER DETAILS MODAL
        ========================= */}
        {selectedUser && (
          <div
            className="usrm-modal-overlay"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="usrm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="usrm-modal-close"
                onClick={() => setSelectedUser(null)}
              >
                ✖
              </button>

              {/* PROFILE HEADER */}
              <div className="usrm-profile-header">
                <span className="usrm-profile-avatar">
                  {selectedUser.image ? (
                    <img src={selectedUser.image} alt={selectedUser.name} />
                  ) : (
                    getInitial(selectedUser.name)
                  )}
                </span>
                <div>
                  <h2>{selectedUser.name}</h2>
                  <span className={`usrm-badge ${selectedUser.isBlocked ? "usrm-badge-blocked" : "usrm-badge-active"}`}>
                    <i /> {selectedUser.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>
              </div>

              {/* PERSONAL INFORMATION */}
              <h3 className="usrm-section-title">Personal Information</h3>
              <div className="usrm-info-grid">
                <div className="usrm-info-item">
                  <span>Name</span>
                  <p>{selectedUser.name}</p>
                </div>
                <div className="usrm-info-item">
                  <span>Email</span>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="usrm-info-item">
                  <span>Phone</span>
                  <p>{selectedUser.phone}</p>
                </div>
              </div>

              {/* STATISTICS */}
              <h3 className="usrm-section-title">Statistics</h3>
              <div className="usrm-stats-grid">
                <div className="usrm-stat-box">
                  <p className="usrm-stat-label">Orders</p>
                  <p className="usrm-stat-value">{selectedUser.orders?.length || 0}</p>
                </div>
                <div className="usrm-stat-box">
                  <p className="usrm-stat-label">Total Amount</p>
                  <p className="usrm-stat-value">
                    ₹{Math.round(
                      selectedUser.orders?.reduce(
                        (sum, order) => sum + (order.totalAmount || 0),
                        0
                      ) || 0
                    )}
                  </p>
                </div>
                <div className="usrm-stat-box">
                  <p className="usrm-stat-label">Items Purchased</p>
                  <p className="usrm-stat-value">
                    {selectedUser.orders?.reduce(
                      (sum, order) => sum + getOrderTotal(order),
                      0
                    ) || 0}
                  </p>
                </div>
              </div>

              {/* ORDERS */}
              <h3 className="usrm-section-title">Order History</h3>

              {selectedUser.orders?.length ? (
                <div className="usrm-orders-list">
                  {selectedUser.orders.map((order, i) => (
                    <div key={i} className="usrm-order-card">
                      <div className="usrm-order-card-head">
                        <span>Order #{i + 1}</span>
                        <span className="usrm-order-status">
                          {order.status || "Placed"}
                        </span>
                      </div>

                      {order.items.map((item, j) => {
                        const imgSrc = item.image?.startsWith("uploads")
                          ? `http://localhost:4000/${item.image}`
                          : `http://localhost:4000/uploads/${item.image}`;

                        return (
                          <div key={j} className="usrm-order-item">
                            <img
                              src={imgSrc}
                              alt={item.name}
                              onClick={() => setPreviewImage(imgSrc)}
                            />
                            <div className="usrm-order-item-info">
                              <p className="usrm-order-item-name">{item.name}</p>
                              <small>Qty: {item.quantity}</small>
                              <p className="usrm-order-item-price">
                                ₹{Math.round(item.price)}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      <div className="usrm-order-card-footer">
                        <div>
                          <p className="usrm-order-total">
                            Total: ₹{Math.round(order.totalAmount)}
                          </p>
                        </div>
                        <div className="usrm-order-address">
                          <p><b>Address:</b> {order.address}</p>
                          <p><b>Pincode:</b> {order.deliveryPincode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="usrm-no-orders">No Orders</p>
              )}
            </div>
          </div>
        )}

        {/* =========================
            IMAGE PREVIEW
        ========================= */}
        {previewImage && (
          <div
            className="usrm-preview-overlay"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              alt="Product preview"
              className="usrm-preview-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* =========================
            DELETE CONFIRMATION MODAL
        ========================= */}
        {showDeleteConfirm && (
          <div className="usrm-confirm-overlay" onClick={cancelDelete}>
            <div className="usrm-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <span className="usrm-confirm-icon">
                <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" strokeWidth="1.7"/></svg>
              </span>
              <h3>Delete this user?</h3>
              <p>This action can't be undone. The account and its records will be permanently removed.</p>
              <div className="usrm-confirm-actions">
                <button className="usrm-confirm-cancel" onClick={cancelDelete}>
                  Cancel
                </button>
                <button className="usrm-confirm-delete" onClick={confirmDelete}>
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================
            TOAST
        ========================= */}
        {toast && (
          <div className={`usrm-toast usrm-toast-${toast.type}`}>
            {toast.type === "success" ? (
              <svg viewBox="0 0 24 24" fill="none"><path d="m20 6-11 11-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            )}
            <span>{toast.message}</span>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}