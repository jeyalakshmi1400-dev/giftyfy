import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/contact.css";

export default function Contact() {

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

    <div className="contact-page">

      {/* HERO */}
      <div className="contact-hero">

        <div className="contact-overlay">

          <h1>Contact Us</h1>

          <p>
            We'd love to hear from you
          </p>

        </div>

      </div>

      {/* CONTACT SECTION */}
      <div className="contact-container">

        <div className="contact-card">

          <div className="contact-box">

            <h3>📧 Email</h3>

            <p>
              {content.contactEmail}
            </p>

          </div>

          <div className="contact-box">

            <h3>📞 Phone</h3>

            <p>
              {content.contactPhone}
            </p>

          </div>

          <div className="contact-box">

            <h3>📍 Address</h3>

            <p>
              {content.contactAddress}
            </p>

          </div>

        </div>

        {/* SOCIAL */}
        <div className="contact-social">

          <a
            href={content.instagram}
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>

          <a
            href={content.facebook}
            target="_blank"
            rel="noreferrer"
          >
            Facebook
          </a>

          <a
            href={content.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Whatsapp
          </a>

        </div>

      </div>

    </div>

  );
}