import React, { useEffect, useState } from "react";
import axios from "axios";

import AdminSidebar from "../components/AdminSidebar";
import "../styles/adminCOD.css";
import AdminLayout from "../layout/AdminLayout";


export default function AdminCODPage() {

  const [codOrders, setCodOrders] =
    useState([]);

    const [currentPage, setCurrentPage] = useState(1);
const ordersPerPage = 10;

  const [loading, setLoading] =
    useState(false);
    const [verifying, setVerifying] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
const [showModal, setShowModal] = useState(false);

  // =========================
  // FETCH COD ORDERS
  // =========================
  useEffect(() => {

    fetchCODOrders();

  }, []);

  
  const fetchCODOrders = async () => {

    try {

      setLoading(true);

      const adminToken =
        localStorage.getItem("adminToken");

      const { data } = await axios.get(
        "http://localhost:4000/api/admin/cod-orders",
        {
          headers: {
            Authorization:
              `Bearer ${adminToken}`,
          },
        }
      );

      console.log(data.orders[0]);

      setCodOrders(data.orders || []);

    } catch (error) {

      console.log(
        "ADMIN COD ERROR 👉",
        error
      );

    } finally {

      setLoading(false);

    }

  };

  // =========================
  // VERIFY COD
  // =========================
const verifyCOD = async (orderId) => {
  try {
    if (verifying[orderId]) return;

    setVerifying((prev) => ({ ...prev, [orderId]: true }));

    const adminToken = localStorage.getItem("adminToken");

    await axios.put(
      `http://localhost:4000/api/admin/verify-cod/${orderId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    // instant UI update
    setCodOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? { ...o, codStatus: "Settled" }
          : o
      )
    );

  } catch (error) {
    console.log("VERIFY COD ERROR 👉", error);
  } finally {
    setVerifying((prev) => ({ ...prev, [orderId]: false }));
  }
};
  // =========================
  // STATS
  // =========================
  const totalOrders =
    codOrders.length;

  const totalCollected =
    codOrders.reduce(
      (acc, item) =>
        acc + (item.amount || 0),
      0
    );

  const totalAdminShare =
    codOrders.reduce(
      (acc, item) =>
        acc + (item.adminAmount || 0),
      0
    );

  const pendingCOD =
    codOrders.filter(
      (item) =>
        item.codStatus ===
        "Submitted"
    ).length;


    const handleConfirmVerify = async (orderId) => {
  try {
    const adminToken = localStorage.getItem("adminToken");
      console.log("Verify clicked:", orderId);


    const res = await axios.put(
      `http://localhost:4000/api/admin/verify-cod/${orderId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    // update UI
    setCodOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? { ...o, codStatus: "Settled" }
          : o
      )
    );

    setShowModal(false);
    setSelectedOrder(null);

    alert("✅ COD Verified Successfully");

  } catch (error) {
    console.log(error);
    alert("❌ Verification Failed");
  }
};

// Pagination
const totalPages = Math.ceil(
  codOrders.length / ordersPerPage
);

const indexOfLastOrder =
  currentPage * ordersPerPage;

const indexOfFirstOrder =
  indexOfLastOrder - ordersPerPage;

const currentOrders =
  codOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );


  useEffect(() => {
  setCurrentPage(1);
}, [codOrders.length]);

  return (

    <AdminLayout>
{showModal && selectedOrder && (
 <div className="admin-cod-modal-overlay">
  <div className="admin-cod-modal">

    <div className="admin-cod-modal-header">
      <h2>COD Verification</h2>

      <button
        className="admin-cod-close-btn"
        onClick={() => setShowModal(false)}
      >
        ×
      </button>
    </div>

    <div className="admin-cod-details">

      <div className="admin-cod-detail-row">
        <span>Order ID</span>
        <strong>#{selectedOrder._id.slice(-6)}</strong>
      </div>

      <div className="admin-cod-detail-row">
        <span>Customer</span>
        <strong>{selectedOrder.customer}</strong>
      </div>

      <div className="admin-cod-detail-row">
        <span>Phone</span>
        <strong>{selectedOrder.phone}</strong>
      </div>

      <div className="admin-cod-detail-row">
        <span>Amount</span>
        <strong>₹{selectedOrder.amount}</strong>
      </div>

<div className="admin-cod-detail-row">
  <span>COD Method</span>
  <strong>{selectedOrder.codCollectionMethod || "N/A"}</strong>
</div>

      <div className="admin-cod-detail-row">
        <span>Partner</span>
        <strong>{selectedOrder.deliveryPartnerName}</strong>
      </div>

      

    </div>

    <div className="admin-cod-modal-actions">

      <button 
        className="admin-cod-cancel-btn"
        onClick={() => setShowModal(false)}
      >
        Cancel
      </button>

      <button
        className="admin-cod-confirm-btn"
        onClick={() =>
          handleConfirmVerify(selectedOrder._id)
        }
      >
        Verify COD
      </button>

    </div>

  </div>
</div>
)}

      {/* MAIN */}
      <div className="admin-cod-main">

        <div className="admin-cod-container">

          {/* HEADER */}
          <div className="admin-cod-header">

            <div>

              <h1>
                COD Settlement
              </h1>

              <p>
                Verify delivery partner
                COD settlements
              </p>

            </div>

          </div>

          {/* STATS */}
          <div className="admin-cod-stats">

            <div className="admin-cod-card">

              <h3>
                Total COD Orders
              </h3>

              <h2>
                {totalOrders}
              </h2>

            </div>

            <div className="admin-cod-card">

              <h3>
                Total Collected
              </h3>

              <h2 className="green">
                ₹{totalCollected}
              </h2>

            </div>

            <div className="admin-cod-card">

              <h3>
                Admin Revenue
              </h3>

              <h2 className="purple">
                ₹{totalAdminShare}
              </h2>

            </div>

            <div className="admin-cod-card">

              <h3>
                Pending Verify
              </h3>

              <h2 className="red">
                {pendingCOD}
              </h2>

            </div>

          </div>

          {/* TABLE */}
          <div className="admin-cod-table-card">

            <table className="admin-cod-table">

              <thead>

                <tr>

                  <th>
                    Order
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Product
                  </th>

                  <th>
                    COD Amount
                  </th>

                 <th>COD Method</th>
                  <th>
                    Partner
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {currentOrders.map((order) => (

                  <tr key={order._id}>

                    {/* ORDER */}
                    <td>
                      #
                      {order._id.slice(-6)}
                    </td>

                    {/* CUSTOMER */}
                    <td>

                      <div>
                        <b>
                          {order.customer}
                        </b>

                        <div>
                          {order.phone}
                        </div>
                      </div>

                    </td>

                    {/* PRODUCT */}
                    <td>

                      {order.items?.map(
                        (item, index) => (

                        <div
                          key={index}
                          className="admin-product-box"
                        >

                          <img
                            src={`http://localhost:4000/uploads/${item.image}`}
                            alt=""
                          />

                          <div>

                            <div>
                              {item.name}
                            </div>

                            <small>
                              Qty:
                              {" "}
                              {item.quantity}
                            </small>

                          </div>

                        </div>

                      ))}

                    </td>

                    {/* COD */}
                    <td className="green">
                      ₹{order.amount}
                    </td>
                    {/* COD Method */}
<td>
  <span
    className={`cod-method ${order.codCollectionMethod?.toLowerCase()}`}
  >
    {order.codCollectionMethod || "N/A"}
  </span>
</td>


                    {/* PARTNER */}
                    <td>
                      {
                        order.deliveryPartnerName
                      }
                    </td>

                    {/* STATUS */}
                    <td>

                      {order.codStatus ===
                      "Settled" ? (

                        <span className="status settled">
                          Settled
                        </span>

                      ) : order.codStatus ===
                        "Submitted" ? (

                        <span className="status pending">
                          Submitted
                        </span>

                      ) : (

                        <span className="status waiting">
                          Pending
                        </span>

                      )}

                    </td>

                    {/* ACTION */}
                    <td>

                      {order.codStatus ===
                      "Submitted" ? (

                        <button
  className="verify-btn"
  disabled={verifying[order._id]}
 onClick={() => {
  setSelectedOrder(order);
  setShowModal(true);
}}
>
  {verifying[order._id] ? "Verifying..." : "Verify"}
</button>

                      ) : (

                        <button className="done-btn">
                          Done
                        </button>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            <div className="admin-pagination">

  <button
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage((prev) => prev - 1)
    }
  >
    Prev
  </button>

  {[...Array(totalPages)].map((_, index) => (
    <button
      key={index}
      className={
        currentPage === index + 1
          ? "active-page"
          : ""
      }
      onClick={() =>
        setCurrentPage(index + 1)
      }
    >
      {index + 1}
    </button>
  ))}

  <button
    disabled={currentPage === totalPages}
    onClick={() =>
      setCurrentPage((prev) => prev + 1)
    }
  >
    Next
  </button>

</div>

          </div>

        </div>

      </div>

   </AdminLayout>

  );

}