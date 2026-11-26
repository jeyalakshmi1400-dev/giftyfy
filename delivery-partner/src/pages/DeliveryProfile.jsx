import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FaUser,
  FaEdit,
  FaPlus,
  FaTimes,
  FaCamera,
} from "react-icons/fa";

import "../styles/deliveryprofile.css";

// Local development uses localhost; deployed builds use the Render backend.
const API_BASE_URL = import.meta.env.DEV
  ? "https://giftyfy-backend.onrender.com"
  : "https://giftyfy-backend.onrender.com";

const DEFAULT_PROFILE_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const DeliveryProfile = () => {
  const [partner, setPartner] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newPincode, setNewPincode] = useState("");
  const [salary, setSalary] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef(null);

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
        `${API_BASE_URL}/api/delivery/profile`,
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
        `${API_BASE_URL}/api/salary/my`,
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
      setPhotoFile(null);
      setPhotoPreview("");
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  // =====================================================
  // SELECT PROFILE PHOTO
  // =====================================================

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(String(reader.result || ""));
    };
    reader.onerror = () => {
      alert("Could not preview this image. Please select it again.");
      setPhotoFile(null);
      setPhotoPreview("");
    };
    reader.readAsDataURL(file);
  };

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");
      if (!token) {
        alert("Please login again.");
        return;
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };

      // Save the normal profile fields as JSON. This keeps the pincode
      // array in the format already expected by the backend controller.
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicleNumber: formData.vehicleNumber,
        pincode: formData.pincode,
      };

      const { data: profileResponse } = await axios.put(
        `${API_BASE_URL}/api/delivery/profile`,
        payload,
        { headers: authHeaders }
      );

      let updatedPartner = profileResponse.partner;

      // Upload the photo separately as multipart/form-data. The backend
      // route uses upload.deliveryProfile.single("photo") and stores
      // req.file.path (the Cloudinary URL) in partner.photo.
      if (photoFile) {
        const imageFormData = new FormData();
        imageFormData.append("photo", photoFile);

        const { data: photoResponse } = await axios.put(
          `${API_BASE_URL}/api/delivery/profile`,
          imageFormData,
          {
            headers: authHeaders,
          }
        );

        updatedPartner = photoResponse.partner || updatedPartner;
      }

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
        vehicleNumber: updatedPartner?.vehicleNumber || "",
        pincode: updatedPincodes,
      });

      setNewPincode("");
      setPhotoFile(null);
      setPhotoPreview("");
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      setEditMode(false);

      alert(
        photoFile
          ? "Profile and photo updated successfully."
          : "Profile Updated Successfully"
      );
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

  const profileImage = photoPreview || (
    partner?.photo
      ? /^https?:\/\//i.test(partner.photo)
        ? partner.photo
        : `${API_BASE_URL}/uploads/${encodeURIComponent(partner.photo)}`
      : DEFAULT_PROFILE_IMAGE
  );
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
                alt="Delivery partner profile"
                className="delivery-profile-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                }}
              />

              {editMode && (
                <div
                  className="delivery-profile-photo-controls"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      padding: "8px 13px",
                      border: "1px solid #d0d5dd",
                      borderRadius: "7px",
                      background: "#ffffff",
                      color: "#344054",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <FaCamera />
                    Change Photo
                  </button>

                  {photoFile && (
                    <small style={{ maxWidth: "190px", textAlign: "center", overflowWrap: "anywhere" }}>
                      {photoFile.name}
                    </small>
                  )}
                </div>
              )}

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
