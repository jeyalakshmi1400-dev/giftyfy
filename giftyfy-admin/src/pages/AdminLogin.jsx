import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/adminLogin.css";

export default function AdminLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:4000/api/admin/login", // ✅ FIXED
        { email, password }
      );

      localStorage.setItem("token", res.data.token);

      alert("Admin Login Success");

      navigate("/admin");

    } catch (error) {
      alert("Invalid Admin Email or Password");
    }
  };

  return (
    <div className="loginContainer">

      <div className="loginCard">

        <h2>Admin Login</h2>
        <p className="subtitle">Welcome back! Please login to continue</p>

        <form onSubmit={submitHandler}>

          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            Login
          </button>

        </form>

      </div>

    </div>
  );
}