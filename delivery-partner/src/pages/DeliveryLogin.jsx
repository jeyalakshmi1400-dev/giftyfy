import React, { useState,useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/deliveryLogin.css";

export default function DeliveryLogin() {

  const navigate = useNavigate();
    const [logo, setLogo] = useState(null);

    


  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // ===== INPUT CHANGE =====
  const changeHandler = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


    useEffect(() => {

    const fetchLogo = async () => {

      try {

        const res = await axios.get(
          "http://localhost:4000/api/logo"
        );

        setLogo(res.data);

      } catch (err) {

        console.log(err);

      }

    };

    fetchLogo();

  }, []);

  // ===== LOGIN =====
  const submitHandler = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      const res = await axios.post(
        "http://localhost:4000/api/delivery/login",
        form
      );

      const { token, partner } = res.data;

      // ===== APPROVAL CHECK =====
  if (!partner.isApproved) {

  return res.status(403).json({
    message:
      "Admin approval pending"
  });

}

// ✅ BLOCK CHECK
if (partner.isBlocked) {

  return res.status(403).json({
    message:
      "Your account has been blocked by admin"
  });

}

      // ===== SAVE TOKEN =====
      localStorage.setItem(
        "deliveryToken",
        token
      );

      // ===== SAVE DELIVERY ID =====
      localStorage.setItem(
        "deliveryId",
        partner._id
      );

      alert("Login Successful ✅");

      // ===== REDIRECT =====
      navigate("/");

    } catch (err) {

      alert(
        err.response?.data?.message ||
        "Login Failed ❌"
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="delivery-login-page">

      <div className="delivery-login-card">
  <img
  src={
    logo?.image
      ? `http://localhost:4000/uploads/${encodeURIComponent(
          logo.image
        )}`
      : "/no-logo.png"
  }
  alt="Logo"
  className="login-logo"
/>

        <h2>Delivery Partner Login</h2>

        <p className="login-subtitle">
          Welcome back 👋
        </p>

        <form onSubmit={submitHandler}>

          {/* EMAIL */}
          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={changeHandler}
              required
            />

          </div>

          {/* PASSWORD */}
          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={changeHandler}
              required
            />

          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>

        {/* REGISTER */}
        <div className="register-text">

          Don't have account?{" "}

          <Link to="/register">
            Register
          </Link>

        </div>

      </div>

    </div>
  );
}