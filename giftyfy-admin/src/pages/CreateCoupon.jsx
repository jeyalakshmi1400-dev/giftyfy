import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/createCoupon.css";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";

export default function CreateCoupon() {

  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    expiryDate: "",
    firstOrderOnly: false,
    description: "",
    categories: []
  });

  const [categories, setCategories] = useState([]);
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // ✅ FETCH SINGLE COUPON (EDIT MODE)
  useEffect(() => {
    if (isEdit) {
      axios
        .get("http://localhost:4000/api/coupons")
        .then((res) => {
          const coupon = res.data.coupons.find((c) => c._id === id);

          if (coupon) {
            setForm({
              code: coupon.code || "",
              discountType: coupon.discountType || "percentage",
              discountValue: coupon.discountValue || "",
              minOrderAmount: coupon.minOrderAmount || "",
              expiryDate: coupon.expiryDate
                ? coupon.expiryDate.slice(0, 10)
                : "",
              firstOrderOnly: coupon.firstOrderOnly || false,
              description: coupon.description || "",

              // ⭐ முக்கியம்
              categories: coupon.categories
                ? coupon.categories.map((cat) => cat._id)
                : [],
            });
          }
        })
        .catch(console.log);
    }
  }, [id, isEdit]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/categories")
      .then((res) => {
        console.log("Category Response:", res.data);
        setCategories(res.data);   // ✅ direct array
      })
      .catch((err) => console.log(err));
  }, []);

  const uniqueCategories = [
    ...new Map(
      categories.map((item) => [item.category, item])
    ).values(),
  ];

  // ✅ SUBMIT (CREATE + UPDATE)
  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        // 🔥 UPDATE
        await axios.put(
          `http://localhost:4000/api/coupons/update/${id}`,
          form
        );

        alert("Coupon Updated ✅");

        navigate("/admin/coupons");

      } else {
        // 🔥 CREATE
        await axios.post(
          "http://localhost:4000/api/coupons/add",
          form
        );

        alert("Coupon Created ✅");

        // reset form only for create
        setForm({
          code: "",
          discountType: "percentage",
          discountValue: "",
          minOrderAmount: "",
          expiryDate: "",
          firstOrderOnly: false,
          description: "",
          categories: []
        });
      }

    } catch (err) {
      console.log(err);
      console.log(err.response?.data);

      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <AdminLayout>

      <div className="createCoupon-content">

        <div className="createCoupon-card">

          <div className="createCoupon-header">
            <span className="createCoupon-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 8.5C3 7.67157 3.67157 7 4.5 7H8.17157C8.70201 7 9.21071 6.78929 9.58579 6.41421L11.2929 4.70711C11.6834 4.31658 12.3166 4.31658 12.7071 4.70711L14.4142 6.41421C14.7893 6.78929 15.298 7 15.8284 7H19.5C20.3284 7 21 7.67157 21 8.5V10C19.8954 10 19 10.8954 19 12C19 13.1046 19.8954 14 21 14V15.5C21 16.3284 20.3284 17 19.5 17H15.8284C15.298 17 14.7893 17.2107 14.4142 17.5858L12.7071 19.2929C12.3166 19.6834 11.6834 19.6834 11.2929 19.2929L9.58579 17.5858C9.21071 17.2107 8.70201 17 8.17157 17H4.5C3.67157 17 3 16.3284 3 15.5V14C4.10457 14 5 13.1046 5 12C5 10.8954 4.10457 10 3 10V8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              </svg>
            </span>
            <div>
              <h1 className="createCoupon-title">
                {isEdit ? "Edit Coupon" : "Create Coupon"}
              </h1>
              <p className="createCoupon-subtitle">
                {isEdit
                  ? "Update the details of an existing coupon"
                  : "Set up a new discount coupon for your store"}
              </p>
            </div>
          </div>

          <form onSubmit={submitHandler} className="createCoupon-form">

            <div className="form-group">
              <label className="form-label" htmlFor="code">Coupon Code</label>
              <input
                id="code"
                className="createCoupon-input"
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discountType">Discount Type</label>
              <select
                id="discountType"
                className="createCoupon-select"
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discountValue">Discount Value</label>
              <input
                id="discountValue"
                className="createCoupon-input"
                type="number"
                placeholder="Enter discount"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="minOrderAmount">Minimum Order Amount</label>
              <input
                id="minOrderAmount"
                className="createCoupon-input"
                type="number"
                placeholder="Enter minimum order"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({ ...form, minOrderAmount: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expiryDate">Expiry Date</label>
              <input
                id="expiryDate"
                className="createCoupon-input"
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="firstOrderOnly">First Order Only</label>
              <label className="toggle-switch" htmlFor="firstOrderOnly">
                <input
                  id="firstOrderOnly"
                  type="checkbox"
                  checked={form.firstOrderOnly}
                  onChange={(e) =>
                    setForm({ ...form, firstOrderOnly: e.target.checked })
                  }
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-text">
                  {form.firstOrderOnly ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>

            <div className="form-group form-group-full">
              <label className="form-label" htmlFor="description">Coupon Description</label>
              <textarea
                id="description"
                className="createCoupon-textarea"
                placeholder="Add a short description for this coupon"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Applicable Categories</label>

              <div className="category-grid">
                {uniqueCategories.map((cat) => {
                  const checked = form.categories.includes(cat._id);
                  return (
                    <label
                      key={cat.category}
                      className={`category-pill${checked ? " category-pill-active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({
                              ...form,
                              categories: [...form.categories, cat._id],
                            });
                          } else {
                            setForm({
                              ...form,
                              categories: form.categories.filter(
                                (item) => item !== cat._id
                              ),
                            });
                          }
                        }}
                      />
                      <span>{cat.category}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group form-group-full">
              <button className="createCoupon-btn" type="submit">
                {isEdit ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>

          </form>

        </div>

      </div>

    </AdminLayout>
  );
}