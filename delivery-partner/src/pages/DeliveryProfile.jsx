import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBell,
  FaUser,
  FaEdit,
} from "react-icons/fa";

import "../styles/deliveryprofile.css";

const DeliveryProfile = () => {
  const [partner, setPartner] = useState(null);
  const [editMode, setEditMode] = useState(false);

const [formData, setFormData] = useState({
  name: "",
  email: "",
  phone: "",
  vehicleNumber: "",
  pincode: "",
});
const [salary, setSalary] = useState(null);

  useEffect(() => {
  fetchProfile();
  fetchSalary();
}, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("deliveryToken");

      const { data } = await axios.get(
        "http://localhost:4000/api/delivery/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFormData({
  name: data.partner.name || "",
  email: data.partner.email || "",
  phone: data.partner.phone || "",
  vehicleNumber: data.partner.vehicleNumber || "",
  pincode: data.partner.pincode || "",
});

      setPartner(data.partner);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSalary = async () => {
  try {
    const token = localStorage.getItem("deliveryToken");

    const { data } = await axios.get(
      "http://localhost:4000/api/salary/my",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSalary(data.currentSalary);
  } catch (err) {
    console.log(err);
  }
};


const handleUpdate = async () => {

  try {

    const token =
      localStorage.getItem("deliveryToken");

    const { data } = await axios.put(

      "http://localhost:4000/api/delivery/profile",

      formData,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

    );

    setPartner(data.partner);

    setEditMode(false);

    alert("Profile Updated");

  } catch (error) {

    console.log(error);

    alert("Update Failed");

  }

};
  return (
     <div className="dn2-page-wrap">
 

      {/* Main Content */}
      <div className="delivery-profile-main">

        {/* Navbar */}
        <div className="delivery-profile-navbar">
          <h2>Delivery Partner Profile</h2>

         
        </div>

        {/* Profile Card */}
        <div className="delivery-profile-card">

          {/* Header */}
          <div className="delivery-profile-card-header">

            <div className="delivery-profile-title">
              <FaUser />
              <h3>Profile</h3>
            </div>

            <button
  className="delivery-profile-edit-btn"
  onClick={() => setEditMode(!editMode)}
>
  <FaEdit />
  {editMode ? "Cancel" : "Edit"}
</button>
          </div>

          {/* Body */}
          <div className="delivery-profile-body">

            {/* Left */}
            <div className="delivery-profile-left">

                <img
  src={
    partner?.photo
      ? `http://localhost:4000/uploads/${partner.photo}`
      : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
  }
  alt="profile"
  className="delivery-profile-image"
/>

              {
  editMode ? (
    <input
      type="text"
      value={formData.name}
      onChange={(e) =>
        setFormData({
          ...formData,
          name: e.target.value,
        })
      }
      className="delivery-profile-input"
    />
  ) : (
    <h3 className="delivery-profile-name">
      {partner?.name}
    </h3>
  )
}
            </div>

            {/* Right */}
            <div className="delivery-profile-right">

              <div className="delivery-profile-row">
                <span className="delivery-profile-label">
                  Mobile Number
                </span>

            {
  editMode ? (
    <input
      type="text"
      value={formData.phone}
      onChange={(e) =>
        setFormData({
          ...formData,
          phone: e.target.value,
        })
      }
      className="delivery-profile-input"
    />
  ) : (
    <p className="delivery-profile-value">
      {partner?.phone}
    </p>
  )
}
              </div>

              <div className="delivery-profile-row">
                <span className="delivery-profile-label">
                  Email ID
                </span>

                {
  editMode ? (
    <input
      type="email"
      value={formData.email}
      onChange={(e) =>
        setFormData({
          ...formData,
          email: e.target.value,
        })
      }
      className="delivery-profile-input"
    />
  ) : (
    <p className="delivery-profile-value">
      {partner?.email}
    </p>
  )
}
              </div>

              <div className="delivery-profile-row">
                <span className="delivery-profile-label">
                  Aadhar Number
                </span>

                <p className="delivery-profile-value">
                  {partner?.aadharNumber}
                </p>
              </div>

              <div className="delivery-profile-row">
                <span className="delivery-profile-label">
                  Vehicle Number
                </span>

                {
  editMode ? (
    <input
      type="text"
      value={formData.vehicleNumber}
      onChange={(e) =>
        setFormData({
          ...formData,
          vehicleNumber: e.target.value,
        })
      }
      className="delivery-profile-input"
    />
  ) : (
    <p className="delivery-profile-value">
      {partner?.vehicleNumber}
    </p>
  )
}
              </div>

              <div className="delivery-profile-row">
                <span className="delivery-profile-label">
                  Registered On
                </span>

                <p className="delivery-profile-value">
                  {partner?.createdAt
                    ? new Date(
                        partner.createdAt
                      ).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="delivery-profile-row">
                <span className="delivery-profile-label">
                  Pincode
                </span>

                {
  editMode ? (
    <input
      type="text"
      value={formData.pincode}
      onChange={(e) =>
        setFormData({
          ...formData,
          pincode: e.target.value,
        })
      }
      className="delivery-profile-input"
    />
  ) : (
    <p className="delivery-profile-value">
      {partner?.pincode}
    </p>
  )
}

              </div>
               {
  editMode && (
    <button
      className="delivery-profile-save-btn"
      onClick={handleUpdate}
    >
      Save Changes
    </button>
  )
}

            </div>
           
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="delivery-profile-bottom">

          {/* Earnings */}
          {/* <div className="delivery-profile-info-card">

            <h3>Earning Information</h3>

            <div className="delivery-profile-earning-box">

  <span>Total Earnings</span>

  <h2>
    ₹{partner?.totalWithdrawn ?? 0}
  </h2>

</div>

            
          </div> */}

          {/* Recent Updates */}
          <div className="delivery-profile-info-card">

            <h3>Recent Profile Update</h3>

            <p className="delivery-profile-update-text">
              <strong>Phone :</strong> {partner?.phone}
            </p>

            <p className="delivery-profile-update-text">
              <strong>Email :</strong> {partner?.email}
            </p>

          </div>

          <div className="delivery-profile-info-card">

  <h3>Recent Salary Details</h3>

  <p className="delivery-profile-update-text">
    <strong>Month :</strong>{" "}
    {salary
      ? new Date(
          salary.year,
          salary.month - 1
        ).toLocaleString("default", {
          month: "long",
        })
      : "-"}
  </p>

  <p className="delivery-profile-update-text">
    <strong>Salary :</strong>
    ₹{salary?.totalSalary || 0}
  </p>

  <p className="delivery-profile-update-text">
    <strong>Status :</strong>
    <span
      style={{
        color:
          salary?.paymentStatus === "Paid"
            ? "green"
            : "orange",
        fontWeight: "600",
      }}
    >
      {salary?.paymentStatus || "Pending"}
    </span>
  </p>

  <p className="delivery-profile-update-text">
    <strong>Paid Date :</strong>{" "}
    {salary?.paidDate
      ? new Date(
          salary.paidDate
        ).toLocaleDateString()
      : "-"}
  </p>

</div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryProfile;