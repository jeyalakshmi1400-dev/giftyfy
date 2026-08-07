import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/adminOrders.css";
import AdminLayout from "../layout/AdminLayout";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import InvoicePDF from "../components/InvoicePDF";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FaCheckCircle,
  FaTruck,
  FaPaintBrush,
  FaUserCheck,
  FaShippingFast,
  FaBoxOpen,
  FaFilePdf,
  FaEye,
  FaFileExcel,
  FaHourglassHalf,
  FaTimesCircle,
  FaRedoAlt,
  FaBoxes,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaDownload,
} from "react-icons/fa";

export default function AdminOrders() {

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
   const [currentPage, setCurrentPage] = useState(1);
  const [orderPerPage] = useState(10);
const [invoiceOrder, setInvoiceOrder] = useState(null);
const [filter, setFilter] = useState({
  location: "",
  from: "",
  to: "",
  status: ""
});

const shippingRef = useRef();
const invoiceRef = useRef();
  // =========================
// EXPORT EXCEL
// =========================
const exportToExcel = () => {

  try {

    // Page-la filter aana orders mattum
    let latestOrders = [...filteredOrders];

    // =========================
    // EXCEL DATA
    // =========================

    const excelData = latestOrders.map((order) => ({

      OrderID: order._id,

      Customer: order.name || "-",

      Email: order.user?.email || "-",

      Phone: order.phone || "-",

      Address: order.address || "-",

      Pincode: order.deliveryPincode || "-",

      Payment: order.paymentMethod || "COD",

      Status: order.status,

      Customized: order.items.some(item => item.isCustomized)
        ? "Yes"
        : "No",

      Items: order.items
        .map(item => `${item.name} x${item.quantity}`)
        .join(", "),

      Total: order.totalAmount,

      Date: new Date(order.createdAt).toLocaleString()

    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Orders"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const data = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
      }
    );

    saveAs(
      data,
      `orders_${Date.now()}.xlsx`
    );

  } catch (err) {

    console.log(err);

  }

};

  // =========================
  // FETCH ORDERS
  // =========================
  const fetchOrders = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:4000/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrders(
  (res.data.orders || []).sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  )
);

    } catch (err) {

      console.log(err);

    }

  };

  // =========================
  // STATUS UPDATE
  // =========================
const updateOrderStatus = async (order) => {
  try {
    const token = localStorage.getItem("token");

    let nextStatus = "";
    let customizationStatus = "";

    const hasCustomized = order.items.some(
      (item) => item.isCustomized
    );

    if (order.status === "Pending") {

      nextStatus = "Confirmed";

    } else if (
      order.status === "Confirmed" &&
      hasCustomized
    ) {

      nextStatus = "Customization In Progress";
      customizationStatus = "In Progress";

    } else if (
      order.status === "Confirmed" &&
      !hasCustomized
    ) {

      nextStatus = "Shipped";

    } else if (
      order.status === "Customization In Progress"
    ) {

      nextStatus = "Shipped";
      customizationStatus = "Completed";

    } else {
      return;
    }

    console.log({
      status: nextStatus,
      customizationStatus,
    });

    await axios.put(
      `http://localhost:4000/api/orders/${order._id}/status`,
      {
        status: nextStatus,
        customizationStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchOrders();

  } catch (err) {
    console.log(err.response?.data || err.message);
  }
};


  // =========================
  // FILTERED ORDERS (STEP 1)
  // =========================
  const filteredOrders = orders.filter((order) => {

    if (
      filter.location &&
      order.deliveryPincode !== filter.location
    ) return false;

    if (filter.status) {

      if (filter.status === "Customized") {
        if (!order.items.some(i => i.isCustomized)) return false;
      } else if (order.status !== filter.status) {
        return false;
      }

    }

   if (filter.from && filter.to) {

  const fromDate = new Date(filter.from);

  const toDate = new Date(filter.to);
  toDate.setHours(23, 59, 59, 999);

  const orderDate = new Date(order.createdAt);

  if (orderDate < fromDate || orderDate > toDate) {
    return false;
  }

}

    return true;
  });

  // =========================
  // PAGINATION (STEP 2)
  // =========================
  const indexOfLastOrder = currentPage * orderPerPage;
  const indexOfFirstOrder = indexOfLastOrder - orderPerPage;

  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // =========================
  // RESET PAGE ON FILTER CHANGE
  // =========================
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);




  // =========================
  // USE EFFECT
  // =========================
  useEffect(() => {

    fetchOrders();

    const interval = setInterval(() => {

      fetchOrders()

    }, 5000);

    return () => clearInterval(interval);

  }, []);

  const downloadImage = async (imageName) => {
  try {
    const response = await axios.get(
      `http://localhost:4000/uploads/${imageName}`,
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", imageName);

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.log(err);
    alert("Image download failed");
  }
};

const generateInvoice = async (order) => {
  setInvoiceOrder(order);

  setTimeout(async () => {
    try {
      if (!shippingRef.current || !invoiceRef.current) {
        return;
      }

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // =========================
      // PAGE 1 : SHIPPING LABEL
      // =========================
      const shippingCanvas = await html2canvas(shippingRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const shippingImg = shippingCanvas.toDataURL("image/png");

      const shippingRatio =
        shippingCanvas.width / shippingCanvas.height;

      let shippingWidth = pageWidth;
      let shippingHeight = shippingWidth / shippingRatio;

      if (shippingHeight > pageHeight) {
        shippingHeight = pageHeight;
        shippingWidth = shippingHeight * shippingRatio;
      }

      const shippingX =
        (pageWidth - shippingWidth) / 2;

      pdf.addImage(
        shippingImg,
        "PNG",
        shippingX,
        0,
        shippingWidth,
        shippingHeight
      );

      // =========================
      // PAGE 2 : TAX INVOICE
      // =========================
      pdf.addPage();

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

      pdf.save(`Invoice_${order._id}.pdf`);
      setInvoiceOrder(null);
    } catch (err) {
      console.error(err);
    }
  }, 500);
};

  // =========================
  // RESET FILTERS (UI convenience only — does not alter fetch/filter/pagination logic)
  // =========================
  const resetFilters = () => {
    setFilter({
      location: "",
      from: "",
      to: "",
      status: ""
    });
  };

  // =========================
  // STATUS DISPLAY HELPERS (presentation only)
  // =========================
  const statusMeta = {
    "Pending": { icon: <FaHourglassHalf />, className: "pending", label: "Pending" },
    "Confirmed": { icon: <FaCheckCircle />, className: "confirmed", label: "Confirmed" },
    "Customization In Progress": { icon: <FaPaintBrush />, className: "customization-in-progress", label: "Customizing" },
    "Shipped": { icon: <FaTruck />, className: "shipped", label: "Shipped" },
    "Assigned": { icon: <FaUserCheck />, className: "assigned", label: "Assigned" },
    "Out for Delivery": { icon: <FaShippingFast />, className: "out-for-delivery", label: "Out for Delivery" },
    "Delivered": { icon: <FaBoxOpen />, className: "delivered", label: "Delivered" },
    "Cancelled": { icon: <FaTimesCircle />, className: "cancelled", label: "Cancelled" },
  };

  const getStatusMeta = (status) =>
    statusMeta[status] || { icon: <FaHourglassHalf />, className: "pending", label: status };

  return (

  <AdminLayout>

     <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
      }}
    >
      <InvoicePDF
  order={invoiceOrder}
  shippingRef={shippingRef}
  invoiceRef={invoiceRef}
/>
    </div>

    {/* ========================= */
/* ORDER MODAL */
/* ========================= */}

{selectedOrder && (

  <div className="admin-order-modal" onClick={() => setSelectedOrder(null)}>

    <div className="admin-order-modal-content" onClick={(e) => e.stopPropagation()}>

      {/* HEADER */}
      <div className="admin-order-modal-header">

        <h2>Order Details</h2>

        <button
          className="admin-order-close"
          onClick={() =>
            setSelectedOrder(null)
          }
          title="Close"
        >
          <FaTimes />
        </button>

      </div>

      <div className="admin-order-modal-body">

      {/* CUSTOMER */}
      <div className="admin-order-section admin-info-card">

        <h3 className="admin-info-card-title">Customer Information</h3>

        <div className="admin-info-grid">

          <p>
            <span className="admin-info-label">Date</span>
            <span className="admin-info-value">
              {new Date(selectedOrder.createdAt).toDateString()}
            </span>
          </p>

          <p>
            <span className="admin-info-label">Customer</span>
            <span className="admin-info-value">{selectedOrder.name}</span>
          </p>

          <p>
            <span className="admin-info-label">Email</span>
            <span className="admin-info-value">{selectedOrder.user?.email}</span>
          </p>

          <p>
            <span className="admin-info-label">Phone</span>
            <span className="admin-info-value">{selectedOrder.phone}</span>
          </p>

          <p className="admin-info-full">
            <span className="admin-info-label">Address</span>
            <span className="admin-info-value">{selectedOrder.address}</span>
          </p>

          <p>
            <span className="admin-info-label">Payment</span>
            <span className="admin-info-value">{selectedOrder.paymentMethod}</span>
          </p>

        </div>

      </div>

      {/* DELIVERY PARTNER */}
      {selectedOrder.deliveryPartner && (

        <div className="admin-delivery-box admin-info-card">

          <h3 className="admin-info-card-title">Delivery Partner</h3>

          <div className="admin-info-grid">

            <p>
              <span className="admin-info-label">Name</span>
              <span className="admin-info-value">{selectedOrder.deliveryPartner.name}</span>
            </p>

            <p>
              <span className="admin-info-label">Phone</span>
              <span className="admin-info-value">{selectedOrder.deliveryPartner.phone}</span>
            </p>

            <p>
              <span className="admin-info-label">Email</span>
              <span className="admin-info-value">{selectedOrder.deliveryPartner.email}</span>
            </p>

          </div>

        </div>

      )}

      {/* ITEMS */}
      <div className="admin-order-items admin-info-card">

        <h3 className="admin-info-card-title">Ordered Items</h3>

        {selectedOrder.items.map(
          (item, i) => (

            <div
              key={i}
              className="admin-modal-item"
            >

              <img
                src={`http://localhost:4000/uploads/${item.image}`}
                alt=""
                className="admin-modal-img"
              />

              <div className="admin-modal-item-info">

                <h4>{item.name}</h4>

                <div className="admin-modal-item-meta">

                  <span className="admin-qty-pill">Qty: {item.quantity}</span>

                  {item.size && (
                    <span className="admin-meta-pill">Size: {item.size}</span>
                  )}

                  {item.variant && (
                    <span className="admin-meta-pill">Variant: {item.variant}</span>
                  )}

                </div>

                {item.isCustomized && (

                  <div className="admin-custom-order-box">

                    <span className="admin-custom-badge">
                      🎨 Customized
                    </span>
                      {item.customName && (
      <p>
        <b>Custom Name:</b> {item.customName}
      </p>
    )}

                    {item.message && (
                      <p>
                        <b>Message:</b>{" "}
                        {item.message}
                      </p>
                    )}

               {item.extraImages?.length > 0 && (

  <div className="admin-custom-images">

 {item.extraImages?.map((img, index) => {

  console.log("Custom Image:", img);

  return (
    <div
  key={index}
  className="admin-custom-image-box"
>
  <img
    src={`http://localhost:4000/uploads/${img}`}
    alt="Customized"
    className="admin-custom-preview"
  />

  <button
  className="admin-download-btn"
  onClick={() => downloadImage(img)}
>
  <FaDownload /> Download
</button>
</div>
  );

})}

  </div>

)}

                  </div>

                )}

              </div>

            </div>

          )
        )}

      </div>

      {/* TOTAL */}
      <div className="admin-order-total admin-info-card">

        <h3 className="admin-info-card-title">Order Summary</h3>

        <div className="admin-summary-row">
          <span>Subtotal</span>
          <span>₹{Math.round(selectedOrder.subtotal)}</span>
        </div>

        <div className="admin-summary-row">
          <span>Discount</span>
          <span>₹{Math.round(selectedOrder.discount || 0)}</span>
        </div>

        <div className="admin-summary-row admin-summary-total">
          <span>Total</span>
          <span>₹{Math.round(selectedOrder.totalAmount)}</span>
        </div>

      </div>

      </div>

    </div>

  </div>

)}

  <div className="admin-orders-page">

      {/* ========================= */}
      {/* LEFT */}
      {/* ========================= */}

      <div className="admin-orders-left">

       <div className="admin-orders-header">

  <div className="admin-orders-header-left">

    <h2 className="admin-orders-title">
      Order Management
    </h2>

    <span className="admin-orders-count-badge">
      <FaBoxes /> {filteredOrders.length} Orders
    </span>

  </div>

  <div className="admin-export-section">

    <button
      className="admin-export-btn"
      onClick={exportToExcel}
    >
      <FaFileExcel /> Export Excel
    </button>

  </div>

</div>


        {/* ========================= */}
        {/* FILTERS */}
        {/* ========================= */}

        <div className="admin-filters-card">

        <div className="admin-orders-filters">

          <div className="admin-filter-field">

            <label className="admin-filter-label">Location</label>

            <select
              className="admin-orders-select"
              value={filter.location}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  location: e.target.value
                })
              }
            >

              <option value="">
                All Locations
              </option>

              {[
                ...new Set(
                  orders.map(
                    (o) => o.deliveryPincode
                  )
                )
              ]

                .filter(Boolean)

                .map((pin, index) => (

                  <option
                    key={index}
                    value={pin}
                  >
                    {pin}
                  </option>

                ))}

            </select>

          </div>

          <div className="admin-filter-field">

            <label className="admin-filter-label">From Date</label>

            <input
              type="date"
              value={filter.from}
              className="admin-orders-date"
              onChange={(e) =>
                setFilter({
                  ...filter,
                  from: e.target.value
                })
              }
            />

          </div>

          <div className="admin-filter-field">

            <label className="admin-filter-label">To Date</label>

            <input
              type="date"
              value={filter.to}
              className="admin-orders-date"
              onChange={(e) =>
                setFilter({
                  ...filter,
                  to: e.target.value
                })
              }
            />

          </div>

          <div className="admin-filter-field">

            <label className="admin-filter-label">Status</label>

            <select
              className="admin-orders-select"
              value={filter.status}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: e.target.value
                })
              }
            >

              <option value="">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>
              <option value="Customized">
                Customized Orders
              </option>

              <option value="Customization In Progress">
                Customization In Progress
              </option>

              <option value="Confirmed">
                Confirmed
              </option>

              <option value="Shipped">
                Shipped
              </option>

              <option value="Delivered">
                Delivered
              </option>

              <option value="Cancelled">
                Cancelled
              </option>

            </select>

          </div>

          <div className="admin-filter-field admin-filter-reset">

            <label className="admin-filter-label admin-filter-label-hidden">Reset</label>

            <button
              className="admin-reset-btn"
              onClick={resetFilters}
              title="Reset Filters"
            >
              <FaRedoAlt /> Reset
            </button>

          </div>

        </div>

        </div>

        {/* ========================= */}
        {/* TABLE */}
        {/* ========================= */}

        <div className="admin-orders-table-wrapper">

          <div className="admin-orders-table-scroll">

          <table className="admin-orders-table">

            <thead>

              <tr>

                <th>Order</th>
                <th>Items</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Location</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>
            {currentOrders.map((order) => (


                  <tr key={order._id}>

                    {/* ORDER */}
                    <td>
                      <span className="admin-order-id-badge">
                        #{order._id.slice(-4)}
                      </span>
                    </td>

                    {/* PRODUCTS */}
                    <td className="admin-orders-product-cell">

                      {order.items.map(
                        (item, i) => (

                          <div
                            key={i}
                            className="admin-orders-product-row"
                          >

                            <img
                              src={`http://localhost:4000/uploads/${item.image}`}
                              alt=""
                              className="admin-orders-product-img"
                            />

                            <div className="admin-orders-product-info">

                              <p className="admin-orders-product-name">
                                {item.name}
                              </p>

                              <div className="admin-orders-product-tags">

                                <span className="admin-orders-product-qty">
                                  Qty {item.quantity}
                                </span>

                                {item.size && (
                                  <span className="admin-orders-product-qty">
                                    Size {item.size}
                                  </span>
                                )}

                                {item.variant && (
                                  <span className="admin-orders-product-qty">
                                    {item.variant}
                                  </span>
                                )}

                              </div>

                              {/* CUSTOMIZED */}
                              {item.isCustomized && (
                                <div className="admin-customized-tag">
                                  🎁 Customized
                                </div>
                              )}

                            </div>

                          </div>

                        )
                      )}

                    </td>

                    {/* CUSTOMER */}
                    <td className="admin-orders-user-cell">

                      <p className="admin-user-name">
                        {order.name || "-"}
                      </p>

                      <p className="admin-user-sub">
                        {order.user?.email || "-"}
                      </p>

                      <p className="admin-user-sub">
                        {order.phone || "-"}
                      </p>

                    </td>

                    {/* DATE */}
                    <td>

                      {
                        new Date(
                          order.createdAt
                        ).toLocaleDateString()
                      }

                    </td>

                    {/* LOCATION */}
                    <td>

                      {
                        order.deliveryPincode
                      }

                    </td>

                    {/* PAYMENT */}
                    <td>

                      <span className="admin-orders-payment-badge">

                        {
                          order.paymentMethod ||
                          "COD"
                        }

                      </span>

                    </td>

                    {/* STATUS */}
<td>

  <div className="admin-status-wrapper">

    {/* CUSTOMIZED TAG */}
    {order.items.some(
      (item) => item.isCustomized
    ) && (
      <span className="admin-custom-pill">
        🎁 Customized
      </span>
    )}

    {/* STATUS BADGE */}
    <span
      className={`admin-orders-status ${getStatusMeta(order.status).className}`}
    >

      {getStatusMeta(order.status).icon}

      {order.status ===
      "Customization In Progress"
        ? "Customizing"
        : order.status}

    </span>

  </div>

</td>

                    {/* ACTION */}
<td>

<div className="admin-action-buttons">

  {/* STATUS UPDATE */}
  <button
    className={`action-icon-btn status-btn ${order.status
      ?.toLowerCase()
      .replace(/\s/g, "-")}`}
    disabled={
      order.status === "Delivered" ||
      order.status === "Cancelled"
    }
    onClick={() => updateOrderStatus(order)}
    title={
      order.status === "Pending"
        ? "Confirm Order"
        : order.status === "Confirmed"
        ? order.items.some((item) => item.isCustomized)
          ? "Start Customization"
          : "Ship Order"
        : order.status === "Customization In Progress"
        ? "Customization Completed"
        : order.status === "Shipped"
        ? "Waiting Delivery Partner"
        : order.status === "Assigned"
        ? "Assigned"
        : order.status === "Out for Delivery"
        ? "Out For Delivery"
        : "Delivered"
    }
  >
    {order.status === "Pending" && <FaCheckCircle />}

    {order.status === "Confirmed" &&
      (order.items.some((item) => item.isCustomized) ? (
        <FaPaintBrush />
      ) : (
        <FaTruck />
      ))}

    {order.status === "Customization In Progress" && (
      <FaPaintBrush />
    )}

    {order.status === "Shipped" && <FaUserCheck />}

    {order.status === "Assigned" && <FaUserCheck />}

    {order.status === "Out for Delivery" && (
      <FaShippingFast />
    )}

    {order.status === "Delivered" && <FaBoxOpen />}
  </button>

  {/* DOWNLOAD PDF */}
  {[
    "Confirmed",
    "Customization In Progress",
    "Shipped",
    "Assigned",
    "Out for Delivery",
    "Delivered",
  ].includes(order.status) && (
    <button
      className="action-icon-btn pdf-btn"
      onClick={(e) => {
        e.stopPropagation();
        generateInvoice(order);
      }}
      title="Download Invoice"
    >
      <FaFilePdf />
    </button>
  )}

  {/* VIEW DETAILS */}
  <button
    className="action-icon-btn view-btn"
    onClick={() => setSelectedOrder(order)}
    title="View Details"
  >
    <FaEye />
  </button>

</div>
</td>

                  </tr>

                ))}

            </tbody>

          </table>

          </div>

           <div className="pagination">

          <button
            onClick={() =>
              setCurrentPage((p) => (p > 1 ? p - 1 : 1))
            }
            disabled={currentPage === 1}
          >
            <FaChevronLeft /> Prev
          </button>

          <span>
            Page {currentPage}
          </span>

          <button
            onClick={() =>
              setCurrentPage((p) =>
                indexOfLastOrder < filteredOrders.length ? p + 1 : p
              )
            }
            disabled={indexOfLastOrder >= filteredOrders.length}
          >
            Next <FaChevronRight />
          </button>

        </div>


        </div>

      </div>

  </div>

    </AdminLayout>

  );

}