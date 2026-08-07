import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/profile.css";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

export default function Profile() {

  const [user, setUser] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [editAddress, setEditAddress] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    fetchAddresses();
  }, []);

  // ================= PROFILE =================
  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/users/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= ORDERS =================
  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/orders/user-orders",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(res.data.orders || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= ADDRESS =================
  const fetchAddresses = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/address",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAddresses(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= UPDATE PROFILE =================
  const handleUpdate = async () => {
    try {
      await axios.put(
        "http://localhost:4000/api/user/update",
        user,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditMode(false);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  const handleProfileImage = async () => {
  try {
    const formData = new FormData();

    formData.append("profileImage", profileFile);

    const res = await axios.put(
      "http://localhost:4000/api/users/upload-profile",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setUser(res.data.user);

     setProfileFile(null);
     if (fileInputRef.current) {
  fileInputRef.current.value = "";
}

  } catch (err) {
    console.log(err);
  }
};

// ================= DELETE ADDRESS =================
const handleDeleteAddress = async (id) => {

  const confirmDelete = window.confirm(
    "Are you sure want to delete this address?"
  );

  if (!confirmDelete) return;

  try {

    await axios.delete(
      `http://localhost:4000/api/address/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchAddresses();

  } catch (err) {
    console.log(err);
  }
};

// ================= UPDATE ADDRESS =================
const handleUpdateAddress = async () => {

  try {

    await axios.put(
      `http://localhost:4000/api/address/${editAddress._id}`,
      editAddress,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setEditAddress(null);

    fetchAddresses();

  } catch (err) {
    console.log(err);
  }
};


  return (
    <div className="gfp-page">

      {/* SIDEBAR */}
      <div className="gfp-sidebar">

        <button
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>

        <button onClick={() =>navigate("/orders")}>
          Orders
        </button>

        <button onClick={() => setActiveTab("address")}>
          Addresses
        </button>

        <button onClick={() => navigate("/wishlist")}>
          Wishlist
        </button>

        <button className="logout" onClick={handleLogout}>
          Logout
        </button>

      </div>

      {/* CONTENT */}
      <div className="gfp-content">

        {/* HEADER */}
      <div className="gfp-header">

  <div className="gfp-image-wrapper">

    <img
      src={
        user.profileImage
          ? `http://localhost:4000/uploads/${user.profileImage}`
          : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      }
      alt="profile"
      className="gfp-avatar"
    />

    <label className="gfp-upload-btn">
      +
      <input
  ref={fileInputRef}
  type="file"
  hidden
  accept="image/*"
  onChange={(e) => setProfileFile(e.target.files[0])}
/>
    </label>

  </div>

  <div>
    <h2>{user.name}</h2>
    <p>{user.email}</p>
    <p>{user.phone}</p>

    {profileFile && (
      <button
        className="gfp-save-image-btn"
        onClick={handleProfileImage}
      >
        Upload Photo
      </button>
    )}
  </div>

</div>

        {/* ================= PROFILE TAB ================= */}
        {activeTab === "profile" && (
          <div className="gfp-card">

            <h3>Personal Info</h3>

            <input
              value={user.name || ""}
              disabled={!editMode}
              onChange={(e) =>
                setUser({ ...user, name: e.target.value })
              }
            />

            <input value={user.email || ""} disabled />

            <input
              value={user.phone || ""}
              disabled={!editMode}
              onChange={(e) =>
                setUser({ ...user, phone: e.target.value })
              }
            />

            {!editMode ? (
              <button
  className="gfp-edit-btn"
  onClick={() => setShowProfileModal(true)}
>
  Edit Profile
</button>
            ) : (
              <button  className="gfp-save-profile-btn"onClick={handleUpdate}>
                Save Changes
              </button>
            )}

          </div>
        )}

        {/* ================= ORDERS TAB ================= */}
        {activeTab === "orders" && (
          <div className="gfp-order-card">

            <h3>My Orders</h3>

            {orders.map((order) => (
              <div key={order._id} className="order-card">

                <div className="gfp-order-top">
                  <h4>Order #{order._id.slice(-5)}</h4>

                  <span className={`status ${order.status?.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                {/* ITEMS */}
                {order.items.map((item, i) => (
                  <div key={i} className="gfp-order-item">
                    <img src={`http://localhost:4000/uploads/${item.image}`} />
                    <div>
                      <p>{item.name}</p>
                      <small>Qty: {item.quantity}</small>
                    </div>
                  </div>
                ))}

                <p>
                  Total: ₹{Math.round(order.totalAmount)}
                </p>

              </div>
            ))}

          </div>
        )}
{/* ================= ADDRESS TAB ================= */}
{activeTab === "address" && (
  <div className="gfp-card">

    <h3>My Addresses</h3>

    {addresses.map((addr) => (
      <div key={addr._id} className="gfp-address-card">

        <h4>
          {addr.firstName} {addr.lastName}
        </h4>

        <p>{addr.address}</p>
        <p>{addr.city} - {addr.pincode}</p>
        <p>{addr.phone}</p>

        <div className="gfp-address-actions">

          <button
            onClick={() => setEditAddress(addr)}
            className="gfp-address-edit-btn"
          >
            Edit
          </button>

          <button
            onClick={() => handleDeleteAddress(addr._id)}
            className="gfp-address-delete-btn"
          >
            Delete
          </button>

        </div>

      </div>
    ))}

  </div>
)}

{/* ================= EDIT ADDRESS MODAL ================= */}

{editAddress && (
  <div className="gfp-modal-overlay">

    <div className="gfp-modal">

      <h3>Edit Address</h3>

      <input
        value={editAddress.firstName}
        onChange={(e) =>
          setEditAddress({
            ...editAddress,
            firstName: e.target.value,
          })
        }
        placeholder="First Name"
      />

      <input
        value={editAddress.lastName}
        onChange={(e) =>
          setEditAddress({
            ...editAddress,
            lastName: e.target.value,
          })
        }
        placeholder="Last Name"
      />

      <textarea
        value={editAddress.address}
        onChange={(e) =>
          setEditAddress({
            ...editAddress,
            address: e.target.value,
          })
        }
        placeholder="Address"
      />

      <input
        value={editAddress.city}
        onChange={(e) =>
          setEditAddress({
            ...editAddress,
            city: e.target.value,
          })
        }
        placeholder="City"
      />

      <input
        value={editAddress.pincode}
        onChange={(e) =>
          setEditAddress({
            ...editAddress,
            pincode: e.target.value,
          })
        }
        placeholder="Pincode"
      />

      <input
        value={editAddress.phone}
        onChange={(e) =>
          setEditAddress({
            ...editAddress,
            phone: e.target.value,
          })
        }
        placeholder="Phone"
      />

      <div className="gfp-modal-actions">

        <button
          className="gfp-save-btn"
          onClick={handleUpdateAddress}
        >
          Save
        </button>

        <button
          className="gfp-cancel-btn"
          onClick={() => setEditAddress(null)}
        >
          Cancel
        </button>

      </div>

    </div>

  </div>
)}


{showProfileModal && (
  <div className="gfp-modal-overlay">
    <div className="gfp-modal">

      <h3>Edit Profile</h3>

      <input
        value={user.name || ""}
        onChange={(e) =>
          setUser({
            ...user,
            name: e.target.value,
          })
        }
        placeholder="Name"
      />

      <input
        value={user.phone || ""}
        onChange={(e) =>
          setUser({
            ...user,
            phone: e.target.value,
          })
        }
        placeholder="Phone"
      />

      <input
        value={user.email || ""}
        disabled
      />

      <div className="gfp-modal-actions">

        <button
          className="gfp-save-btn"
          onClick={() => {
            handleUpdate();
            setShowProfileModal(false);
          }}
        >
          Save Changes
        </button>

        <button
          className="gfp-cancel-btn"
          onClick={() => setShowProfileModal(false)}
        >
          Cancel
        </button>

      </div>

    </div>
  </div>
)}

      </div>
    </div>
  );
}