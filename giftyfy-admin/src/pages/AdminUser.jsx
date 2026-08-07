import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/adminUsers.css";
import AdminLayout from "../layout/AdminLayout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get("http://localhost:4000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers(res.data.users || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleBlock = async (id) => {
  try {

    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:4000/api/users/block/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchUsers();

  } catch (error) {
    console.log(error);
  }
};
const handleDelete = async (id) => {
  try {
    const token = localStorage.getItem("token");

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    await axios.delete(
      `http://localhost:4000/api/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("User deleted successfully");
    fetchUsers();

  } catch (error) {
    console.log(error);
    alert("Failed to delete user");
  }
};

  return (
    <AdminLayout>
      {/* =========================
    USER DETAILS MODAL
========================= */}

{selectedUser && (

  <div
    className="user-modal-overlay"
    onClick={() =>
      setSelectedUser(null)
    }
  >

    <div
      className="user-modal"
      onClick={(e) =>
        e.stopPropagation()
      }
    >

      {/* CLOSE */}
      <button
        className="modal-close"
        onClick={() =>
          setSelectedUser(null)
        }
      >
        ✖
      </button>

      <h2>User Details</h2>

      <div className="user-info">

        <p>
          <b>Name:</b>
          {selectedUser.name}
        </p>

        <p>
          <b>Email:</b>
          {selectedUser.email}
        </p>

        <p>
          <b>Phone:</b>
          {selectedUser.phone}
        </p>

      </div>

      {/* ORDERS */}
      <h3 className="orders-title">
        Orders
      </h3>

      {selectedUser.orders?.length ? (

        selectedUser.orders.map(
          (order, i) => (

          <div
            key={i}
            className="modal-order-box"
          >

            {order.items.map(
              (item, j) => (

              <div
                key={j}
                className="modal-order-item"
              >

                <img
                  src={
                    item.image?.startsWith(
                      "uploads"
                    )
                      ? `http://localhost:4000/${item.image}`
                      : `http://localhost:4000/uploads/${item.image}`
                  }
                  alt=""
                />

                <div>

                  <p>{item.name}</p>

                  <small>
                    Qty:
                    {item.quantity}
                  </small>

                  <p>
                    ₹
                    {Math.round(
                      item.price
                    )}
                  </p>

                </div>

              </div>

            ))}

            <div className="modal-order-total">

              Total: ₹
              {Math.round(
                order.totalAmount
              )}

            </div>

            <p>
              <b>Address:</b>
              {order.address}
            </p>

            <p>
              <b>Pincode:</b>
              {order.deliveryPincode}
            </p>

          </div>

        ))

      ) : (

        <p>No Orders</p>

      )}

    </div>

  </div>

)}

      {/* LEFT TABLE */}
      <div className="users-left">
        <h2>User Management</h2>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                 <td
        onClick={() =>
          setSelectedUser(user)
        }
      >{user.name}</td>
                 <td
        onClick={() =>
          setSelectedUser(user)
        }
      >{user.email}</td>
                 <td
        onClick={() =>
          setSelectedUser(user)
        }
      >{user.phone}</td>

                <td>
                  <button
                    className="view-btn"
                    onClick={() => setSelectedUser(user)}
                  >
                    View
                  </button>

                  <button
  className="delete-btn"
  onClick={() => handleDelete(user._id)}
>
  Delete
</button>
                  <button
  className={user.isBlocked ? "unblock-btn" : "userblock-btn"}
  onClick={() => handleBlock(user._id)}
>
  {user.isBlocked ? "Unblock" : "Block"}
</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


   </AdminLayout>
  );
}