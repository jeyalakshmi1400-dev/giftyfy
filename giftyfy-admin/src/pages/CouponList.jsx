import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/couponList.css";
import AdminLayout from "../layout/AdminLayout";

export default function CouponList() {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

const fetchCoupons = async () => {
  try {
    const res = await axios.get("http://localhost:4000/api/coupons");

    console.log("Coupons API Response:", res.data);

    setCoupons(res.data.coupons || []);
  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {
    fetchCoupons();
  }, []);

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;

    try {
      await axios.delete(`http://localhost:4000/api/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      console.log(err);
    }
  };

  const toggleActive = async (id) => {
    try {
      await axios.put(`http://localhost:4000/api/coupons/toggle/${id}`);
      fetchCoupons();
    } catch (err) {
      console.log(err);
    }
  };

const handleEdit = (coupon) => {
  navigate(`/admin/create-coupon/${coupon._id}`);
};

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const text = (
        coupon.code +
        " " +
        (coupon.description || "")
      ).toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [coupons, search]);
 const amountCoupons = useMemo(() => {
  return filteredCoupons.filter(
    (c) => !c.categories || c.categories.length === 0
  );
}, [filteredCoupons]);

const categoryCoupons = useMemo(() => {
  return filteredCoupons.filter(
    (c) => c.categories && c.categories.length > 0
  );
}, [filteredCoupons]);


  const total = coupons.length;
  const active = coupons.filter((c) => c.isActive).length;
  const blocked = coupons.filter((c) => !c.isActive).length;

  return (
  <AdminLayout>
  <div className="couponList-content">

    {/* Header */}

    <div className="coupon-header">

      <div>
        <h1 className="couponList-title">
          Coupon Management
        </h1>

        <p className="coupon-subtitle">
          Create and manage all coupons
        </p>
      </div>

      <div className="coupon-header-right">

        <input
          type="text"
          className="coupon-search"
          placeholder="Search coupon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="create-btn"
          onClick={() => navigate("/admin/create-coupon")}
        >
          + Create Coupon
        </button>

      </div>

    </div>

    {/* Stats */}

    <div className="couponList-stats">

      <div className="stat-card total">
        <h4>Total Coupons</h4>
        <h2>{total}</h2>
      </div>

      <div className="stat-card active">
        <h4>Active</h4>
        <h2>{active}</h2>
      </div>

      <div className="stat-card blocked">
        <h4>Blocked</h4>
        <h2>{blocked}</h2>
      </div>

    </div>

    {/* Amount Coupon Table */}

    <h2 className="table-heading">Amount Coupons</h2>

    <div className="coupon-table">

      {amountCoupons.length === 0 ? (

        <div className="empty-state">
          <h3>No Amount Coupons</h3>
          <p>Create your first coupon.</p>
        </div>

      ) : (

        <table className="coupon-table-ui">

          <thead>
            <tr>
              <th>Coupon</th>
              <th>Description</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Categories</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {amountCoupons.map((c) => (

              <tr key={c._id}>

                <td className="coupon-code">{c.code}</td>

                <td className="desc">
                  {c.description || "No description"}
                </td>

                <td>
                  <span className="discount-badge">
                    {c.discountType === "percentage"
                      ? `${c.discountValue}% OFF`
                      : `₹${c.discountValue} OFF`}
                  </span>
                </td>

                <td>₹{c.minOrderAmount}</td>

                <td>
                  <div className="category-container">
                    {c.categories?.length ? (
                      c.categories.map((cat) => (
                        <span
                          key={cat._id}
                          className="category-chip"
                        >
                          {cat.category}
                        </span>
                      ))
                    ) : (
                      <span className="category-chip">
                        All Categories
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  {c.expiryDate
                    ? new Date(c.expiryDate).toLocaleDateString()
                    : "No Limit"}
                </td>

                <td>
                  <button
                    className={`status-pill ${
                      c.isActive ? "active" : "blocked"
                    }`}
                    onClick={() => toggleActive(c._id)}
                  >
                    {c.isActive ? "Active" : "Blocked"}
                  </button>
                </td>

                <td>

                  <div className="action-btns">

                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(c)}
                    >
                      ✏ Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteCoupon(c._id)}
                    >
                      🗑 Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

    {/* Category Coupon Table */}

    <h2 className="table-heading">Category Coupons</h2>

    <div className="coupon-table">

      {categoryCoupons.length === 0 ? (

        <div className="empty-state">
          <h3>No Category Coupons</h3>
        </div>

      ) : (

        <table className="coupon-table-ui">

          <thead>

            <tr>
              <th>Coupon</th>
              <th>Category</th>
              <th>Discount</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            {categoryCoupons.map((c) => (

              <tr key={c._id}>

                <td className="coupon-code">
                  {c.code}
                </td>

                <td>

                  <div className="category-container">

                    {c.categories?.map((cat) => (

                      <span
                        key={cat._id}
                        className="category-chip"
                      >
                        {cat.category}
                      </span>

                    ))}

                  </div>

                </td>

                <td>

                  <span className="discount-badge">
                    {c.discountType === "percentage"
                      ? `${c.discountValue}% OFF`
                      : `₹${c.discountValue} OFF`}
                  </span>

                </td>

                <td>

                  {c.expiryDate
                    ? new Date(c.expiryDate).toLocaleDateString()
                    : "No Limit"}

                </td>

                <td>

                  <button
                    className={`status-pill ${
                      c.isActive ? "active" : "blocked"
                    }`}
                    onClick={() => toggleActive(c._id)}
                  >
                    {c.isActive ? "Active" : "Blocked"}
                  </button>

                </td>

                <td>

                  <div className="action-btns">

                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(c)}
                    >
                      ✏ Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteCoupon(c._id)}
                    >
                      🗑 Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  </div>
</AdminLayout>
  );
}