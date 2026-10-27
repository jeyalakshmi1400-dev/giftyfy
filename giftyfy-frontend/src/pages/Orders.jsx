import React, { useEffect, useState,useRef } from "react";
import axios from "axios";
import "../styles/orders.css";
import { useNavigate , useLocation } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaFilter
} from "react-icons/fa";
import UserInvoicePDF from "../components/UserInvoicePDF";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FaFilePdf } from "react-icons/fa";
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);

  const token = localStorage.getItem("token");
  const location = useLocation();

const query = new URLSearchParams(location.search);
const selectedOrderId = query.get("orderId");
const [showSearch, setShowSearch] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [showTopBtn, setShowTopBtn] = useState(false);
const invoiceRef = useRef();
const [selectedOrder, setSelectedOrder] = useState(null);
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchOrders();
    }
  }, []);


  useEffect(() => {
  if (!selectedOrderId || orders.length === 0) return;

  const el = document.getElementById(
    `order-${selectedOrderId}`
  );

  if (el) {
    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, [orders, selectedOrderId]);


useEffect(() => {
  const handleScroll = () => {
    setShowTopBtn(window.scrollY > 300);
  };

  window.addEventListener("scroll", handleScroll);

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/orders/user-orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      setOrders(res.data.orders || res.data || []);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleReturn = async (orderId) => {
  const reason = prompt("Enter return reason:");

  if (!reason) return;

  try {
    const token = localStorage.getItem("token");

    const res = await axios.post(
      `http://localhost:4000/api/orders/return/${orderId}`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Return request submitted!");

    // refresh orders
    fetchOrders();

  } catch (err) {
    console.log(err.response?.data || err.message);
  }
};

const fetchReviews = async () => {

  const token = localStorage.getItem("token");

  const res = await axios.get(
    "http://localhost:4000/api/reviews/my",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  setReviews(res.data);

};

useEffect(() => {
  fetchOrders();
  fetchReviews();
}, []);


const isReviewed = (orderId) => {
  return reviews.some(
    (r) => r.order === orderId
  );
};


const canReturnOrder = (order) => {

  if (order.status !== "Delivered") {
    return false;
  }

  const deliveredDate =
    new Date(order.updatedAt);

  const currentDate =
    new Date();

  // DIFFERENCE IN DAYS
  const diffTime =
    currentDate - deliveredDate;

  const diffDays =
    diffTime / (1000 * 60 * 60 * 24);

  return diffDays <= 5;
};



const cancelOrder = async (orderId) => {

  const confirmCancel =
    window.confirm(
      "Are you sure want to cancel this order?"
    );

  if (!confirmCancel) return;

  try {

    await axios.put(
      `http://localhost:4000/api/orders/cancel/${orderId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert("Order cancelled successfully");

    fetchOrders();

  } catch (err) {

    console.log(err);

    alert(
      err.response?.data?.message ||
      "Cancel failed"
    );

  }
};

const filteredOrders = orders.filter((order) => {

  const keyword = searchTerm.toLowerCase();

const matchSearch =
  order.orderId?.toLowerCase().includes(keyword) ||

  order.name?.toLowerCase().includes(keyword) ||      // Customer Name

  order.phone?.toString().includes(keyword) ||        // Phone Number

  order.items.some((item) =>
    item.name?.toLowerCase().includes(keyword)
  ) ||

  order.paymentMethod
    ?.toLowerCase()
    .includes(keyword);

  const matchStatus =
    statusFilter === "All"
      ? true
      : order.status === statusFilter;

  return matchSearch && matchStatus;
});

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const generateInvoice = async (order) => {
  setSelectedOrder(order);

  setTimeout(async () => {
    try {
      if (!invoiceRef.current) {
        return;
      }

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();



      // =========================
      // PAGE 2 : TAX INVOICE
      // =========================
      

      const invoiceCanvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const invoiceImg =
        invoiceCanvas.toDataURL("image/png");

      const invoiceRatio =
        invoiceCanvas.width / invoiceCanvas.height;

      let invoiceWidth = pageWidth;
      let invoiceHeight =
        invoiceWidth / invoiceRatio;

      if (invoiceHeight > pageHeight) {
        invoiceHeight = pageHeight;
        invoiceWidth =
          invoiceHeight * invoiceRatio;
      }

      const invoiceX =
        (pageWidth - invoiceWidth) / 2;

      pdf.addImage(
        invoiceImg,
        "PNG",
        invoiceX,
        0,
        invoiceWidth,
        invoiceHeight
      );

      pdf.save(`Invoice_${order.orderId}.pdf`);
    } catch (err) {
      console.error(err);
    }
  }, 500);
};
  return (
     <div className="orders-page">
      <div
  style={{
    position: "absolute",
    left: "-9999px",
    top: 0,
  }}
>
  <UserInvoicePDF
    order={selectedOrder}
    invoiceRef={invoiceRef}
  />
</div>

    <div className="orders-header">

  <div>

    <h2>📦 My Orders</h2>

    <span>
      {filteredOrders.length} Orders
    </span>

  </div>

  <div className="orders-header-actions">

    {showSearch && (

      <input
        type="text"
        placeholder="Search Order ID / Product..."
        value={searchTerm}
        onChange={(e) =>
          setSearchTerm(e.target.value)
        }
        className="order-search"
      />

    )}

    <button
      className="icon-btn"
      onClick={() =>
        setShowSearch(!showSearch)
      }
    >

      {showSearch ? <FaTimes /> : <FaSearch />}

    </button>

    <select
      className="status-filter"
      value={statusFilter}
      onChange={(e) =>
        setStatusFilter(e.target.value)
      }
    >

      <option>All</option>

      <option>Pending</option>

      <option>Confirmed</option>

      <option>Shipped</option>

      <option>Out for Delivery</option>

      <option>Delivered</option>

      <option>Cancelled</option>

    </select>

  </div>

</div>
    {filteredOrders.map((order) => (
  <div
    key={order._id}
    id={`order-${order.orderId}`}
    className={`order-card-new ${
      selectedOrderId === order.orderId ? "selected-order" : ""
    }`}
  >

    {/* ================= HEADER ================= */}
    <div className="order-header">

      <div className="order-left">

        <div className="order-id-box">
          <small>ORDER ID</small>
<h3>{order.orderId}</h3>
        </div>

        <div className="order-date-box">
          <small>ORDER DATE</small>
          <p>
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

      </div>

      <div className="order-right">

        <div
          className={`status-badge ${order.status
            ?.toLowerCase()
            .replace(/\s/g, "-")}`}
        >
          {order.status}
          
        </div>
        {/* Cancel Information */}
{order.status === "Cancelled" && (
  <div className="cancel-badge">
    ❌ Cancelled by {order.cancelledBy} 
    <span>
      ({order.cancelReason || "No reason"})
    </span>
  </div>
)}
        <h2 className="order-total-price">
          ₹{Math.round(order.totalAmount)}
        </h2>

      </div>

    </div>

   

    {/* ================= PRODUCTS ================= */}

    <div className="order-products">

      {order.items.map((item, index) => (

        <div
          key={index}
          className="order-product-card"
        >

          <img
            src={`http://localhost:4000/uploads/${item.image}`}
            alt={item.name}
            className="order-product-image"
          />

          <div className="order-product-details">

            <h3>{item.name}</h3>

            <div className="product-meta">

              <span>
                Qty :
                <b>{item.quantity}</b>
              </span>

              {(item.size || item.frameSize) && (
                <span>
                  Size :
                  <b>{item.size || item.frameSize}</b>
                </span>
              )}

              {item.variant && (
                <span>
                  Color :
                  <b>{item.variant}</b>
                </span>
              )}

            </div>

            {item.isCustomized && (
              <div className="customized-tag">
                🎨 Personalized Product
              </div>
            )}
             {/* CUSTOMIZATION */}
    {order.items.some(item => item.isCustomized) &&
      order.customizationStatus && (

      <div
        className={`custom-badge ${
          order.customizationStatus
            .toLowerCase()
            .replace(/\s/g, "-")
        }`}
      >

        {order.customizationStatus === "Requested"
          ? "🎨 Customization Requested"
          : order.customizationStatus === "In Progress"
          ? "🎨 Customization In Progress"
          : order.customizationStatus === "Completed"
          ? "🎨 Customization Completed"
          : order.customizationStatus}

      </div>
    )}

          </div>

          <div className="product-price">

            ₹{item.price}

          </div>

        </div>

      ))}

    </div>

    {/* ================= ADDRESS + PAYMENT ================= */}

    <div className="order-info-grid">

      {/* ADDRESS */}

      <div className="order-info-card">

        <h3>📍 Delivery Address</h3>

        <div className="info-body">

          <p>
            <strong>
              {order.name || "Customer"}
            </strong>
          </p>

          <p>
            {order.phone}
          </p>

          <p>
            {order.address}
          </p>

          <p>
            {order.pincode}
          </p>

        </div>

      </div>

      {/* PAYMENT */}

      <div className="order-info-card">
  <h3>💳 Payment Summary</h3>

  <div className="payment-row">
    <span>Payment</span>
    <b>{order.paymentMethod}</b>
  </div>

  <div className="payment-row">
    <span>Items</span>
    <b>{order.items.length}</b>
  </div>

  <div className="payment-row">
  <span>Delivery</span>
  <b>
    {order.delivery > 0
      ? `₹${order.delivery}`
      : "FREE"}
  </b>
</div>

  {/* Discount */}
  {order.discount > 0 && (
    <div className="payment-row">
      <span>Coupon Discount</span>
      <b style={{ color: "green" }}>
        - ₹{Math.round(order.discount)}
      </b>
    </div>
  )}

  <hr />

  <div className="payment-total">
    <span>Total Amount</span>
    <h2>₹{Math.round(order.totalAmount)}</h2>
  </div>
</div>

    </div>

    {/* ===== Part 1A Ends Here ===== */}
{order.status === "Out for Delivery" && (
  <div className="otp-info-card">
    <h3>🔐 Delivery OTP</h3>

    <div className="otp-number">
      {order.otp}
    </div>

    <p className="otp-note">
      Share this OTP with delivery partner
    </p>
  </div>
)}

{order.isDelayed && order.status !== "Delivered" && (
  <div className="delivery-delay-card">

    <h3>⚠ Delivery Delayed</h3>

    <p>
      <strong>Reason:</strong> {order.delayReason}
    </p>

    {order.note && (
      <p>
        <strong>Note:</strong> {order.note}
      </p>
    )}

    {order.rescheduleDate && (
      <p>
        <strong>Expected Delivery:</strong>{" "}
        {order.rescheduleDate} {order.rescheduleTime}
      </p>
    )}

  </div>
)}

{order.status === "Out for Delivery" &&
 order.deliveryPartner && (

  <div className="delivery-partner-card">

    <h3>🚴 Delivery Partner</h3>

    <div className="partner-details">

      <div className="partner-info">

        <p>
          <strong>Name:</strong>{" "}
          {order.deliveryPartner.name}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          <a
            href={`tel:${order.deliveryPartner.phone}`}
          >
            {order.deliveryPartner.phone}
          </a>
        </p>

        <p>
          <strong>Vehicle:</strong>{" "}
          {order.deliveryPartner.vehicleType}
        </p>

        <p>
          <strong>Vehicle No:</strong>{" "}
          {order.deliveryPartner.vehicleNumber}
        </p>

      </div>

    </div>

  </div>

)}
        {/* ================= ORDER TRACKING ================= */}

 {order.status !== "Delivered" ? (

  <div className="tracking-card">

    <h3>🚚 Order Tracking</h3>

   <div className="tracking-box">

  {/* Confirmed */}
  <div
    className={`track-step ${
      [
        "Confirmed",
        "Shipped",
        "Assigned",
        "Out for Delivery",
        "Delivered",
      ].includes(order.status)
        ? "active"
        : ""
    }`}
  >
    <div className="track-circle">✓</div>
    <p>Confirmed</p>
  </div>

  {/* Shipped */}
  <div
    className={`track-step ${
      [
        "Shipped",
        "Assigned",
        "Out for Delivery",
        "Delivered",
      ].includes(order.status)
        ? "active"
        : ""
    }`}
  >
    <div className="track-circle">✓</div>
    <p>Shipped</p>
  </div>

  {/* Out for Delivery */}
  <div
    className={`track-step ${
      [
        "Out for Delivery",
        "Delivered",
      ].includes(order.status)
        ? "active"
        : ""
    }`}
  >
    <div className="track-circle">✓</div>
    <p>Out for Delivery</p>
  </div>

  {/* Delay */}
  {order.isDelayed && (
    <div className="track-step active warning">
      <div className="track-circle">!</div>
      <p>Delayed</p>
    </div>
  )}

  {/* Delivered */}
  <div
    className={`track-step ${
      order.status === "Delivered"
        ? "active"
        : ""
    }`}
  >
    <div className="track-circle">✓</div>
    <p>Delivered</p>
  </div>

</div>

  </div>

) : (

      <div className="delivery-success-card">

        <h3>🎉 Order Delivered</h3>

        <p>
          Delivered on
          <strong>
            {" "}
            {new Date(order.updatedAt).toLocaleDateString()}
          </strong>
        </p>

      </div>

    )}

    {/* ================= RETURN STATUS ================= */}

    {order.returnRequested &&
      order.returnStatus !== "Returned" && (

      <div className="return-card">

        <h3>🔄 Return Status</h3>

        <div className="return-tracking">

          <div
            className={`return-step ${
              [
                "Requested",
                "Pickup Assigned",
                "Picked Up",
              ].includes(order.returnStatus)
                ? "active"
                : ""
            }`}
          >
            ✓ Requested
          </div>

          <div
            className={`return-step ${
              [
                "Pickup Assigned",
                "Picked Up",
              ].includes(order.returnStatus)
                ? "active"
                : ""
            }`}
          >
            ✓ Pickup Assigned
          </div>

          <div
            className={`return-step ${
              order.returnStatus === "Picked Up"
                ? "active"
                : ""
            }`}
          >
            ✓ Refund Processing
          </div>

        </div>

      </div>

    )}

    {order.returnStatus === "Returned" && (

      <div className="refund-success-box">

        <h3>
          ✅ Refund Completed
        </h3>

        <p>
          ₹{Math.round(order.refundAmount)}
          has been refunded successfully.
        </p>

      </div>

    )}

    {/* ================= ACTION BUTTONS ================= */}

    <div className="order-action-buttons">

     {["Pending", "Confirmed"].includes(order.status) &&
 !order.items.some(
   (item) => item.isCustomized
 ) && (

  <button
    className="cancel-btn"
    onClick={() =>
      cancelOrder(order._id)
    }
  >
    Cancel Order
  </button>

)}
{order.items.some(item => item.isCustomized) &&
 ["Pending","Confirmed"].includes(order.status) && (
   <p className="custom-cancel-note">
     🎨 Customized products cannot be cancelled
   </p>
)}

      {order.status === "Delivered" && (
        <>

          {!order.returnRequested &&
            canReturnOrder(order) && (

            <button
              className="return-btn"
              onClick={() =>
                navigate(`/return/${order._id}`)
              }
            >
              Return Product
            </button>

          )}

          {!canReturnOrder(order) && (

            <p className="return-expired">
              Return period expired
            </p>

          )}

          {isReviewed(order._id) ? (

            <button
              className="review-btn reviewed"
              disabled
            >
              ⭐ Reviewed
            </button>

          ) : (

            <button
              className="review-btn"
              onClick={() =>
                navigate(`/review/${order._id}`)
              }
            >
              Write Review
            </button>

          )}

        </>
      )}
      <button
  className="invoice-icon-btn"
  onClick={() => generateInvoice(order)}
  title="Download Invoice"
  aria-label="Download Invoice"
>
  <FaFilePdf />
</button>

    </div>

  </div>
))}

{showTopBtn && (
  <button
    className="back-to-top-btn"
    onClick={scrollToTop}
  >
    ↑
  </button>
)}
</div>
  );
}