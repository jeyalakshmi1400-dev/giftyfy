import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/adminReviews.css";
import AdminLayout from "../layout/AdminLayout";

export default function AdminReviews() {

  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
const reviewsPerPage = 10;

  const fetchReviews = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:4000/api/reviews/admin",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviews(res.data || []);

    } catch (err) {

      console.log(
        err.response?.data || err.message
      );

    }

  };

  useEffect(() => {

    fetchReviews();

  }, []);

  const toggleBlock = async (id) => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.put(
  `http://localhost:4000/api/reviews/block/${id}`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);

fetchReviews(); // safe & simple

    // 🔥 instant UI update (no refetch lag)
    setReviews((prev) =>
      prev.map((r) =>
        r._id === id ? res.data : r
      )
    );

  } catch (err) {
    console.log(err.response?.data || err.message);
  }
};

const getProductImage = (product) => {

  if (!product) {
    return "https://via.placeholder.com/80";
  }

  // ✅ NORMAL IMAGE ARRAY
  if (
    Array.isArray(product.image) &&
    product.image.length > 0
  ) {

    return `http://localhost:4000/uploads/${product.image[0]}`;

  }

  // ✅ SINGLE IMAGE STRING
  if (
    typeof product.image === "string" &&
    product.image
  ) {

    return `http://localhost:4000/uploads/${product.image}`;

  }

  // ✅ VARIANT PRODUCT IMAGE
  if (
    Array.isArray(product.variants) &&
    product.variants.length > 0
  ) {

    // 🔥 FIND FIRST VARIANT WITH IMAGE
    const variantWithImage =
      product.variants.find(
        (variant) =>
          Array.isArray(variant.images) &&
          variant.images.length > 0
      );

    if (variantWithImage) {

      return `http://localhost:4000/uploads/${variantWithImage.images[0]}`;

    }

  }

  // ✅ FALLBACK
  return "https://via.placeholder.com/80";

};


// Pagination
const totalPages = Math.ceil(
  reviews.length / reviewsPerPage
);

const indexOfLastReview =
  currentPage * reviewsPerPage;

const indexOfFirstReview =
  indexOfLastReview - reviewsPerPage;

const currentReviews = reviews.slice(
  indexOfFirstReview,
  indexOfLastReview
);
  return (

  <AdminLayout>
      {/* CONTENT */}
      <div className="admin-review-content">

        <h2 className="admin-review-title">
          Customer Reviews
        </h2>

        <div className="admin-review-table-wrapper">

          <table className="admin-review-table">

            <thead>

              <tr>

                <th>User</th>

                <th>Product</th>

                <th>Rating</th>

                <th>Review</th>

                <th>Date</th>

                <th>Status</th>

                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {currentReviews.map((review) => (

                <tr key={review._id}>

                  <td>

  <p>
    <b>Name:</b>
    {" "}
    {review.user?.name}
  </p>

  <p>
    <b>Email:</b>
    {" "}
    {review.user?.email}
  </p>

  <p>
    <b>Phone:</b>
    {" "}
    {review.user?.phone}
  </p>

</td>

                  <td>

                    <div className="admin-review-product">
<img
  src={getProductImage(review.product)}
  alt="product"
  className="admin-review-product-img"
/>

                      <span>
                        {review.product?.name}
                      </span>

                    </div>

                  </td>

                  <td>
                    ⭐ {review.rating}
                  </td>

                  <td className="admin-review-comment">
                    {review.comment}
                  </td>

                  <td>

                    {new Date(
                      review.createdAt
                    ).toLocaleDateString()}

                  </td>

                  <td>

                    {review.isBlocked ? (

                      <span className="admin-review-blocked">

                        Blocked

                      </span>

                    ) : (

                      <span className="admin-review-active">

                        Active

                      </span>

                    )}

                  </td>

                  <td>

                    <button
                      className={
                        review.isBlocked
                          ? "admin-review-unblock-btn"
                          : "admin-review-block-btn"
                      }
                      onClick={() =>
                        toggleBlock(review._id)
                      }
                    >

                      {review.isBlocked
                        ? "Unblock"
                        : "Block"}

                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          <div className="admin-review-pagination-wrapper">

  <div className="admin-review-pagination-info">
    Showing {reviews.length === 0 ? 0 : indexOfFirstReview + 1}
    -
    {Math.min(indexOfLastReview, reviews.length)}
    of {reviews.length} Reviews
  </div>

  <div className="admin-review-pagination">

    <button
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage((prev) => prev - 1)
      }
    >
      Prev
    </button>

    {[...Array(totalPages)].map((_, index) => (
      <button
        key={index}
        className={
          currentPage === index + 1
            ? "active-page"
            : ""
        }
        onClick={() =>
          setCurrentPage(index + 1)
        }
      >
        {index + 1}
      </button>
    ))}

    <button
      disabled={currentPage === totalPages}
      onClick={() =>
        setCurrentPage((prev) => prev + 1)
      }
    >
      Next
    </button>

  </div>

</div>
        </div>

      </div>

    </AdminLayout>

  );

}