import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import "../styles/footer.css";

import { useTranslation }
from "react-i18next";
import { useLocation } from "react-router-dom";

import {
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";

export default function Footer() {

  const [siteContent, setSiteContent] =
    useState({});
const location = useLocation();
  const { t, i18n } =
    useTranslation();

  useEffect(() => {
    fetchSiteContent();
  }, []);

  const fetchSiteContent = async () => {

    try {

      const res = await axios.get(
        "http://localhost:4000/api/site-content"
      );

      setSiteContent(res.data);

    } catch (err) {

      console.log(err);

    }
  };

  if(
    location.pathname === "/checkout" ||
    location.pathname === "/payment" ||
    location.pathname === "/return/:id"
  ){
    return null;
  }

  return (
    <footer className="footer">

      {/* ================= TOP BANNER ================= */}

      <div className="footer-banner">

        <h3>{t("built")}</h3>

      </div>

      {/* ================= MAIN ================= */}

      <div className="footer-main">

        {/* ================= LEFT INFO ================= */}

        <div className="footer-left">

          <h2>
  {siteContent.companyName} 🎁
</h2>

          <p>
            {siteContent.contactAddress}
          </p>

          <p>
            {siteContent.contactEmail}
          </p>

          <p>
            {siteContent.contactPhone}
          </p>

          <div className="timing">

            <p>{t("timing1")}</p>

            <p>{t("timing2")}</p>

          </div>

        </div>

        {/* ================= SHOP ================= */}

        <div className="footer-links">

          <h4>{t("shop")}</h4>

          <p>{t("products")}</p>

          <p>{t("arrivals")}</p>

          <p>{t("sellers")}</p>

        </div>

        {/* ================= CATEGORIES ================= */}

        <div className="footer-links">

          <h4>{t("categories")}</h4>

          <p>{t("gift")}</p>

          <p>{t("personalised")}</p>

          <p>{t("accessories")}</p>

        </div>

        {/* ================= SUPPORT ================= */}

        <div className="footer-links">

          <h4>{t("support")}</h4>

          <p>{t("contact")}</p>

          <p>{t("faq")}</p>

          <p>{t("returns")}</p>

        </div>

        {/* ================= COMPANY ================= */}

        <div className="footer-links">

          <h4>{t("company")}</h4>

          <p>{t("about")}</p>

          <p>{t("careers")}</p>

          <p>{t("privacy")}</p>

        </div>

        {/* ================= LANGUAGE ================= */}

        <div className="language">

          <button
            onClick={() =>
              i18n.changeLanguage("en")
            }
          >
            EN
          </button>

          <button
            onClick={() =>
              i18n.changeLanguage("ta")
            }
          >
            தமிழ்
          </button>

        </div>

      </div>

      {/* ================= BOTTOM ================= */}

      <div className="footer-bottom">

        <p>
          © 2026 {siteContent.companyName}
        </p>

        {/* ================= SOCIALS ================= */}

        <div className="socials">

          <a
            href={siteContent.facebook}
            target="_blank"
            rel="noreferrer"
          >
            <FaFacebook />
          </a>

          <a
            href={siteContent.instagram}
            target="_blank"
            rel="noreferrer"
          >
            <FaInstagram />
          </a>

          <a
            href={siteContent.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <FaTwitter />
          </a>

          <a
            href={siteContent.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            <FaLinkedin />
          </a>

        </div>

        {/* ================= LEGAL ================= */}

        <div className="legal">

          <span>{t("terms")}</span>

          <span>{t("privacy")}</span>

          <span>{t("cookies")}</span>

          <span>{t("sitemap")}</span>

        </div>

      </div>

    </footer>
  );
}