import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import "../styles/adminSiteContent.css";

import AdminLayout
from "../layout/AdminLayout";

export default function AdminSiteContent() {

  const [formData, setFormData] =
    useState({
      companyName: "",
      aboutTitle: "",
      aboutDescription: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      instagram: "",
      facebook: "",
      whatsapp: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  // =========================
  // FETCH CONTENT
  // =========================
  const fetchContent = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:4000/api/site-content",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (res.data) {

        setFormData({
          companyName:
            res.data.companyName || "",

          aboutTitle:
            res.data.aboutTitle || "",

          aboutDescription:
            res.data.aboutDescription || "",

          contactEmail:
            res.data.contactEmail || "",

          contactPhone:
            res.data.contactPhone || "",

          contactAddress:
            res.data.contactAddress || "",

          instagram:
            res.data.instagram || "",

          facebook:
            res.data.facebook || "",

          whatsapp:
            res.data.whatsapp || "",
        });

      }

    } catch (err) {

      console.log(
        err.response?.data ||
        err.message
      );

    }

  };

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });

  };

  // =========================
  // UPDATE CONTENT
  // =========================
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      const token =
        localStorage.getItem("token");

      await axios.put(
        "http://localhost:4000/api/site-content",
        formData,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      alert(
        "Site Content Updated"
      );

      setIsEditing(false);

    } catch (err) {

      console.log(
        err.response?.data ||
        err.message
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <AdminLayout>

      <div className="admin-site-content">

        {/* HEADER */}
        <div className="admin-site-header">

          <div>

            <h2 className="admin-site-title">
              Site Content Management
            </h2>

            <p className="admin-site-subtitle">
              Manage website details,
              contact information and
              social media links.
            </p>

          </div>

        </div>

        {/* =========================
            VIEW MODE
        ========================= */}
        {!isEditing ? (

          <div className="admin-site-view">

            <div className="view-card">
              <h4>Company Name</h4>
              <p>
                {formData.companyName}
              </p>
            </div>

            <div className="view-card">
              <h4>About Title</h4>
              <p>
                {formData.aboutTitle}
              </p>
            </div>

            <div className="view-card">
              <h4>
                About Description
              </h4>
              <p>
                {
                  formData.aboutDescription
                }
              </p>
            </div>

            <div className="view-card">
              <h4>Contact Email</h4>
              <p>
                {
                  formData.contactEmail
                }
              </p>
            </div>

            <div className="view-card">
              <h4>Contact Phone</h4>
              <p>
                {
                  formData.contactPhone
                }
              </p>
            </div>

            <div className="view-card">
              <h4>
                Contact Address
              </h4>
              <p>
                {
                  formData.contactAddress
                }
              </p>
            </div>

            <div className="view-card">
              <h4>Instagram</h4>
              <p>
                {formData.instagram}
              </p>
            </div>

            <div className="view-card">
              <h4>Facebook</h4>
              <p>
                {formData.facebook}
              </p>
            </div>

            <div className="view-card">
              <h4>Whatsapp</h4>
              <p>
                {formData.whatsapp}
              </p>
            </div>

            <button
              type="button"
              className="admin-site-btn"
              onClick={() =>
                setIsEditing(true)
              }
            >
              Edit Content
            </button>

          </div>

        ) : (

          /* =========================
              EDIT MODE
          ========================= */
          <form
            className="admin-site-form"
            onSubmit={handleSubmit}
          >

            {/* COMPANY */}
            <div className="admin-site-card">

              <h3>
                Company Details
              </h3>

              <div className="admin-site-group">

                <label>
                  Company Name
                </label>

                <input
                  type="text"
                  name="companyName"
                  value={
                    formData.companyName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Company Name"
                />

              </div>

              <div className="admin-site-group">

                <label>
                  About Title
                </label>

                <input
                  type="text"
                  name="aboutTitle"
                  value={
                    formData.aboutTitle
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter About Title"
                />

              </div>

              <div className="admin-site-group">

                <label>
                  About Description
                </label>

                <textarea
                  name="aboutDescription"
                  value={
                    formData.aboutDescription
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter About Description"
                  rows="6"
                />

              </div>

            </div>

            {/* CONTACT */}
            <div className="admin-site-card">

              <h3>
                Contact Information
              </h3>

              <div className="admin-site-group">

                <label>
                  Contact Email
                </label>

                <input
                  type="email"
                  name="contactEmail"
                  value={
                    formData.contactEmail
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Email"
                />

              </div>

              <div className="admin-site-group">

                <label>
                  Contact Phone
                </label>

                <input
                  type="text"
                  name="contactPhone"
                  value={
                    formData.contactPhone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Phone Number"
                />

              </div>

              <div className="admin-site-group">

                <label>
                  Contact Address
                </label>

                <textarea
                  name="contactAddress"
                  value={
                    formData.contactAddress
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Address"
                  rows="4"
                />

              </div>

            </div>

            {/* SOCIAL */}
            <div className="admin-site-card">

              <h3>
                Social Media Links
              </h3>

              <div className="admin-site-group">

                <label>
                  Instagram Link
                </label>

                <input
                  type="text"
                  name="instagram"
                  value={
                    formData.instagram
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Instagram URL"
                />

              </div>

              <div className="admin-site-group">

                <label>
                  Facebook Link
                </label>

                <input
                  type="text"
                  name="facebook"
                  value={
                    formData.facebook
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Facebook URL"
                />

              </div>

              <div className="admin-site-group">

                <label>
                  Whatsapp Link
                </label>

                <input
                  type="text"
                  name="whatsapp"
                  value={
                    formData.whatsapp
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Whatsapp URL"
                />

              </div>

            </div>

            {/* BUTTONS */}
            <div className="admin-site-btns">

              <button
                type="submit"
                className="admin-site-btn"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : "Save Content"}
              </button>

              <button
                type="button"
                className="admin-site-cancel"
                onClick={() => {

                  setIsEditing(false);

                  fetchContent();

                }}
              >
                Cancel
              </button>

            </div>

          </form>

        )}

      </div>

    </AdminLayout>

  );
}