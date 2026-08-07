import React, { useState } from "react";
import axios from "axios";
import Select from "react-select";
import {
  useParams,
  useNavigate,
} from "react-router-dom";

import { toast } from "react-toastify";

import "../styles/return.css";

export default function ReturnProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const reasonOptions = [
    {
      value: "Damaged Product",
      label: "Damaged Product",
    },
    {
      value: "Wrong Product",
      label: "Wrong Product",
    },
    {
      value: "Quality Issue",
      label: "Quality Issue",
    },
    {
      value: "Received Late",
      label: "Received Late",
    },
    {
      value: "Changed My Mind",
      label: "Changed My Mind",
    },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(
        "Please select return reason"
      );
      return;
    }

    const token =
      localStorage.getItem("token");

    try {
      setLoading(true);

      const res = await axios.put(
        `http://localhost:4000/api/orders/return/${id}`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        res.data.message ||
          "Return request submitted"
      );

      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    } catch (error) {
      console.log(
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Return request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gf-return-page">
      <div className="gf-return-card">
        <div className="gf-return-top">
          <h2>Return Product</h2>

          <p>
            Select the reason for
            returning this product
          </p>
        </div>

        <div className="gf-return-field">
          <label>
            Return Reason
          </label>

          <Select
            options={reasonOptions}
            placeholder="Select Reason"
            value={reasonOptions.find(
              (option) =>
                option.value === reason
            )}
            onChange={(selectedOption) =>
              setReason(
                selectedOption?.value || ""
              )
            }
            isSearchable={false}
            className="return-react-select"
            classNamePrefix="return-select"
          />
        </div>

        <button
          className="gf-return-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Submitting..."
            : "Submit Return"}
        </button>
      </div>
    </div>
  );
}