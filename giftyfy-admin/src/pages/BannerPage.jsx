import React, { useState, useEffect } from "react";
import axios from "axios";

import AdminLayout
from "../layout/AdminLayout";

const BannerPage = () => {

  const [image, setImage] =
    useState(null);

  const [banners, setBanners] =
    useState([]);

  const [logoImage, setLogoImage] =
    useState(null);

const [logo, setLogo] = useState(null);

  // =========================
  // FETCH BANNERS
  // =========================

  const fetchBanners = async () => {

    const res = await axios.get(
      "http://localhost:4000/api/banner"
    );

    setBanners(res.data);
  };

  // =========================
  // FETCH LOGO
  // =========================

  const fetchLogo = async () => {

    const res = await axios.get(
      "http://localhost:4000/api/logo"
    );

    setLogo(res.data);
  };

  // =========================
  // USE EFFECT
  // =========================

  useEffect(() => {

    fetchBanners();
    fetchLogo();

  }, []);

  // =========================
  // UPLOAD BANNER
  // =========================

  const submitHandler = async (e) => {

    e.preventDefault();

    const formData =
      new FormData();

    formData.append(
      "image",
      image
    );

    await axios.post(
      "http://localhost:4000/api/banner",
      formData
    );

    alert(
      "Banner Uploaded Successfully"
    );

    setImage(null);

    fetchBanners();
  };

  // =========================
  // DELETE BANNER
  // =========================

  const deleteBanner =
  async (id) => {

    await axios.delete(
      `http://localhost:4000/api/banner/${id}`
    );

    alert("Banner Deleted");

    fetchBanners();
  };

  // =========================
  // TOGGLE ACTIVE
  // =========================

  const toggleActive =
  async (id) => {

    await axios.put(
      `http://localhost:4000/api/banner/active/${id}`
    );

    fetchBanners();
  };

  // =========================
  // UPLOAD LOGO
  // =========================

  const submitLogo =
  async (e) => {

    e.preventDefault();

    const formData =
      new FormData();

    formData.append(
      "image",
      logoImage
    );

    await axios.post(
      "http://localhost:4000/api/logo",
      formData
    );

    alert(
      "Logo Uploaded Successfully"
    );

    setLogoImage(null);

    fetchLogo();
  };

  return (

    <AdminLayout>

      {/* PAGE */}

      <div
        style={{
          padding: "10px",
        }}
      >

        <h1
          style={{
            marginBottom: "20px",
          }}
        >
          Banner Management
        </h1>

        {/* =========================
            UPLOAD BANNER
        ========================= */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
            maxWidth: "400px",
          }}
        >

          <h3>
            Upload New Banner
          </h3>

          <form
            onSubmit={submitHandler}
          >

            <input
              type="file"
              required
              onChange={(e) =>
                setImage(
                  e.target.files[0]
                )
              }
              style={{
                marginTop: "15px",
              }}
            />

            <br />
            <br />

            <button
              type="submit"
              style={{
                background: "#6a0dad",
                color: "white",
                border: "none",
                padding:
                  "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Upload Banner
            </button>

          </form>

        </div>

        {/* =========================
            ALL BANNERS
        ========================= */}

        <h2
          style={{
            marginTop: "40px",
          }}
        >
          All Banners
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,300px)",
            gap: "20px",
            marginTop: "20px",
          }}
        >

          {banners.map((banner) => (

            <div
              key={banner._id}
              style={{
                background: "white",
                padding: "10px",
                borderRadius: "12px",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >

              <img
                src={`http://localhost:4000/uploads/${banner.image}`}
                alt="banner"
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />

              <button
                onClick={() => {

                  if (
                    banner.isActive
                  ) {

                    alert(
                      "Active banner cannot be deleted"
                    );

                    return;
                  }

                  deleteBanner(
                    banner._id
                  );

                }}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete Banner
              </button>

              <button
                onClick={() =>
                  toggleActive(
                    banner._id
                  )
                }
                style={{
                  marginTop: "10px",
                  width: "100%",
                  background:
                    banner.isActive
                      ? "green"
                      : "gray",
                  color: "white",
                  border: "none",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {banner.isActive
                  ? "Active"
                  : "Inactive"}
              </button>

            </div>

          ))}

        </div>


        {/* =========================
    UPLOAD LOGO
========================= */}

<div
  style={{
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",
    maxWidth: "400px",
    marginTop: "30px",
  }}
>

  <h3>Upload Logo</h3>

  <form onSubmit={submitLogo}>

    <input
      type="file"
      required
      onChange={(e) =>
        setLogoImage(
          e.target.files[0]
        )
      }
      style={{
        marginTop: "15px",
      }}
    />

    <br />
    <br />

    <button
      type="submit"
      style={{
        background: "#111",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Upload Logo
    </button>

  </form>

</div>
{/* =========================
    ALL LOGOS
========================= */}

<h2
  style={{
    marginTop: "40px",
  }}
>
  Website Logo
</h2>

<div
  style={{
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "20px",
  }}
>

{logo && (

  <div
    style={{
      background: "white",
      padding: "15px",
      borderRadius: "12px",
      boxShadow:
        "0 2px 10px rgba(0,0,0,0.08)",
      marginTop: "20px",
      width: "250px",
    }}
  >

    <img
      src={`http://localhost:4000/uploads/${logo.image}`}
      alt="logo"
      style={{
        width: "100%",
        height: "100px",
        objectFit: "contain",
      }}
    />

  </div>

)}

</div>

      </div>

    </AdminLayout>
  );
};

export default BannerPage;