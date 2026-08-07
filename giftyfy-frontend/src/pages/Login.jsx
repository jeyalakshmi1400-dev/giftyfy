import React, { useState } from "react";
import "../styles/Login.css";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const submitHandler = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post(
      "http://localhost:4000/api/users/login",
      { email, password }
    );

    alert(res.data.message);

    // ✅ token save
    localStorage.setItem("token", res.data.token);

    // ✅ userId save (THIS IS MISSING NOW)
    localStorage.setItem("userId", res.data.user._id);

    navigate("/");
  } catch (error) {

  const message =
    error.response?.data?.message;

  if (
    message ===
    "Please verify OTP first"
  ) {

    alert(
      "Please verify OTP first"
    );

    navigate(
      `/verify-otp?email=${email}`
    );

    return;
  }

  alert(message || "Login Failed");
}
};

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <div className="login-card shadow-lg p-4">
        
        <h2 className="text-center brand-title mb-2">GIFTYFY</h2>
        <p className="text-center text-muted mb-4">Welcome Back 🎁</p>

        <form onSubmit={submitHandler}>

          <div className="mb-3 input-group">
            <span className="input-group-text bg-purple text-white">
              <FaEnvelope />
            </span>
            <input
              type="email"
              className="form-control"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 input-group">
            <span className="input-group-text bg-purple text-white">
              <FaLock />
            </span>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-purple">
              Login
            </button>
          </div>

          <p className="text-center mt-3 small">
            Don't have an account?{" "}
            <Link to="/register" className="register-link">
              Register
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Login;