import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUser,
  FaEdit,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

import "../styles/deliveryprofile.css";

const DeliveryProfile = () => {
  const [partner, setPartner] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newPincode, setNewPincode] = useState("");
  const [salary, setSalary] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    pincode: [],
  });

  // =====================================================
  // FETCH PROFILE + SALARY
  // =====================================================

  useEffect(() => {
    fetchProfile();
    fetchSalary();
  }, []);

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");

      const { data } = await axios.get(
        "http://localhost:4000/api/delivery/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profile = data.partner;

      // -------------------------------------------------
      // Convert old single pincode string into array
      // -------------------------------------------------

      const pincodeArray = Array.isArray(profile?.pincode)
        ? profile.pincode
        : profile?.pincode
          ? [String(profile.pincode)]
          : [];

      setPartner({
        ...profile,
        pincode: pincodeArray,
      });

      setFormData({
        name: profile?.name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        vehicleNumber: profile?.vehicleNumber || "",
        pincode: pincodeArray,
      });
    } catch (error) {
      console.log("Profile fetch error:", error);
    }
  };

  // =====================================================
  // FETCH SALARY
  // =====================================================

  const fetchSalary = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");

      const { data } = await axios.get(
        "http://localhost:4000/api/salary/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSalary(data.currentSalary);
    } catch (error) {
      console.log("Salary fetch error:", error);
    }
  };

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // ADD PINCODE
  // =====================================================

  const handleAddPincode = () => {
    const pin = newPincode.trim();

    // Validate 6 digit Indian pincode
    if (!/^\d{6}$/.test(pin)) {
      alert("Please enter a valid 6 digit pincode.");
      return;
    }

    // Prevent duplicate
    if (formData.pincode.includes(pin)) {
      alert("This pincode is already added.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pincode: [...prev.pincode, pin],
    }));

    setNewPincode("");
  };

  // =====================================================
  // ENTER KEY -> ADD PINCODE
  // =====================================================

  const handlePincodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPincode();
    }
  };

  // =====================================================
  // REMOVE PINCODE
  // =====================================================

  const handleRemovePincode = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      pincode: prev.pincode.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  // =====================================================
  // HANDLE EDIT / CANCEL
  // =====================================================

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel editing
      const originalPincodes = Array.isArray(partner?.pincode)
        ? partner.pincode
        : partner?.pincode
          ? [String(partner.pincode)]
          : [];

      setFormData({
        name: partner?.name || "",
        email: partner?.email || "",
        phone: partner?.phone || "",
        vehicleNumber: partner?.vehicleNumber || "",
        pincode: originalPincodes,
      });

      setNewPincode("");
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicleNumber: formData.vehicleNumber,
        pincode: formData.pincode,
      };

      const { data } = await axios.put(
        "http://localhost:4000/api/delivery/profile",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedPartner = data.partner;

      const updatedPincodes = Array.isArray(
        updatedPartner?.pincode
      )
        ? updatedPartner.pincode
        : updatedPartner?.pincode
          ? [String(updatedPartner.pincode)]
          : [];

      setPartner({
        ...updatedPartner,
        pincode: updatedPincodes,
      });

      setFormData({
        name: updatedPartner?.name || "",
        email: updatedPartner?.email || "",
        phone: updatedPartner?.phone || "",
        vehicleNumber:
          updatedPartner?.vehicleNumber || "",
        pincode: updatedPincodes,
      });

      setNewPincode("");
      setEditMode(false);

      alert("Profile Updated Successfully");
    } catch (error) {
      console.log("Profile update error:", error);

      alert(
        error?.response?.data?.message ||
          "Profile Update Failed"
      );
    }
  };

  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  const profileImage = partner?.photo
    ? `http://localhost:4000/uploads/${partner.photo}`
    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  // =====================================================
  // DISPLAY PINCODES
  // =====================================================

  const displayPincodes = Array.isArray(partner?.pincode)
    ? partner.pincode
    : partner?.pincode
      ? [String(partner.pincode)]
      : [];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dn2-page-wrap">

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="delivery-profile-main">

        {/* =================================================
            NAVBAR
        ================================================= */}

        <div className="delivery-profile-navbar">
          <h2>Delivery Partner Profile</h2>
        </div>

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <div className="delivery-profile-card">

          {/* HEADER */}

          <div className="delivery-profile-card-header">

            <div className="delivery-profile-title">
              <FaUser />
              <h3>Profile</h3>
            </div>

            <button
              type="button"
              className="delivery-profile-edit-btn"
              onClick={handleEditToggle}
            >
              <FaEdit />

              {editMode ? "Cancel" : "Edit"}
            </button>

          </div>

          {/* =================================================
              BODY
          ================================================= */}

          <div className="delivery-profile-body">

            {/* =================================================
                LEFT
            ================================================= */}

            <div className="delivery-profile-left">

              <img
                src={profileImage}
                alt="profile"
                className="delivery-profile-image"
              />

              {editMode ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="delivery-profile-input"
                  placeholder="Enter name"
                />
              ) : (
                <h3 className="delivery-profile-name">
                  {partner?.name || "-"}
                </h3>
              )}

            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="delivery-profile-right">

              {/* =================================================
                  PHONE
              ================================================= */}

              <div className="delivery-profile-row">

                <span className="delivery-profile-label">
                  Mobile Number
                </span>

                {editMode ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="delivery-profile-input"
                  />
                ) : (
                  <p className="delivery-profile-value">
                    {partner?.phone || "-"}
                  </p>
                )}

              </div>

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div className="delivery-profile-row">

                <span className="delivery-profile-label">
                  Email ID
                </span>

                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="delivery-profile-input"
                  />
                ) : (
                  <p className="delivery-profile-value">
                    {partner?.email || "-"}
                  </p>
                )}

              </div>

              {/* =================================================
                  AADHAR
              ================================================= */}

              <div className="delivery-profile-row">

                <span className="delivery-profile-label">
                  Aadhar Number
                </span>

                <p className="delivery-profile-value">
                  {partner?.aadharNumber || "-"}
                </p>

              </div>

              {/* =================================================
                  VEHICLE NUMBER
              ================================================= */}

              <div className="delivery-profile-row">

                <span className="delivery-profile-label">
                  Vehicle Number
                </span>

                {editMode ? (
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    className="delivery-profile-input"
                  />
                ) : (
                  <p className="delivery-profile-value">
                    {partner?.vehicleNumber || "-"}
                  </p>
                )}

              </div>

              {/* =================================================
                  REGISTERED DATE
              ================================================= */}

              <div className="delivery-profile-row">

                <span className="delivery-profile-label">
                  Registered On
                </span>

                <p className="delivery-profile-value">

                  {partner?.createdAt
                    ? new Date(
                        partner.createdAt
                      ).toLocaleDateString()
                    : "-"}

                </p>

              </div>

              {/* =================================================
                  MULTIPLE PINCODES
              ================================================= */}

              <div className="delivery-profile-row">

                <span className="delivery-profile-label">
                  Delivery Pincodes
                </span>

                <div className="delivery-pincode-section">

                  {/* ===============================
                      EDIT MODE
                  =============================== */}

                  {editMode ? (
                    <>

                      {/* EXISTING PINCODES */}

                      <div className="delivery-pincode-list">

                        {formData.pincode.length > 0 ? (
                          formData.pincode.map(
                            (pin, index) => (
                              <div
                                key={`${pin}-${index}`}
                                className="delivery-pincode-item"
                              >

                                <span>
                                  {pin}
                                </span>

                                <button
                                  type="button"
                                  className="delivery-pincode-remove"
                                  onClick={() =>
                                    handleRemovePincode(
                                      index
                                    )
                                  }
                                  title="Remove pincode"
                                >
                                  <FaTimes />
                                </button>

                              </div>
                            )
                          )
                        ) : (
                          <span className="delivery-pincode-empty">
                            No pincodes added
                          </span>
                        )}

                      </div>

                      {/* ADD PINCODE */}

                      <div className="delivery-pincode-add">

                        <input
                          type="text"
                          value={newPincode}
                          onChange={(e) => {
                            const value =
                              e.target.value.replace(
                                /\D/g,
                                ""
                              );

                            if (value.length <= 6) {
                              setNewPincode(value);
                            }
                          }}
                          onKeyDown={
                            handlePincodeKeyDown
                          }
                          placeholder="Enter 6 digit pincode"
                          maxLength={6}
                          className="delivery-profile-input"
                        />

                        <button
                          type="button"
                          className="delivery-pincode-add-btn"
                          onClick={
                            handleAddPincode
                          }
                        >
                          <FaPlus />
                          Add
                        </button>

                      </div>

                      <small className="delivery-pincode-help">
                        Enter pincode and press Enter
                        or click Add.
                      </small>

                    </>
                  ) : (

                    /* ===============================
                       VIEW MODE
                    =============================== */

                    <div className="delivery-pincode-list">

                      {displayPincodes.length > 0 ? (
                        displayPincodes.map(
                          (pin, index) => (
                            <span
                              key={`${pin}-${index}`}
                              className="delivery-pincode-badge"
                            >
                              {pin}
                            </span>
                          )
                        )
                      ) : (
                        <span className="delivery-profile-value">
                          -
                        </span>
                      )}

                    </div>

                  )}

                </div>

              </div>

              {/* =================================================
                  SAVE BUTTON
              ================================================= */}

              {editMode && (
                <div className="delivery-profile-save-wrapper">

                  <button
                    type="button"
                    className="delivery-profile-save-btn"
                    onClick={handleUpdate}
                  >
                    Save Changes
                  </button>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            BOTTOM CARDS
        ================================================= */}

        <div className="delivery-profile-bottom">

          {/* =================================================
              RECENT PROFILE UPDATE
          ================================================= */}

          <div className="delivery-profile-info-card">

            <h3>
              Recent Profile Update
            </h3>

            <p className="delivery-profile-update-text">
              <strong>Phone :</strong>{" "}
              {partner?.phone || "-"}
            </p>

            <p className="delivery-profile-update-text">
              <strong>Email :</strong>{" "}
              {partner?.email || "-"}
            </p>

            <p className="delivery-profile-update-text">
              <strong>Pincodes :</strong>{" "}
              {displayPincodes.length > 0
                ? displayPincodes.join(", ")
                : "-"}
            </p>

          </div>

          {/* =================================================
              RECENT SALARY DETAILS
          ================================================= */}

          <div className="delivery-profile-info-card">

            <h3>
              Recent Salary Details
            </h3>

            <p className="delivery-profile-update-text">

              <strong>
                Month :
              </strong>{" "}

              {salary
                ? new Date(
                    salary.year,
                    salary.month - 1
                  ).toLocaleString(
                    "default",
                    {
                      month: "long",
                    }
                  )
                : "-"}

            </p>

            <p className="delivery-profile-update-text">

              <strong>
                Salary :
              </strong>{" "}

              ₹{salary?.totalSalary || 0}

            </p>

            <p className="delivery-profile-update-text">

              <strong>
                Status :
              </strong>{" "}

              <span
                style={{
                  color:
                    salary?.paymentStatus ===
                    "Paid"
                      ? "green"
                      : "orange",
                  fontWeight: "600",
                }}
              >
                {salary?.paymentStatus ||
                  "Pending"}
              </span>

            </p>

            <p className="delivery-profile-update-text">

              <strong>
                Paid Date :
              </strong>{" "}

              {salary?.paidDate
                ? new Date(
                    salary.paidDate
                  ).toLocaleDateString()
                : "-"}

            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default DeliveryProfile;
