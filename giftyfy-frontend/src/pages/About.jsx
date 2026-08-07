import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/about.css";

export default function About() {

  const [content, setContent] = useState({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {

    try {

      const res = await axios.get(
        "http://localhost:4000/api/site-content"
      );

      setContent(res.data || {});

    } catch (err) {

      console.log(err);

    }
  };

  return (

    <div className="about-page">

      {/* HERO */}
      <div className="about-hero">

        <div className="about-overlay">

          <h1>
            {content.aboutTitle || "About Us"}
          </h1>

          <p>
            Welcome to our ecommerce platform
          </p>

        </div>

      </div>

      {/* CONTENT */}
      <div className="about-container">

        <div className="about-card">

          <h2>
            Our Story
          </h2>

          <p>
            {content.aboutDescription ||
              "No About Content Added Yet"}
          </p>

        </div>

        {/* FEATURES */}
        <div className="about-features">

          <div className="about-feature-box">

            <h3>🚚 Fast Delivery</h3>

            <p>
              Quick and secure delivery across India.
            </p>

          </div>

          <div className="about-feature-box">

            <h3>💳 Secure Payments</h3>

            <p>
              Razorpay powered safe online payments.
            </p>

          </div>

          <div className="about-feature-box">

            <h3>🎁 Best Products</h3>

            <p>
              Premium quality products at best prices.
            </p>

          </div>

        </div>

      </div>

    </div>

  );
}