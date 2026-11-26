import React, { useState } from "react";
import "../styles/Login.css";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // INPUT CHANGE
  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(
        "https://giftyfy-backend.onrender.com/api/users/login",
        {
          email,
          password,
        }
      );

      // SAVE TOKEN
      localStorage.setItem("token", res.data.token);

      // SAVE USER ID
      localStorage.setItem("userId", res.data.user._id);

      // SUCCESS MESSAGE
      alert(res.data.message || "Login Successful!");

      // GET PREVIOUS PAGE
      const requestedFrom = location.state?.from;

      const requestedPath =
        typeof requestedFrom === "string"
          ? requestedFrom
          : requestedFrom?.pathname;

      // PREVENT INVALID REDIRECT
      const safePath =
        typeof requestedPath === "string" &&
        requestedPath.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !["/login", "/register"].includes(requestedPath)
          ? requestedPath
          : "/";

      // PRESERVE PENDING PRODUCT ACTION
      const resumeAction = [
        "addToCart",
        "buyNow",
      ].includes(location.state?.resumeAction)
        ? location.state.resumeAction
        : null;

      // REDIRECT AFTER LOGIN
      navigate(safePath, {
        replace: true,
        state: resumeAction
          ? { resumeAction }
          : undefined,
      });

    } catch (error) {
      const message =
        error.response?.data?.message;

      // OTP VERIFICATION
      if (message === "Please verify OTP first") {
        alert("Please verify OTP first");

        navigate(
          `/verify-otp?email=${encodeURIComponent(email)}`,
          {
            state: location.state,
          }
        );

        return;
      }

      alert(message || "Login Failed");

      console.log("LOGIN ERROR:", error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <div className="login-card shadow-lg p-4">

        <h2 className="text-center brand-title mb-2">
          GIFTYFY
        </h2>

        <p className="text-center text-muted mb-4">
          Welcome Back 🎁
        </p>

        <form onSubmit={submitHandler}>

          {/* EMAIL */}
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

          {/* PASSWORD */}
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

          {/* LOGIN BUTTON */}
          <div className="d-grid">

            <button
              type="submit"
              className="btn btn-purple"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </div>

          {/* REGISTER */}
          <p className="text-center mt-3 small">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="register-link"
            >
              Register
            </Link>

          </p>

        </form>

      </div>
    </div>
  );
};

export default Login;