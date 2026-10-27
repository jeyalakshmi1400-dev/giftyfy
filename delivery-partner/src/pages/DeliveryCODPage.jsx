import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/deliveryCOD.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { useLocation

 } from "react-router-dom";

export default function DeliveryCODPage() {
  // =====================================================
  // STATES
  // =====================================================

  const [partner, setPartner] = useState(null);

  const [payments, setPayments] = useState([]);

  const [codOrders, setCodOrders] = useState([]);
  const location = useLocation();

  // Only Collected orders are available for submission
  const [pendingOrders, setPendingOrders] = useState([]);

  // Always store complete order objects here
  const [selectedOrders, setSelectedOrders] = useState([]);

  const [loading, setLoading] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);

  const [notes, setNotes] = useState("");

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [sortBy, setSortBy] = useState("Newest");

  // =====================================================
  // PAGINATION
  // =====================================================

  const [currentPage, setCurrentPage] =
    useState(1);

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  // =====================================================
  // AUTH HEADER
  // =====================================================

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(
          "deliveryToken"
        )}`,
      },
    };
  };

  // =====================================================
  // FETCH PARTNER
  // =====================================================

  const fetchPartner = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/delivery/profile",
        getAuthConfig()
      );

      setPartner(res.data.partner || null);
    } catch (err) {
      console.log(
        "FETCH PARTNER ERROR 👉",
        err
      );
    }
  };

  // =====================================================
  // FETCH PAYMENT HISTORY
  // =====================================================

  const fetchPayments = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/delivery-payment/my",
        getAuthConfig()
      );

      setPayments(
        Array.isArray(res.data.payments)
          ? res.data.payments
          : []
      );
    } catch (err) {
      console.log(
        "FETCH PAYMENT HISTORY ERROR 👉",
        err
      );
    }
  };

  // =====================================================
  // FETCH COD ORDERS
  // =====================================================

  const fetchCODOrders = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/delivery/cod-orders",
        getAuthConfig()
      );

      const orders = Array.isArray(
        data.orders
      )
        ? data.orders
        : [];

      setCodOrders(orders);

      // -------------------------------------------------
      // IMPORTANT
      //
      // Only COLLECTED orders can be submitted.
      //
      // Submitted orders are already sent to Admin,
      // so they must NOT appear in Submit COD modal.
      // -------------------------------------------------

      const collected = orders.filter(
        (order) =>
          order.codStatus === "Collected"
      );

      setPendingOrders(collected);
    } catch (err) {
      console.log(
        "FETCH COD ORDERS ERROR 👉",
        err
      );
    }
  };

  // =====================================================
  // FETCH PENDING ORDERS
  // =====================================================

  const fetchPendingOrders = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/delivery/cod-orders",
        getAuthConfig()
      );

      const orders = Array.isArray(
        data.orders
      )
        ? data.orders
        : [];

      const collected = orders.filter(
        (order) =>
          order.codStatus === "Collected"
      );

      setPendingOrders(collected);

      // Keep main list updated too
      setCodOrders(orders);
    } catch (err) {
      console.log(
        "FETCH PENDING ORDERS ERROR 👉",
        err
      );
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchPartner();
    fetchPayments();
    fetchCODOrders();
  }, []);
useEffect(() => {

  if(
    location.state?.openSubmitModal
  ){

    setShowTransfer(true);

    window.history.replaceState(
      {},
      document.title
    );

  }

}, [location]);
  // =====================================================
  // CARD CALCULATIONS
  // =====================================================

  // -----------------------------------------------------
  // TOTAL COD
  // -----------------------------------------------------

  const totalCOD = codOrders.reduce(
    (sum, order) =>
      sum + Number(order.amount || 0),
    0
  );

  // -----------------------------------------------------
  // PENDING COD
  //
  // Only Collected
  // -----------------------------------------------------

  const pendingCOD = codOrders
    .filter(
      (order) =>
        order.codStatus === "Collected"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.amount || 0),
      0
    );

  // -----------------------------------------------------
  // SUBMITTED COD
  // -----------------------------------------------------

  const submittedCOD = codOrders
    .filter(
      (order) =>
        order.codStatus === "Submitted"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.amount || 0),
      0
    );

  // -----------------------------------------------------
  // SETTLED COD
  // -----------------------------------------------------

  const settledCOD = codOrders
    .filter(
      (order) =>
        order.codStatus === "Settled"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.amount || 0),
      0
    );

  // =====================================================
  // TODAY DATE RANGE
  // =====================================================

  const todayStart = useMemo(() => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  }, []);

  const todayEnd = useMemo(() => {
    const date = new Date();

    date.setHours(23, 59, 59, 999);

    return date;
  }, []);

  // =====================================================
  // TODAY SUBMITTED ORDERS
  // =====================================================

  const todaySubmittedOrders =
    useMemo(() => {
      return codOrders.filter((order) => {
        if (
          order.codStatus !== "Submitted" &&
          order.codStatus !== "Settled"
        ) {
          return false;
        }

        const submittedDate =
          order.codSubmittedAt ||
          order.codSettlement?.submittedAt;

        if (!submittedDate) {
          return false;
        }

        const date =
          new Date(submittedDate);

        return (
          date >= todayStart &&
          date <= todayEnd
        );
      });
    }, [
      codOrders,
      todayStart,
      todayEnd,
    ]);

  // =====================================================
  // TODAY SUBMITTED AMOUNT
  // =====================================================

  const todaySubmittedCOD =
    todaySubmittedOrders.reduce(
      (sum, order) =>
        sum + Number(order.amount || 0),
      0
    );

  // =====================================================
  // TODAY SUBMITTED COUNT
  // =====================================================

  const todaySubmittedCount =
    todaySubmittedOrders.length;

  // =====================================================
  // LAST SUBMITTED PAYMENT
  // =====================================================

  const lastSubmittedOrder =
    useMemo(() => {
      const sorted = [
        ...codOrders,
      ]
        .filter((order) => {
          return (
            order.codSubmittedAt ||
            order.codSettlement?.submittedAt
          );
        })
        .sort((a, b) => {
          const dateA =
            new Date(
              a.codSubmittedAt ||
                a.codSettlement
                  ?.submittedAt ||
                0
            );

          const dateB =
            new Date(
              b.codSubmittedAt ||
                b.codSettlement
                  ?.submittedAt ||
                0
            );

          return dateB - dateA;
        });

      return sorted[0] || null;
    }, [codOrders]);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return "—";
    }

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // =====================================================
  // SELECT ORDER
  // =====================================================

  const toggleOrder = (order) => {
    if (!order?._id) {
      return;
    }

    setSelectedOrders((prev) => {
      const alreadySelected =
        prev.some(
          (item) =>
            item._id === order._id
        );

      if (alreadySelected) {
        return prev.filter(
          (item) =>
            item._id !== order._id
        );
      }

      return [
        ...prev,
        order,
      ];
    });
  };

  // =====================================================
  // SELECT ALL
  // =====================================================

  const handleSelectAll = () => {
    if (pendingOrders.length === 0) {
      setSelectedOrders([]);
      return;
    }

    const allSelected =
      pendingOrders.every((order) =>
        selectedOrders.some(
          (selected) =>
            selected._id === order._id
        )
      );

    if (allSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders([
        ...pendingOrders,
      ]);
    }
  };

  // =====================================================
  // SELECTED TOTAL
  // =====================================================

  const selectedAmount =
    selectedOrders.reduce(
      (sum, order) =>
        sum +
        Number(order.amount || 0),
      0
    );

  // =====================================================
  // REMAINING PENDING
  // =====================================================

  const remainingPendingCOD =
    Math.max(
      0,
      pendingCOD - selectedAmount
    );

  // =====================================================
  // SUBMIT COD TO ADMIN
  // =====================================================

  const handleTransfer = async () => {
    try {
      if (
        selectedOrders.length === 0
      ) {
        return toast.warning(
          "Please select at least one order."
        );
      }

      if (selectedAmount <= 0) {
        return toast.warning(
          "Selected COD amount is invalid."
        );
      }

      setLoading(true);

      const token =
        localStorage.getItem(
          "deliveryToken"
        );

      // -------------------------------------------------
      // ONLY SEND ORDER IDS TO BACKEND
      // -------------------------------------------------

      const orderIds =
        selectedOrders.map(
          (order) => order._id
        );

      console.log(
        "COD SUBMISSION ORDER IDS =>",
        orderIds
      );

      const { data } =
        await axios.post(
          "http://localhost:4000/api/delivery-payment/request",
          {
            selectedOrders: orderIds,
            notes: notes.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      console.log(
        "COD SUBMISSION RESPONSE =>",
        data
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "COD submission failed"
        );
      }

      toast.success(
        data.message ||
          "COD payment submitted successfully."
      );

      // -------------------------------------------------
      // RESET MODAL
      // -------------------------------------------------

      setShowTransfer(false);

      setSelectedOrders([]);

      setNotes("");

      // -------------------------------------------------
      // REFRESH ALL DATA
      // -------------------------------------------------

      await Promise.all([
        fetchCODOrders(),
        fetchPendingOrders(),
        fetchPayments(),
      ]);
    } catch (err) {
      console.log(
        "COD SUBMIT ERROR 👉",
        err.response?.data || err
      );

      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HISTORY ORDERS
  //
  // Submitted + Settled
  // =====================================================

  const historyOrders =
    useMemo(() => {
      return codOrders.filter(
        (order) =>
          order.codStatus ===
            "Submitted" ||
          order.codStatus ===
            "Settled"
      );
    }, [codOrders]);

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredOrders =
    useMemo(() => {
      let result = [
        ...historyOrders,
      ];

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      const keyword =
        search.trim().toLowerCase();

      if (keyword) {
        result = result.filter(
          (order) => {
            const orderId =
              String(
                order.orderId || ""
              ).toLowerCase();

            const customer =
              String(
                order.customer || ""
              ).toLowerCase();

            return (
              orderId.includes(
                keyword
              ) ||
              customer.includes(
                keyword
              )
            );
          }
        );
      }

      // -------------------------------------------------
      // STATUS
      // -------------------------------------------------

      if (
        statusFilter !== "All"
      ) {
        result = result.filter(
          (order) =>
            order.codStatus ===
            statusFilter
        );
      }

      // -------------------------------------------------
      // FROM DATE
      // -------------------------------------------------

      if (fromDate) {
        const start =
          new Date(fromDate);

        start.setHours(
          0,
          0,
          0,
          0
        );

        result = result.filter(
          (order) => {
            const submittedDate =
              order.codSubmittedAt ||
              order.codSettlement
                ?.submittedAt;

            if (!submittedDate) {
              return false;
            }

            return (
              new Date(
                submittedDate
              ) >= start
            );
          }
        );
      }

      // -------------------------------------------------
      // TO DATE
      // -------------------------------------------------

      if (toDate) {
        const end =
          new Date(toDate);

        end.setHours(
          23,
          59,
          59,
          999
        );

        result = result.filter(
          (order) => {
            const submittedDate =
              order.codSubmittedAt ||
              order.codSettlement
                ?.submittedAt;

            if (!submittedDate) {
              return false;
            }

            return (
              new Date(
                submittedDate
              ) <= end
            );
          }
        );
      }

      // -------------------------------------------------
      // SORT
      // -------------------------------------------------

      result.sort((a, b) => {
        const dateA =
          new Date(
            a.codSubmittedAt ||
              a.codSettlement
                ?.submittedAt ||
              a.createdAt ||
              0
          );

        const dateB =
          new Date(
            b.codSubmittedAt ||
              b.codSettlement
                ?.submittedAt ||
              b.createdAt ||
              0
          );

        switch (sortBy) {
          case "Newest":
            return dateB - dateA;

          case "Oldest":
            return dateA - dateB;

          case "Amount High":
            return (
              Number(
                b.amount || 0
              ) -
              Number(
                a.amount || 0
              )
            );

          case "Amount Low":
            return (
              Number(
                a.amount || 0
              ) -
              Number(
                b.amount || 0
              )
            );

          default:
            return dateB - dateA;
        }
      });

      return result;
    }, [
      historyOrders,
      search,
      statusFilter,
      fromDate,
      toDate,
      sortBy,
    ]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages =
    Math.ceil(
      filteredOrders.length /
        rowsPerPage
    );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(
          currentPage,
          totalPages
        )
      : 1;

  const lastIndex =
    safeCurrentPage *
    rowsPerPage;

  const firstIndex =
    lastIndex - rowsPerPage;

  const currentOrders =
    filteredOrders.slice(
      firstIndex,
      lastIndex
    );

  // -----------------------------------------------------
  // RESET PAGE WHEN FILTER CHANGES
  // -----------------------------------------------------

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    fromDate,
    toDate,
    sortBy,
    rowsPerPage,
  ]);

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setSearch("");

    setStatusFilter("All");

    setFromDate("");

    setToDate("");

    setSortBy("Newest");

    setRowsPerPage(10);

    setCurrentPage(1);
  };

  // =====================================================
  // EXCEL EXPORT
  // =====================================================

  const exportExcel = () => {
    if (
      filteredOrders.length === 0
    ) {
      return toast.warning(
        "No COD history to export."
      );
    }

    const data =
      filteredOrders.map(
        (order) => ({
          OrderID:
            order.orderId || "-",

          Customer:
            order.customer || "-",

          Amount:
            Number(
              order.amount || 0
            ),

          Delivered:
            order.deliveredAt
              ? formatDate(
                  order.deliveredAt
                )
              : order.date || "-",

          Submitted:
            order.codSubmittedAt ||
            order.codSettlement
              ?.submittedAt
              ? formatDate(
                  order.codSubmittedAt ||
                    order.codSettlement
                      ?.submittedAt
                )
              : "-",

          Verified:
            order.codSettlement
              ?.approvedAt
              ? formatDate(
                  order.codSettlement
                    .approvedAt
                )
              : "-",

          Status:
            order.codStatus || "-",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "COD History"
    );

    XLSX.writeFile(
      workbook,
      "COD_Submission_History.xlsx"
    );

    toast.success(
      "Excel exported successfully."
    );
  };

  // =====================================================
  // PDF EXPORT
  // =====================================================

  const exportPDF = () => {
    if (
      filteredOrders.length === 0
    ) {
      return toast.warning(
        "No COD history to export."
      );
    }

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "COD Submission History",
      14,
      15
    );

    doc.setFontSize(10);

    doc.text(
      `Partner: ${
        partner?.name || "Delivery Partner"
      }`,
      14,
      21
    );

    autoTable(doc, {
      startY: 28,

      head: [
        [
          "Order",
          "Customer",
          "Amount",
          "Delivered",
          "Submitted",
          "Status",
        ],
      ],

      body:
        filteredOrders.map(
          (order) => [
            order.orderId || "-",

            order.customer || "-",

            `Rs. ${Number(
              order.amount || 0
            ).toLocaleString(
              "en-IN"
            )}`,

            order.deliveredAt
              ? formatDate(
                  order.deliveredAt
                )
              : order.date || "-",

            order.codSubmittedAt ||
            order.codSettlement
              ?.submittedAt
              ? formatDate(
                  order.codSubmittedAt ||
                    order.codSettlement
                      ?.submittedAt
                )
              : "-",

            order.codStatus || "-",
          ]
        ),
    });

    doc.save(
      "COD_History.pdf"
    );

    toast.success(
      "PDF exported successfully."
    );
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeTransferModal = () => {
    if (loading) {
      return;
    }

    setShowTransfer(false);

    setSelectedOrders([]);

    setNotes("");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dn2-page-wrap">

      <div className="wallet-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="wallet-header">

          <div>
            <h2>
              COD Settlement 💵
            </h2>

            <p>
              Submit collected COD to Admin
            </p>
          </div>

          <button
            type="button"
            className="transfer-btn"
            onClick={() =>
              setShowTransfer(true)
            }
          >
            Submit COD
          </button>

        </div>

        {/* =================================================
            TOP CARDS
        ================================================= */}

        <div className="wallet-cards">

          {/* TOTAL COD */}

          <div className="wallet-card orange">

            <div className="wallet-card-icon">
              📦
            </div>

            <div>

              <h5>
                Total COD
              </h5>

              <h2>
                ₹
                {Math.round(
                  totalCOD
                ).toLocaleString(
                  "en-IN"
                )}
              </h2>

            </div>

          </div>

          {/* PENDING */}

          <div className="wallet-card red">

            <div className="wallet-card-icon">
              ⏳
            </div>

            <div>

              <h5>
                Pending COD
              </h5>

              <h2>
                ₹
                {Math.round(
                  pendingCOD
                ).toLocaleString(
                  "en-IN"
                )}
              </h2>

              <small>
                Collected, not submitted
              </small>

            </div>

          </div>

          {/* SUBMITTED */}

          <div className="wallet-card blue">

            <div className="wallet-card-icon">
              📤
            </div>

            <div>

              <h5>
                Submitted COD
              </h5>

              <h2>
                ₹
                {Math.round(
                  submittedCOD
                ).toLocaleString(
                  "en-IN"
                )}
              </h2>

              <small>
                Sent to Admin
              </small>

            </div>

          </div>

          {/* SETTLED */}

          <div className="wallet-card green">

            <div className="wallet-card-icon">
              ✅
            </div>

            <div>

              <h5>
                Settled COD
              </h5>

              <h2>
                ₹
                {Math.round(
                  settledCOD
                ).toLocaleString(
                  "en-IN"
                )}
              </h2>

              <small>
                Admin verified
              </small>

            </div>

          </div>

        </div>

        {/* =================================================
            TODAY SUBMITTED
        ================================================= */}

        <div className="cod-today-payment-box">

          <div>

            <span>
              Today Sent to Admin
            </span>

            <h2>
              ₹
              {Math.round(
                todaySubmittedCOD
              ).toLocaleString(
                "en-IN"
              )}
            </h2>

            <p>
              {todaySubmittedCount}{" "}
              payment(s) submitted today
            </p>

          </div>

          <div>

            <span>
              Last Submitted
            </span>

            <strong>
              {lastSubmittedOrder
                ? formatDate(
                    lastSubmittedOrder.codSubmittedAt ||
                      lastSubmittedOrder
                        .codSettlement
                        ?.submittedAt
                  )
                : "No payment submitted"}
            </strong>

          </div>

        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="history-filter-bar">

          {/* SEARCH */}

          <input
            type="text"
            placeholder="Search Order ID / Customer..."
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );

              setCurrentPage(1);
            }}
            className="filter-input"
          />

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(
                e.target.value
              );

              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="All">
              All Status
            </option>

            <option value="Submitted">
              Submitted
            </option>

            <option value="Settled">
              Settled
            </option>
          </select>

          {/* FROM DATE */}

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(
                e.target.value
              );

              setCurrentPage(1);
            }}
            className="filter-date"
          />

          {/* TO DATE */}

          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(
                e.target.value
              );

              setCurrentPage(1);
            }}
            className="filter-date"
          />

          {/* SORT */}

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            className="filter-select"
          >
            <option value="Newest">
              Newest
            </option>

            <option value="Oldest">
              Oldest
            </option>

            <option value="Amount High">
              Amount High
            </option>

            <option value="Amount Low">
              Amount Low
            </option>
          </select>

          {/* ACTIONS */}

          <div className="filter-actions">

            <button
              type="button"
              className="excel-btn"
              onClick={
                exportExcel
              }
            >
              📗 Excel
            </button>

            <button
              type="button"
              className="pdf-btn"
              onClick={
                exportPDF
              }
            >
              📄 PDF
            </button>

            <button
              type="button"
              className="reset-btn"
              onClick={
                resetFilters
              }
            >
              🔄 Reset
            </button>

          </div>

        </div>

        {/* =================================================
            HISTORY
        ================================================= */}

        <div className="history-section">

          <div className="history-title-row">

            <div>
              <h3>
                COD Submission History
              </h3>

              <p>
                Amounts submitted to Admin
                and settlement dates
              </p>
            </div>

            <div className="history-total">

              <span>
                Total Submitted
              </span>

              <strong>
                ₹
                {Math.round(
                  submittedCOD
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>

          {/* HEADER */}

          <div className="history-header-row">

            <div>
              Order ID
            </div>

            <div>
              Product
            </div>

            <div>
              COD
            </div>

            <div>
              Delivered
            </div>

            <div>
              Submitted
            </div>

            <div>
              Status
            </div>

          </div>

          {/* LIST */}

          <div className="history-list">

            {currentOrders.length >
            0 ? (

              currentOrders.map(
                (order) => (

                  <div
                    className="history-row"
                    key={order._id}
                  >

                    {/* ORDER ID */}

                    <div>
                      <strong>
                        #
                        {order.orderId ||
                          "-"}
                      </strong>
                    </div>

                    {/* PRODUCT */}

                    <div className="product-col">

                      {order.items?.[0]
                        ?.image ? (

                        <img
                          src={`http://localhost:4000/uploads/${order.items[0].image}`}
                          alt={
                            order.items?.[0]
                              ?.name ||
                            "Product"
                          }
                          onError={(
                            e
                          ) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                      ) : (

                        <div className="product-no-image">
                          —
                        </div>

                      )}

                      <div>

                        <h5>
                          {
                            order.items?.[0]
                              ?.name
                          }
                        </h5>

                        <small>
                          Qty :{" "}
                          {
                            order.items?.[0]
                              ?.quantity
                          }
                        </small>

                      </div>

                    </div>

                    {/* COD */}

                    <div>

                      <strong>
                        ₹
                        {Number(
                          order.amount ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    {/* DELIVERED */}

                    <div>
                      {order.deliveredAt
                        ? formatDate(
                            order.deliveredAt
                          )
                        : order.date ||
                          "-"}
                    </div>

                    {/* SUBMITTED */}

                    <div>

                      {order.codSubmittedAt ||
                      order.codSettlement
                        ?.submittedAt
                        ? formatDate(
                            order.codSubmittedAt ||
                              order
                                .codSettlement
                                ?.submittedAt
                          )
                        : "—"}

                    </div>

                    {/* STATUS */}

                    <div>

                      <span
                        className={`status ${order.codStatus}`}
                      >
                        {order.codStatus}
                      </span>

                      {/* VERIFIED DATE */}

                      {order.codStatus ===
                        "Settled" &&
                        order.codSettlement
                          ?.approvedAt && (
                          <small className="verified-date">
                            Verified:{" "}
                            {formatDate(
                              order
                                .codSettlement
                                .approvedAt
                            )}
                          </small>
                        )}

                    </div>

                  </div>

                )
              )

            ) : (

              <div className="empty-history">
                No COD history yet
                <small className="delivery-cod-empty-hint">
                  Orders you submit to Admin will appear here.
                </small>
              </div>

            )}

          </div>

        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="pagination-wrapper">

          <div className="pagination-info">

            Showing{" "}

            <strong>
              {filteredOrders.length ===
              0
                ? 0
                : firstIndex + 1}
            </strong>

            {" "}to{" "}

            <strong>
              {Math.min(
                lastIndex,
                filteredOrders.length
              )}
            </strong>

            {" "}of{" "}

            <strong>
              {
                filteredOrders.length
              }
            </strong>

            {" "}entries

          </div>

          <div className="pagination-controls">

            {/* ROWS */}

            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(
                  Number(
                    e.target.value
                  )
                );

                setCurrentPage(1);
              }}
              className="rows-select"
            >

              <option value={5}>
                5
              </option>

              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

              <option value={50}>
                50
              </option>

            </select>

            {/* PREVIOUS */}

            <button
              type="button"
              className="page-btn"
              disabled={
                safeCurrentPage ===
                1
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.max(
                      1,
                      prev - 1
                    )
                )
              }
            >
              ◀ Previous
            </button>

            {/* PAGE NUMBERS */}

            {totalPages > 0 &&
              Array.from(
                {
                  length:
                    totalPages,
                },
                (_, index) => {

                  const page =
                    index + 1;

                  return (
                    <button
                      type="button"
                      key={page}
                      className={
                        safeCurrentPage ===
                        page
                          ? "page-btn active-page"
                          : "page-btn"
                      }
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                    >
                      {page}
                    </button>
                  );
                }
              )}

            {/* NEXT */}

            <button
              type="button"
              className="page-btn"
              disabled={
                totalPages === 0 ||
                safeCurrentPage ===
                  totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.min(
                      totalPages,
                      prev + 1
                    )
                )
              }
            >
              Next ▶
            </button>

          </div>

        </div>

        {/* =================================================
            SUBMIT COD MODAL
        ================================================= */}

        {showTransfer && (

          <div
            className="wallet-modal"
            onClick={() => {
              if (!loading) {
                closeTransferModal();
              }
            }}
          >

            <div
              className="wallet-modal-box"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="modal-header">

                <div>

                  <h2>
                    Submit COD Settlement
                  </h2>

                  <p>
                    Send collected COD
                    amount to Admin
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeTransferModal
                  }
                  disabled={loading}
                >
                  ✕
                </button>

              </div>

              {/* AVAILABLE PENDING */}

              <div className="available-box">

                <div>

                  <span>
                    Pending COD
                  </span>

                  <small>
                    Collected orders
                  </small>

                </div>

                <h2>
                  ₹
                  {Math.round(
                    remainingPendingCOD
                  ).toLocaleString(
                    "en-IN"
                  )}
                </h2>

              </div>

              {/* SELECT ALL */}

              <div className="select-all-box">

                <label>

                  <input
                    type="checkbox"
                    checked={
                      pendingOrders.length >
                        0 &&
                      pendingOrders.every(
                        (order) =>
                          selectedOrders.some(
                            (
                              selected
                            ) =>
                              selected._id ===
                              order._id
                          )
                      )
                    }
                    onChange={
                      handleSelectAll
                    }
                    disabled={
                      pendingOrders.length ===
                      0
                    }
                  />

                  Select All Orders

                </label>

              </div>

              {/* ORDER LIST */}

              <div className="order-list">

                {pendingOrders.length >
                0 ? (

                  pendingOrders.map(
                    (order) => {

                      const isSelected =
                        selectedOrders.some(
                          (
                            selected
                          ) =>
                            selected._id ===
                            order._id
                        );

                      return (
                        <div
                          className={`order-item ${
                            isSelected
                              ? "selected"
                              : ""
                          }`}
                          key={
                            order._id
                          }
                        >

                          <label className="order-check">

                            <input
                              type="checkbox"
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                toggleOrder(
                                  order
                                )
                              }
                            />

                            <div>

                              <h4>
                                Order #
                                {
                                  order.orderId
                                }
                              </h4>

                              <p>
                                {
                                  order.customer ||
                                  "Customer"
                                }
                              </p>

                              <small>
                                Delivered:{" "}
                                {order.deliveredAt
                                  ? formatDate(
                                      order.deliveredAt
                                    )
                                  : order.date ||
                                    "-"}
                              </small>

                            </div>

                          </label>

                          <strong>
                            ₹
                            {Number(
                              order.amount ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </div>
                      );
                    }
                  )

                ) : (

                  <div className="empty-history">
                    No pending orders
                    <small className="delivery-cod-empty-hint">
                      Collected COD orders will show up here, ready to submit.
                    </small>
                  </div>

                )}

              </div>

              {/* SELECTED TOTAL */}

              <div className="selected-total">

                <div>

                  <h3>
                    Selected Orders
                  </h3>

                  <p>
                    {
                      selectedOrders.length
                    }{" "}
                    order(s)
                  </p>

                </div>

                <h2>
                  ₹
                  {Math.round(
                    selectedAmount
                  ).toLocaleString(
                    "en-IN"
                  )}
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
                  placeholder="Optional payment note..."
                  disabled={loading}
                />

              </div>

              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeTransferModal
                  }
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-transfer"
                  onClick={
                    handleTransfer
                  }
                  disabled={
                    loading ||
                    selectedOrders.length ===
                      0
                  }
                >
                  {loading
                    ? "Submitting..."
                    : `Submit ₹${Math.round(
                        selectedAmount
                      ).toLocaleString(
                        "en-IN"
                      )}`}
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}