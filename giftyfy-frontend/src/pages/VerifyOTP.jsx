import React, { useState } from "react";
import axios from "axios";
import "../styles/VerifyOTP.css";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");

  const phone = new URLSearchParams(window.location.search).get("phone");

  const verifyHandler = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/users/verify-otp",
        { phone, otp }
      );

      alert(res.data.message);
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid OTP");
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
        <div className="otp-icon">🔐</div>

        <h2 className="otp-title">Verify OTP</h2>

        <p className="otp-subtitle">
          Enter the verification code sent to
          <br />
          <strong>{phone}</strong>
        </p>

        <input
          type="text"
          maxLength="6"
          className="otp-input"
          placeholder="Enter 6 Digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          className="otp-btn"
          onClick={verifyHandler}
        >
          Verify OTP
        </button>

        <p className="otp-footer">
          Didn't receive OTP? <span>Resend</span>
        </p>
      </div>
    </div>
  );
}