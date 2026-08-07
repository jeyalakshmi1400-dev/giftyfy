import React, { useState } from "react";
import { FaUser, FaPhone, FaEnvelope, FaLock } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/register.css";
import axios from "axios";

const Register = () => {

  const [step, setStep] = useState(1); // 🔥 NEW

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState(""); // 🔥 NEW

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================= REGISTER =================
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:4000/api/users/register",
        formData
      );

      alert(res.data.message);

      // 🔥 show OTP box in SAME PAGE
      setStep(2);

    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed");
    }
  };

  // ================= VERIFY OTP =================
  const verifyOtp = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:4000/api/users/verify-otp",
        {
          email: formData.email,
          otp,
        }
      );

      alert(res.data.message);

      window.location.href = "/login";

    } catch (err) {
      alert(err.response?.data?.msg || "OTP Failed");
    }
  };

  return (
    <div className="register-wrapper d-flex align-items-center justify-content-center">
      <div className="register-box shadow">

        <h2 className="text-center brand mb-2">GIFTYFY 🎁</h2>

        {/* ================= REGISTER FORM ================= */}
        {step === 1 && (
          <form onSubmit={submitHandler}>

            <div className="form-group-custom">
              <FaUser className="form-icon" />
              <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
            </div>

            <div className="form-group-custom">
              <FaPhone className="form-icon" />
              <input type="tel" name="phone" placeholder="Mobile Number" onChange={handleChange} required />
            </div>

            <div className="form-group-custom">
              <FaEnvelope className="form-icon" />
              <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
            </div>

            <div className="form-group-custom">
              <FaLock className="form-icon" />
              <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
            </div>

            <button type="submit" className="register-btn">
              Create Account
            </button>

          </form>
        )}

        {/* ================= OTP FORM ================= */}
        {step === 2 && (
          <form onSubmit={verifyOtp}>

            <p className="otp-text">
              OTP sent to your Email 📧
            </p>

            <input
              type="text"
              className="otp-input"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={4}
              required
            />

            <button type="submit" className="register-btn">
              Verify OTP
            </button>

          </form>
        )}

        <p className="text-center mt-3 small">
          Already have an account?{" "}
          <Link to="/login" className="login-link">Login</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;