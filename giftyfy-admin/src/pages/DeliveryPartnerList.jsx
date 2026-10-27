import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminLayout from "../layout/AdminLayout";
import "../styles/deliveryPartnerList.css";
import {
  FaEye,
  FaCheckCircle,
  FaTrashAlt,
  FaMoneyBillWave,
  FaBan,
  FaLockOpen,
  FaSearch,
  FaTimes,
  FaMotorcycle,
} from "react-icons/fa";

export default function DeliveryPartnerList() {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem("token");
  const [selectedPartner, setSelectedPartner] = useState(null);

  const [salaryModal, setSalaryModal] = useState(false);
  const [salaryPartner, setSalaryPartner] = useState(null);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [bonusPerOrder, setBonusPerOrder] = useState(10);
  const [showModal, setShowModal] = useState(false);

  // ---- UI-only additions (search / filter / confirmations / preview) ----
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // ==========================
  // FETCH PARTNERS
  // ==========================
  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/api/delivery", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPartners(res.data || []);
    } catch (error) {
      console.log("FETCH ERROR 👉", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // ==========================
  // APPROVE
  // ==========================
  const approve = async (id) => {
    try {
      await axios.put(
        `http://localhost:4000/api/delivery/approve/${id}`,
        {
          isApproved: true,
          monthlySalary: Number(monthlySalary),
          bonusPerOrder: Number(bonusPerOrder),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchPartners();
    } catch (error) {
      console.log("APPROVE ERROR 👉", error.response?.data || error);
    }
  };

  // ==========================
  // DELETE (API logic unchanged — window.confirm replaced by modal)
  // ==========================
  const deletePartner = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/delivery/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchPartners();
    } catch (error) {
      console.log("DELETE ERROR 👉", error.response?.data || error);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) deletePartner(deleteTarget._id);
    setDeleteTarget(null);
  };

  // ==========================
  // BLOCK / UNBLOCK (API logic unchanged — confirmation modal added)
  // ==========================
  const toggleBlock = async (id) => {
    try {
      await axios.put(
        `http://localhost:4000/api/delivery/block/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchPartners();
    } catch (error) {
      console.log("BLOCK ERROR 👉", error.response?.data || error);
    }
  };

  const confirmToggleBlock = () => {
    if (blockTarget) toggleBlock(blockTarget._id);
    setBlockTarget(null);
  };

  // ==========================
  // SALARY
  // ==========================
  const updateSalary = async () => {
    try {
      await axios.put(
        `http://localhost:4000/api/delivery/salary/${salaryPartner._id}`,
        {
          monthlySalary: Number(monthlySalary),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Salary Updated Successfully");

      setSalaryModal(false);

      fetchPartners();
    } catch (error) {
      console.log(error);
    }
  };

  // ==========================
  // DERIVED (UI-only, no API impact)
  // ==========================
  const stats = useMemo(
    () => ({
      total: partners.length,
      approved: partners.filter((p) => p.isApproved).length,
      pending: partners.filter((p) => !p.isApproved).length,
      blocked: partners.filter((p) => p.isBlocked).length,
    }),
    [partners]
  );

  const vehicleOptions = useMemo(() => {
    const set = new Set(partners.map((p) => p.vehicleType).filter(Boolean));
    return Array.from(set);
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phone?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && p.isApproved) ||
        (statusFilter === "pending" && !p.isApproved) ||
        (statusFilter === "blocked" && p.isBlocked);

      const matchesVehicle =
        vehicleFilter === "all" || p.vehicleType === vehicleFilter;

      return matchesSearch && matchesStatus && matchesVehicle;
    });
  }, [partners, searchTerm, statusFilter, vehicleFilter]);

  const openView = (p) => {
    setSelectedPartner(p);
    setShowModal(true);
  };

  // Splits a pincode value on commas so multiple pincodes stack
  // inside a fixed-width column instead of stretching it.
  const renderPincodes = (pincode) => {
    if (!pincode) return <span className="dpl-pincode-tag">—</span>;
    const parts = String(pincode)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return parts.map((code, i) => (
      <span className="dpl-pincode-tag" key={i}>
        {code}
      </span>
    ));
  };

  return (
    <AdminLayout>
      <div className="dpl-page">
        {/* =========================
            HEADER
        ========================= */}
        <div className="dpl-header">
          <div className="dpl-header-text">
            <h1 className="dpl-title">Delivery Partners</h1>
            <p className="dpl-subtitle">
              Manage riders, approvals, payouts and access in one place.
            </p>
          </div>

          <div className="dpl-stat-grid">
            <div className="dpl-stat-card dpl-stat-total">
              <span className="dpl-stat-value">{stats.total}</span>
              <span className="dpl-stat-label">Total Partners</span>
            </div>
            <div className="dpl-stat-card dpl-stat-approved">
              <span className="dpl-stat-value">{stats.approved}</span>
              <span className="dpl-stat-label">Approved</span>
            </div>
            <div className="dpl-stat-card dpl-stat-pending">
              <span className="dpl-stat-value">{stats.pending}</span>
              <span className="dpl-stat-label">Pending</span>
            </div>
            <div className="dpl-stat-card dpl-stat-blocked">
              <span className="dpl-stat-value">{stats.blocked}</span>
              <span className="dpl-stat-label">Blocked</span>
            </div>
          </div>
        </div>

        {/* =========================
            SEARCH & FILTERS
        ========================= */}
        <div className="dpl-toolbar">
          <div className="dpl-search">
            <FaSearch className="dpl-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="dpl-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            className="dpl-select"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
          >
            <option value="all">All Vehicles</option>
            {vehicleOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* =========================
            TABLE
        ========================= */}
        <div className="dpl-table-wrapper">
          <div className="dpl-table-header">
            <span>Name</span>
            <span>Phone</span>
            <span>Vehicle</span>
            <span>Pincode</span>
            <span>Salary</span>
            <span>Status</span>
            <span className="dpl-th-actions">Actions</span>
          </div>

          {/* ---- LOADING SKELETON ---- */}
          {isLoading && (
            <div className="dpl-table-body">
              {[1, 2, 3, 4].map((i) => (
                <div className="dpl-skeleton-row" key={i}>
                  <div className="dpl-skeleton-identity">
                    <div className="dpl-skeleton dpl-skeleton-avatar" />
                    <div className="dpl-skeleton-lines">
                      <div className="dpl-skeleton dpl-skeleton-line short" />
                      <div className="dpl-skeleton dpl-skeleton-line" />
                    </div>
                  </div>
                  <div className="dpl-skeleton dpl-skeleton-text" />
                  <div className="dpl-skeleton dpl-skeleton-text" />
                  <div className="dpl-skeleton dpl-skeleton-text" />
                  <div className="dpl-skeleton dpl-skeleton-text" />
                  <div className="dpl-skeleton dpl-skeleton-text" />
                  <div className="dpl-skeleton dpl-skeleton-pill" />
                  <div className="dpl-skeleton dpl-skeleton-text" />
                </div>
              ))}
            </div>
          )}

          {/* ---- EMPTY STATE ---- */}
          {!isLoading && filteredPartners.length === 0 && (
            <div className="dpl-empty">
              <FaMotorcycle className="dpl-empty-icon" />
              <h3>No Delivery Partners Found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}

          {/* ---- ROWS ---- */}
          {!isLoading && filteredPartners.length > 0 && (
            <div className="dpl-table-body">
              {filteredPartners.map((p) => (
                <div className="dpl-row" key={p._id}>
                  <div className="dpl-row-main" onClick={() => openView(p)}>
                    <img
                      className="dpl-avatar"
                      src={`http://localhost:4000/uploads/${p.photo}`}
                      alt={p.name}
                      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                    />

                    <div className="dpl-row-identity">
                      <span className="dpl-row-name">{p.name}</span>
                      <span className="dpl-row-sub">{p.email}</span>
                    </div>
                  </div>

                  <div className="dpl-cell dpl-cell-phone">{p.phone}</div>

                  <div className="dpl-cell dpl-cell-vehicle">
                    <span className="dpl-vehicle-chip">
                      {p.vehicleType} · {p.vehicleNumber}
                    </span>
                  </div>

                  <div className="dpl-cell dpl-cell-pincode">
                    {renderPincodes(p.pincode)}
                  </div>

                  
                  <div className="dpl-cell dpl-cell-salary">
                    ₹{p.monthlySalary ?? 0}/mo
                  </div>

                  <div className="dpl-cell dpl-cell-status">
                    {p.isBlocked ? (
                      <span className="dpl-badge dpl-badge-blocked">Blocked</span>
                    ) : p.isApproved ? (
                      <span className="dpl-badge dpl-badge-approved">Approved</span>
                    ) : (
                      <span className="dpl-badge dpl-badge-pending">Pending</span>
                    )}
                  </div>

                  <div className="dpl-row-actions">
                    <button
                      className="dpl-icon-btn dpl-icon-view"
                      title="View Details"
                      onClick={() => openView(p)}
                    >
                      <FaEye />
                    </button>

                    <button
                      className="dpl-icon-btn dpl-icon-salary"
                      title="Update Salary"
                      onClick={() => {
                        setSalaryPartner(p);
                        setMonthlySalary(p.monthlySalary || 0);
                        setSalaryModal(true);
                      }}
                    >
                      <FaMoneyBillWave />
                    </button>

                    {!p.isApproved && (
                      <button
                        className="dpl-icon-btn dpl-icon-approve"
                        title="Approve Partner"
                        onClick={() => approve(p._id)}
                      >
                        <FaCheckCircle />
                      </button>
                    )}

                    <button
                      className={
                        p.isBlocked
                          ? "dpl-icon-btn dpl-icon-unblock"
                          : "dpl-icon-btn dpl-icon-block"
                      }
                      title={p.isBlocked ? "Unblock Partner" : "Block Partner"}
                      onClick={() => setBlockTarget(p)}
                    >
                      {p.isBlocked ? <FaLockOpen /> : <FaBan />}
                    </button>

                    <button
                      className="dpl-icon-btn dpl-icon-delete"
                      title="Delete Partner"
                      onClick={() => setDeleteTarget(p)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          VIEW MODAL
      ========================= */}
      {showModal && selectedPartner && (
        <div className="dpl-overlay" onClick={() => setShowModal(false)}>
          <div className="dpl-modal dpl-modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="dpl-close-btn" onClick={() => setShowModal(false)}>
              <FaTimes />
            </button>

            <div className="dpl-modal-hero">
              <img
                className="dpl-modal-photo"
                src={`http://localhost:4000/uploads/${selectedPartner.photo}`}
                alt={selectedPartner.name}
                onClick={() =>
                  setPreviewImage(
                    `http://localhost:4000/uploads/${selectedPartner.photo}`
                  )
                }
              />
              <div>
                <h2 className="dpl-modal-name">{selectedPartner.name}</h2>
                <p className="dpl-modal-email">{selectedPartner.email}</p>
              </div>
            </div>

            {/* Personal Information */}
            <section className="dpl-section">
              <h3 className="dpl-section-title">Personal Information</h3>
              <div className="dpl-info-grid">
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Phone</span>
                  <span className="dpl-info-value">{selectedPartner.phone}</span>
                </div>
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Address</span>
                  <span className="dpl-info-value">{selectedPartner.address}</span>
                </div>
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Pincode</span>
                  <span className="dpl-info-value">{selectedPartner.pincode}</span>
                </div>
              </div>
            </section>

            {/* Vehicle Details */}
            <section className="dpl-section">
              <h3 className="dpl-section-title">Vehicle Details</h3>
              <div className="dpl-info-grid">
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Vehicle Type</span>
                  <span className="dpl-info-value">{selectedPartner.vehicleType}</span>
                </div>
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Vehicle Number</span>
                  <span className="dpl-info-value">{selectedPartner.vehicleNumber}</span>
                </div>
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Driving License No</span>
                  <span className="dpl-info-value">{selectedPartner.drivingLicenseNo}</span>
                </div>
              </div>
            </section>

            {/* Government Documents */}
            <section className="dpl-section">
              <h3 className="dpl-section-title">Government Documents</h3>
              <div className="dpl-doc-grid">
                <div className="dpl-doc-card">
                  <span className="dpl-info-label">Aadhar — {selectedPartner.aadharNumber}</span>
                  <img
                    src={`http://localhost:4000/uploads/${selectedPartner.aadharImage}`}
                    alt="Aadhar"
                    className="dpl-doc-img"
                    onClick={() =>
                      setPreviewImage(
                        `http://localhost:4000/uploads/${selectedPartner.aadharImage}`
                      )
                    }
                  />
                </div>
                <div className="dpl-doc-card">
                  <span className="dpl-info-label">PAN — {selectedPartner.panNumber}</span>
                  <img
                    src={`http://localhost:4000/uploads/${selectedPartner.panImage}`}
                    alt="PAN"
                    className="dpl-doc-img"
                    onClick={() =>
                      setPreviewImage(
                        `http://localhost:4000/uploads/${selectedPartner.panImage}`
                      )
                    }
                  />
                </div>
                <div className="dpl-doc-card">
                  <span className="dpl-info-label">
                    Driving License — {selectedPartner.drivingLicenseNo}
                  </span>
                  <img
                    src={`http://localhost:4000/uploads/${selectedPartner.drivingLicenseImage}`}
                    alt="Driving License"
                    className="dpl-doc-img"
                    onClick={() =>
                      setPreviewImage(
                        `http://localhost:4000/uploads/${selectedPartner.drivingLicenseImage}`
                      )
                    }
                  />
                </div>
              </div>
            </section>

            {/* Bank Details */}
            <section className="dpl-section">
              <h3 className="dpl-section-title">Bank Details</h3>
              <div className="dpl-info-grid">
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Bank Name</span>
                  <span className="dpl-info-value">{selectedPartner.bankName}</span>
                </div>
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Account Holder</span>
                  <span className="dpl-info-value">{selectedPartner.accountHolderName}</span>
                </div>
                <div className="dpl-info-item">
                  <span className="dpl-info-label">Account Number</span>
                  <span className="dpl-info-value">{selectedPartner.accountNumber}</span>
                </div>
                <div className="dpl-info-item">
                  <span className="dpl-info-label">IFSC</span>
                  <span className="dpl-info-value">{selectedPartner.ifscCode}</span>
                </div>
              </div>
            </section>

            {/* Earnings */}
            <section className="dpl-section">
              <h3 className="dpl-section-title">Earnings</h3>
              <div className="dpl-earnings-grid">
                <div className="dpl-earning-card">
                  <span className="dpl-earning-value">₹{selectedPartner.walletBalance}</span>
                  <span className="dpl-earning-label">Wallet Balance</span>
                </div>
                <div className="dpl-earning-card">
                  <span className="dpl-earning-value">₹{monthlySalary}</span>
                  <span className="dpl-earning-label">Monthly Salary</span>
                </div>
                <div className="dpl-earning-card">
                  <span className="dpl-earning-value">₹{bonusPerOrder}</span>
                  <span className="dpl-earning-label">Bonus / Order</span>
                </div>
                <div className="dpl-earning-card">
                  <span className="dpl-earning-value">
                    {selectedPartner.totalDeliveredOrders}
                  </span>
                  <span className="dpl-earning-label">Delivered Orders</span>
                </div>
                <div className="dpl-earning-card">
                  <span className="dpl-earning-value">₹{selectedPartner.totalWithdrawn}</span>
                  <span className="dpl-earning-label">Total Withdrawn</span>
                </div>
              </div>
            </section>

            {/* Salary inputs (kept exactly as original state/behaviour) */}
            <section className="dpl-section dpl-salary-card">
              <h3 className="dpl-section-title">Salary Details</h3>

              <label className="dpl-label">Monthly Salary</label>
              <input
                className="dpl-input"
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="Enter Monthly Salary"
              />

              <label className="dpl-label">Bonus Per Order</label>
              <input
                className="dpl-input"
                type="number"
                value={bonusPerOrder}
                onChange={(e) => setBonusPerOrder(e.target.value)}
                placeholder="10"
              />

              {!selectedPartner.isApproved && (
                <button
                  className="dpl-btn dpl-btn-success"
                  onClick={() => approve(selectedPartner._id)}
                >
                  Approve Partner
                </button>
              )}
            </section>
          </div>
        </div>
      )}

      {/* =========================
          SALARY MODAL
      ========================= */}
      {salaryModal && (
        <div className="dpl-overlay" onClick={() => setSalaryModal(false)}>
          <div className="dpl-modal dpl-modal-narrow" onClick={(e) => e.stopPropagation()}>
            <h2 className="dpl-modal-title-center">Update Monthly Salary</h2>

            <label className="dpl-label">Monthly Salary</label>
            <input
              className="dpl-input"
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
            />

            <div className="dpl-modal-buttons">
              <button className="dpl-btn dpl-btn-ghost" onClick={() => setSalaryModal(false)}>
                Cancel
              </button>
              <button className="dpl-btn dpl-btn-success" onClick={updateSalary}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          DELETE CONFIRMATION
      ========================= */}
      {deleteTarget && (
        <div className="dpl-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="dpl-modal dpl-modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 className="dpl-modal-title-center">Delete Delivery Partner?</h2>
            <p className="dpl-confirm-text">This action cannot be undone.</p>

            <div className="dpl-modal-buttons">
              <button className="dpl-btn dpl-btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="dpl-btn dpl-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          BLOCK / UNBLOCK CONFIRMATION
      ========================= */}
      {blockTarget && (
        <div className="dpl-overlay" onClick={() => setBlockTarget(null)}>
          <div className="dpl-modal dpl-modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 className="dpl-modal-title-center">
              {blockTarget.isBlocked ? "Unblock this partner?" : "Block this partner?"}
            </h2>
            <p className="dpl-confirm-text">
              {blockTarget.isBlocked
                ? "They will regain access to the delivery app."
                : "They will lose access to the delivery app until unblocked."}
            </p>

            <div className="dpl-modal-buttons">
              <button className="dpl-btn dpl-btn-ghost" onClick={() => setBlockTarget(null)}>
                Cancel
              </button>
              <button
                className={
                  blockTarget.isBlocked ? "dpl-btn dpl-btn-success" : "dpl-btn dpl-btn-danger"
                }
                onClick={confirmToggleBlock}
              >
                {blockTarget.isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          IMAGE PREVIEW
      ========================= */}
      {previewImage && (
        <div className="dpl-overlay dpl-preview-overlay" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="dpl-preview-img" />
        </div>
      )}
    </AdminLayout>
  );
}