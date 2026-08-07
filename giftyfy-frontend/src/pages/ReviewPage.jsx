import React, { useState } from "react";
import axios from "axios";
import {
  useParams,
  useNavigate
} from "react-router-dom";

import {
  FaArrowLeft,
  FaStar
} from "react-icons/fa";

import { toast } from "react-toastify";

import "../styles/reviewpage.css";
import Select from "react-select";

export default function ReviewPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const token =
    localStorage.getItem("token");

  // =========================
  // SUBMIT REVIEW
  // =========================
  const submitReview = async () => {

    try {

      if (!comment.trim()) {

        toast.error(
          "Please enter review"
        );

        return;

      }

      setLoading(true);

      await axios.post(

        `http://localhost:4000/api/orders/review/${id}`,

        {
          rating,
          comment,
        },

        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }

      );

      toast.success(
        "Review submitted successfully"
      );

      // ✅ BACK TO ORDERS
      setTimeout(() => {

        navigate("/orders");

      }, 1500);

    } catch (err) {

      console.log(
        err.response?.data
      );

      toast.error(
        err.response?.data?.message ||
        "Review submission failed"
      );

    } finally {

      setLoading(false);

    }

  };
  const ratingOptions = [
  { value: 5, label: "⭐⭐⭐⭐⭐ 5 Star" },
  { value: 4, label: "⭐⭐⭐⭐ 4 Star" },
  { value: 3, label: "⭐⭐⭐ 3 Star" },
  { value: 2, label: "⭐⭐ 2 Star" },
  { value: 1, label: "⭐ 1 Star" },
];

  return (

    <div className="gf-review-page">

      <div className="gf-review-card">

        {/* BACK */}
        <button
          className="gf-review-backbtn"
          onClick={() =>
            navigate("/orders")
          }
        >

          <FaArrowLeft />

          Back to Orders

        </button>

        {/* TITLE */}
        <div className="gf-review-top">

          <h2>
            Write a Review
          </h2>

          <p>
            Share your experience about
            this product
          </p>

        </div>

        {/* RATING */}
        <div className="gf-review-field">

          <label>
            Rating
          </label>

<div className="gf-review-ratingbox">

  <FaStar />

  <Select
    options={ratingOptions}
    isSearchable={false}
    className="gf-rating-select"
    classNamePrefix="gf-rating"
    value={ratingOptions.find(
      (item) => item.value === rating
    )}
    onChange={(selectedOption) =>
      setRating(selectedOption.value)
    }
  />

</div>

        </div>

        {/* COMMENT */}
        <div className="gf-review-field">

          <label>
            Your Review
          </label>

          <textarea
            placeholder="Write your review..."
            value={comment}
            onChange={(e) =>
              setComment(
                e.target.value
              )
            }
          />

        </div>

        {/* BUTTON */}
        <button
          className="gf-review-submitbtn"
          onClick={submitReview}
          disabled={loading}
        >

          {
            loading
              ? "Submitting..."
              : "Submit Review"
          }

        </button>

      </div>

    </div>

  );

}