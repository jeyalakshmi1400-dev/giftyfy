import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../styles/deliveryRequests.css";

export default function DeliveryRequests() {
  const [notifications, setNotifications] =
    useState([]);

  const navigate = useNavigate();
  const token =
    localStorage.getItem("deliveryToken");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/notifications/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(
        res.data.notifications || []
      );
    } catch (error) {
      console.log(error);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/orders/${orderId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchNotifications();
      navigate("/order-pickup");
    } catch (error) {
      alert(
        error.response?.data?.message
      );
    }
  };
const acceptReturn = async (orderId) => {
  try {
    const res = await axios.put(
      `http://localhost:4000/api/orders/${orderId}/accept-return`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(res.data);   // <-- Add this

    alert("Return Accepted");

    fetchNotifications();

    navigate("/returns");

  } catch (error) {
    console.log(error.response);
    alert(error.response?.data?.message || "Accept Failed");
  }
};

const rejectOrder = async (notification) => {
  try {
    await axios.delete(
      `http://localhost:4000/api/delivery/notifications/${notification._id}/reject`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setNotifications((prev) =>
      prev.filter((item) => item._id !== notification._id)
    );
  } catch (error) {
    console.log(error.response?.data || error);
    alert("Reject failed");
  }
};
const handleNotification = (n) => {
  if (n.type === "RETURN_PICKUP") {
    acceptReturn(n.order._id);
    return;
  }

  acceptOrder(n.order._id);
};
  return (
     <div className="dn2-page-wrap">
      

      <div className="delivery-requests-page">
        <div className="request-header">
          <h2>Delivery Requests</h2>
          <p>
            New delivery assignments waiting for
            acceptance
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="empty-request">
            <h3>No Delivery Requests</h3>
            <p>No orders assigned to you right now</p>
          </div>
        ) : (
          <div className="request-grid">
            {notifications.map((n) => (
              <div
                className="request-card"
                key={n._id}
              >
                {/* PRODUCTS */}
                <div className="product-list">
                  {n.order?.items?.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="product-row"
                      >
                        <img
                          src={
                            item.image
                              ? `http://localhost:4000/uploads/${item.image}`
                              : "/no-image.png"
                          }
                          alt=""
                          className="product-thumb"
                        />

                        <div className="product-details">
                          <h4>
                            {item.product?.name}
                          </h4>
                          <span>
                            Qty : {item.quantity}
                          </span>
                        </div>

                        <div className="product-price">
                          ₹
                          {item.price?.toLocaleString()}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* CUSTOMER */}
                <div className="request-info">
                  <div className="info-row">
                    <span>Order ID</span>
                    <strong>
                      {n.order?._id}
                    </strong>
                  </div>

                  <div className="info-row">
                    <span>Customer</span>
                    <strong>
                      {n.order?.user?.name}
                    </strong>
                  </div>

                  <div className="info-row">
                    <span>Phone</span>
                    <strong>
                      {n.order?.user?.phone}
                    </strong>
                  </div>

                  <div className="info-row">
                    <span>Pincode</span>
                    <strong>
                      {
                        n.order
                          ?.deliveryPincode
                      }
                    </strong>
                  </div>

                  <div className="address-box">
                    <span>Delivery Address</span>
                    <p>{n.order?.address}</p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="action-buttons">
  <button
    className="accept-order-btn"
    onClick={() => handleNotification(n)}
  >
    {n.type === "RETURN_PICKUP"
      ? "Accept Return"
      : "Accept Order"}
  </button>

  <button
    className="reject-order-btn"
    onClick={() => rejectOrder(n)}
  >
    Reject
  </button>
</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}