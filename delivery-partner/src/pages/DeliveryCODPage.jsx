import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/deliveryCOD.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DeliveryCODPage() {

  // ================= STATES =================

  const [partner, setPartner] = useState(null);
  const [payments, setPayments] = useState([]);
  const [codOrders, setCodOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  const [selectedOrders, setSelectedOrders] = useState([]);

  const [loading, setLoading] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);

  const [notes, setNotes] = useState("");

// ================= FILTERS =================

const [search, setSearch] = useState("");

const [statusFilter, setStatusFilter] = useState("All");

const [fromDate, setFromDate] = useState("");

const [toDate, setToDate] = useState("");

const [sortBy, setSortBy] = useState("Newest");


// ================= PAGINATION =================

const [currentPage, setCurrentPage] = useState(1);

const [rowsPerPage, setRowsPerPage] = useState(10);
  // ================= FETCH PARTNER =================

  const fetchPartner = async () => {
    try {

      const res = await axios.get(
        "http://localhost:4000/api/delivery/profile",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "deliveryToken"
            )}`,
          },
        }
      );

      setPartner(res.data.partner);

    } catch (err) {

      console.log(err);

    }
  };

  
  // ================= FETCH PAYMENT HISTORY =================

  const fetchPayments = async () => {

    try {

      const res = await axios.get(
        "http://localhost:4000/api/delivery-payment/my",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "deliveryToken"
            )}`,
          },
        }
      );

      setPayments(res.data.payments || []);

    } catch (err) {

      console.log(err);

    }
  };

  // ================= FETCH COD ORDERS =================

  const fetchCODOrders = async () => {

    try {

      const token =
        localStorage.getItem("deliveryToken");

      const { data } = await axios.get(
        "http://localhost:4000/api/delivery/cod-orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCodOrders(data.orders || []);

      setPendingOrders(
        (data.orders || []).filter(
          (order) =>
            order.codStatus === "Collected"
        )
      );

    } catch (err) {

      console.log(err);

    }

  };
const fetchPendingOrders = async () => {
  try {

    const token =
      localStorage.getItem("deliveryToken");

    const { data } = await axios.get(
      "http://localhost:4000/api/delivery/cod-orders",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const collected =
      data.orders.filter(
        (o) => o.codStatus === "Collected"
      );

    setPendingOrders(collected);

  } catch (err) {

    console.log(err);

  }
};

  // ================= LOAD =================

  useEffect(() => {

    fetchPartner();

    fetchPayments();

    fetchCODOrders();

  }, []);

  // ================= CARD CALCULATIONS =================

  const totalCOD = codOrders.reduce(
    (sum, order) =>
      sum + Number(order.amount || 0),
    0
  );

  const pendingCOD = codOrders
    .filter(
      (o) =>
        o.codStatus === "Collected"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.amount || 0),
      0
    );

  const submittedCOD = codOrders
    .filter(
      (o) =>
        o.codStatus === "Submitted"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.amount || 0),
      0
    );

  const settledCOD = codOrders
    .filter(
      (o) =>
        o.codStatus === "Settled"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.amount || 0),
      0
    );

  // ================= SELECT ORDER =================

const toggleOrder = (orderId) => {

  if (selectedOrders.includes(orderId)) {

    setSelectedOrders(
      selectedOrders.filter(
        (id) => id !== orderId
      )
    );

  } else {

    setSelectedOrders([
      ...selectedOrders,
      orderId,
    ]);

  }

};

  // ================= SELECT ALL =================

  const handleSelectAll = () => {

    if (
      selectedOrders.length ===
      pendingOrders.length
    ) {

      setSelectedOrders([]);

    } else {

      setSelectedOrders(
        pendingOrders
      );

    }

  };

  // ================= SELECTED TOTAL =================

  const selectedAmount =
    selectedOrders.reduce(
      (sum, order) =>
        sum +
        Number(order.amount || 0),
      0
    );

 const selectedTotal = selectedOrders.reduce(
  (sum, order) => sum + Number(order.amount || 0),
  0
);

const handleTransfer = async () => {
  try {

    if (selectedOrders.length === 0) {
      return alert("Select at least one order");
    }
console.log("Selected Orders =", selectedOrders);

console.log(
  "Sending =",
  selectedOrders.map((o) => o._id)
);
    setLoading(true);

    const token = localStorage.getItem("deliveryToken");

    const { data } = await axios.post(
      "http://localhost:4000/api/delivery-payment/request",
      {
        selectedOrders: selectedOrders.map(
          (o) => o._id
        ),
        notes,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(data.message);

    setShowTransfer(false);
    setSelectedOrders([]);

    fetchPayments();
    fetchPendingOrders();

  } catch (err) {

    console.log(err.response?.data);

    alert(
      err.response?.data?.message ||
      "Something went wrong"
    );

  } finally {

    setLoading(false);

  }
};

const exportExcel = () => {

  const data = filteredOrders.map((order) => ({

    OrderID: order._id,

    Customer: order.customer,

    Amount: order.amount,

    Delivered: order.date,

    Submitted: order.codSubmittedAt
      ? new Date(order.codSubmittedAt).toLocaleString("en-IN")
      : "-",

    Status: order.codStatus,

  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "COD History"
  );

  XLSX.writeFile(
    workbook,
    "COD_Submission_History.xlsx"
  );

};


const exportPDF = () => {

  const doc = new jsPDF();

  doc.setFontSize(18);

  doc.text(
    "COD Submission History",
    14,
    15
  );

  autoTable(doc, {

    startY: 25,

    head: [[
      "Order",
      "Customer",
      "Amount",
      "Delivered",
      "Submitted",
      "Status"
    ]],

    body: filteredOrders.map((order) => [

      order._id.slice(-6),

      order.customer,

      `₹${order.amount}`,

      order.date,

      order.codSubmittedAt
        ? new Date(order.codSubmittedAt)
            .toLocaleString("en-IN")
        : "-",

      order.codStatus

    ])

  });

  doc.save("COD_History.pdf");

};



const resetFilters = () => {

  setSearch("");

  setStatusFilter("All");

  setFromDate("");

  setToDate("");

  setSortBy("Newest");

  setRowsPerPage(10);

  setCurrentPage(1);

};

  const totalAmount =
  pendingOrders
    .filter((o) =>
      selectedOrders.includes(o._id)
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.amount),
      0
    );
  
const historyOrders = codOrders
  .filter(order =>
    ["Submitted", "Settled"].includes(order.codStatus)
  )
  .sort((a, b) => {
    return (
      new Date(b.codSubmittedAt || b.createdAt) -
      new Date(a.codSubmittedAt || a.createdAt)
    );
  });


// Search

let filteredOrders = historyOrders.filter((order) => {

  const keyword = search.toLowerCase();

  return (

    order.customer?.toLowerCase().includes(keyword) ||

    order._id.toLowerCase().includes(keyword)

  );

});


// Status

if (statusFilter !== "All") {

  filteredOrders = filteredOrders.filter(

    (order) => order.codStatus === statusFilter

  );

}


// Date

if (fromDate) {

  filteredOrders = filteredOrders.filter(

    (order) =>

      new Date(order.codSubmittedAt) >=

      new Date(fromDate)

  );

}

if (toDate) {

  filteredOrders = filteredOrders.filter(

    (order) =>

      new Date(order.codSubmittedAt) <=

      new Date(toDate)

  );

}


// Sort

filteredOrders.sort((a, b) => {

  // Use COD Submitted Date. If not available, fallback to Created Date.
  const dateA = new Date(a.codSubmittedAt || a.createdAt || 0);
  const dateB = new Date(b.codSubmittedAt || b.createdAt || 0);

  switch (sortBy) {

    case "Newest":
      return dateB - dateA;

    case "Oldest":
      return dateA - dateB;

    case "Amount High":
      return Number(b.amount || 0) - Number(a.amount || 0);

    case "Amount Low":
      return Number(a.amount || 0) - Number(b.amount || 0);

    default:
      return dateB - dateA;
  }

});


const remainingPendingCOD = pendingCOD - selectedAmount;
const lastIndex = currentPage * rowsPerPage;

const firstIndex = lastIndex - rowsPerPage;

const currentOrders = filteredOrders.slice(

  firstIndex,

  lastIndex

);

const totalPages = Math.ceil(

  filteredOrders.length / rowsPerPage

);

  
return (
   <div className="dn2-page-wrap">

   

    <div className="wallet-page">

      {/* HEADER */}

      <div className="wallet-header">

        <div>

          <h2>COD Settlement 💵</h2>

          <p>
            Submit collected COD to Admin
          </p>

        </div>

        <button
          className="transfer-btn"
          onClick={() => setShowTransfer(true)}
        >
          Submit COD
        </button>

      </div>

      {/* TOP CARDS */}

      <div className="wallet-cards">

        <div className="wallet-card orange">

          <div className="wallet-card-icon">
            📦
          </div>

          <div>

            <h5>Total COD</h5>

            <h2>₹{Math.round(totalCOD)}</h2>

          </div>

        </div>

        <div className="wallet-card red">

          <div className="wallet-card-icon">
            ⏳
          </div>

          <div>

            <h5>Pending COD</h5>

            <h2>₹{Math.round(pendingCOD)}</h2>

          </div>

        </div>

        <div className="wallet-card blue">

          <div className="wallet-card-icon">
            📤
          </div>

          <div>

            <h5>Submitted COD</h5>

            <h2>₹{Math.round(submittedCOD)}</h2>

          </div>

        </div>

        <div className="wallet-card green">

          <div className="wallet-card-icon">
            ✅
          </div>

          <div>

            <h5>Settled COD</h5>

            <h2>₹{Math.round(settledCOD)}</h2>

          </div>

        </div>

      </div>

{/* ================= FILTER BAR ================= */}

<div className="history-filter-bar">

  {/* Search */}

  <input
    type="text"
    placeholder="Search Order ID / Customer..."
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setCurrentPage(1);
    }}
    className="filter-input"
  />

  {/* Status */}

  <select
    value={statusFilter}
    onChange={(e) => {
      setStatusFilter(e.target.value);
      setCurrentPage(1);
    }}
    className="filter-select"
  >
    <option value="All">All Status</option>
    <option value="Submitted">Submitted</option>
    <option value="Settled">Settled</option>
  </select>

  {/* From Date */}

  <input
    type="date"
    value={fromDate}
    onChange={(e) => {
      setFromDate(e.target.value);
      setCurrentPage(1);
    }}
    className="filter-date"
  />

  {/* To Date */}

  <input
    type="date"
    value={toDate}
    onChange={(e) => {
      setToDate(e.target.value);
      setCurrentPage(1);
    }}
    className="filter-date"
  />

  {/* Sort */}

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="filter-select"
  >
    <option>Newest</option>
    <option>Oldest</option>
    <option>Amount High</option>
    <option>Amount Low</option>
  </select>

<div className="filter-actions">

  <button
    className="excel-btn"
    onClick={exportExcel}
  >
    📗 Excel
  </button>

  <button
    className="pdf-btn"
    onClick={exportPDF}
  >
    📄 PDF
  </button>

  <button
    className="reset-btn"
    onClick={resetFilters}
  >
    🔄 Reset
  </button>

</div>
</div>
      {/* HISTORY */}
<div className="history-section">

  <h3>COD Submission History</h3>

  <div className="history-header-row">
    <div>Order ID</div>
    <div>Product</div>
    <div>COD</div>
    <div>Delivered</div>
    <div>Submitted</div>
    <div>Status</div>
  </div>

  <div className="history-list">

    {currentOrders.length > 0 ? (

      currentOrders.map((order) => (

        <div
          className="history-row"
          key={order._id}
        >

          <div>
            #{order._id.slice(-6)}
          </div>

          <div className="product-col">

            <img
              src={`http://localhost:4000/uploads/${order.items?.[0]?.image}`}
              alt=""
            />

            <div>
              <h5>{order.items?.[0]?.name}</h5>
              <small>
                Qty : {order.items?.[0]?.quantity}
              </small>
            </div>

          </div>

          <div>
            ₹{order.amount}
          </div>

          <div>
            {order.date}
          </div>
          <div>
  {order.codSubmittedAt
    ? new Date(order.codSubmittedAt).toLocaleString("en-IN")
    : "-"}
</div>

          <div>

            <span
              className={`status ${order.codStatus}`}
            >
              {order.codStatus}
            </span>

          </div>

        </div>

      ))

    ) : (

      <div className="empty-history">
        No COD History
      </div>

    )}

  </div>

</div>
{/* ================= PAGINATION ================= */}

<div className="pagination-wrapper">

  <div className="pagination-info">

    Showing{" "}
    <strong>
      {filteredOrders.length === 0 ? 0 : firstIndex + 1}
    </strong>{" "}
    to{" "}
    <strong>
      {Math.min(lastIndex, filteredOrders.length)}
    </strong>{" "}
    of{" "}
    <strong>{filteredOrders.length}</strong>{" "}
    entries

  </div>

  <div className="pagination-controls">

    {/* Rows Per Page */}

    <select
      value={rowsPerPage}
      onChange={(e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
      }}
      className="rows-select"
    >
      <option value={5}>5</option>
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
    </select>

    {/* Previous */}

    <button
      className="page-btn"
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage(currentPage - 1)
      }
    >
      ◀ Previous
    </button>

    {/* Page Numbers */}

    {Array.from(
      { length: totalPages },
      (_, index) => (

        <button
          key={index}
          className={
            currentPage === index + 1
              ? "page-btn active-page"
              : "page-btn"
          }
          onClick={() =>
            setCurrentPage(index + 1)
          }
        >
          {index + 1}
        </button>

      )
    )}

    {/* Next */}

    <button
      className="page-btn"
      disabled={currentPage === totalPages}
      onClick={() =>
        setCurrentPage(currentPage + 1)
      }
    >
      Next ▶
    </button>

  </div>

</div>

      {/* MODAL */}

      {showTransfer && (

        <div className="wallet-modal">

          <div className="wallet-modal-box">

            <div className="modal-header">

              <h2>
                Submit COD Settlement
              </h2>

              <button
                onClick={() =>
                  setShowTransfer(false)
                }
              >
                ✕

              </button>

            </div>

            <div className="available-box">

              <span>
                Pending COD
              </span>

             <h2>₹{Math.round(remainingPendingCOD)}</h2>

            </div>

            {/* SELECT ALL */}

            <div className="select-all-box">

              <label>

                <input
                  type="checkbox"
                  checked={
                    pendingOrders.length > 0 &&
                    selectedOrders.length ===
                      pendingOrders.length
                  }
                  onChange={handleSelectAll}
                />

                Select All Orders

              </label>

            </div>

            {/* ORDER LIST */}

            <div className="order-list">

              {pendingOrders.length > 0 ? (

                pendingOrders.map((order) => (
  
                  <div
                    className="order-item"
                    key={order._id}
                  >

                    <label className="order-check">

                      <input
                        type="checkbox"
                        checked={selectedOrders.some(
                          (o) =>
                            o._id === order._id
                        )}
                        onChange={() =>
                          toggleOrder(order)
                        }
                      />

                      <div>

                        <h4>
                          Order #
                          {order._id.slice(-6)}
                        </h4>

                        <p>
                          {order.customer}
                        </p>
<div>
  Deliverd-{order.date}
</div>

                      </div>

                    </label>

                    <strong>
                      ₹{order.amount}
                    </strong>

                  </div>

                ))

              ) : (

                <div className="empty-history">

                  No Pending Orders

                </div>

              )}

            </div>

            {/* TOTAL */}

            <div className="selected-total">

              <h3>

                Selected Orders :
                {" "}
                {selectedOrders.length}

              </h3>

              <h2>

                ₹{selectedAmount}

              </h2>

            </div>

            {/* NOTES */}

            <div className="form-group">

              <label>

                Notes

              </label>

              <textarea

                rows="4"

                value={notes}

                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }

                placeholder="Optional"

              />

            </div>

            {/* FOOTER */}

            <div className="modal-footer">

              <button

                className="cancel-btn"

                onClick={() =>
                  setShowTransfer(false)
                }

              >

                Cancel

              </button>

              <button

                className="confirm-transfer"

                onClick={handleTransfer}

                disabled={loading}

              >

                {loading
                  ? "Submitting..."
                  : `Submit ₹${selectedAmount}`}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  </div>
);

}