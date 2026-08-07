import React, {
  useEffect,
  useState
} from "react";

import axios from "axios";

import "../styles/adminProfit.css";

import AdminLayout
from "../layout/AdminLayout";
import * as XLSX from "xlsx";
import {saveAs} from "file-saver";

export default function AdminProfit() {

  const [data, setData] = useState(null);
  const [filters,setFilters] = useState({
    fromDate: "",
    toDate: ""
  });

  const [currentPage, setCurrentPage] = useState(1);
const ordersPerPage = 10;


  useEffect(() => {

    fetchProfit();

  }, []);

  const fetchProfit = async () => {

    try {

      const res = await axios.get(
        "http://localhost:4000/api/profit",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

      setData(res.data);

    } catch (err) {

      console.log(err);

    }

  };

  const filteredOrders =
  data?.orders?.filter((order) => {

    if (
      !filters.fromDate ||
      !filters.toDate
    ) {
      return true;
    }

    const orderDate =
      new Date(order.createdAt);

    return (
      orderDate >=
        new Date(filters.fromDate) &&
      orderDate <=
        new Date(
          filters.toDate +
          "T23:59:59"
        )
    );

  }) || [];

  const filteredTotalSales =
  filteredOrders.reduce(
    (sum, order) =>
      sum + (order.sales || 0),
    0
  );

const filteredProductCost =
  filteredOrders.reduce(
    (sum, order) =>
      sum +
      (order.productCost || 0),
    0
  );

const filteredDeliveryExpense =
  filteredOrders.reduce(
    (sum, order) =>
      sum +
      (order.deliveryExpense || 0),
    0
  );

const filteredRefund =
  filteredOrders.reduce(
    (sum, order) =>
      sum + (order.refund || 0),
    0
  );

const filteredProfit =
  filteredOrders.reduce(
    (sum, order) =>
      sum + (order.profit || 0),
    0
  );

const exportExcel = () => {

  let orders = [...filteredOrders];

  const excelData = orders.map((order) => ({

    OrderID: "#" + order._id.slice(-6),

    Customer:
      order.name || "User",

    Sales:
      Math.round(order.sales || 0),

    ProductCost:
      Math.round(order.productCost || 0),

    DeliveryExpense:
      Math.round(
        order.deliveryExpense || 0
      ),

    Refund:
      Math.round(order.refund || 0),

    Profit:
      Math.round(order.profit || 0),

    Status:
      order.status,

    Date:
      new Date(
        order.createdAt
      ).toLocaleDateString()

  }));

  // Summary Row

  excelData.push({});

  excelData.push({

    OrderID: "TOTAL",

    Sales:
      Math.round(
        data.totalSales || 0
      ),

    ProductCost:
      Math.round(
        data.totalProductCost || 0
      ),

    DeliveryExpense:
      Math.round(
        data.totalDeliveryExpense || 0
      ),

    Refund:
      Math.round(
        data.totalRefund || 0
      ),

    Profit:
      Math.round(
        data.netProfit || 0
      )

  });

  const worksheet =
    XLSX.utils.json_to_sheet(
      excelData
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Profit Report"
  );

  const excelBuffer =
    XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array"
      }
    );

  const blob = new Blob(
    [excelBuffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  );

  saveAs(
    blob,
    filters.fromDate &&
    filters.toDate
      ? `Profit_Report_${filters.fromDate}_to_${filters.toDate}.xlsx`
      : "Profit_Report_All.xlsx"
  );

};

const indexOfLastOrder = currentPage * ordersPerPage;
const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;

const currentOrders = filteredOrders.slice(
  indexOfFirstOrder,
  indexOfLastOrder
);

const totalPages = Math.ceil(
  filteredOrders.length / ordersPerPage
);

useEffect(() => {
  setCurrentPage(1);
}, [filters]);
  return (

    <AdminLayout>

      <div className="admin-profit-page">

      <div className="profit-top-bar">

  <h2>
    Profit Analytics
  </h2>

  <div className="profit-filter">

    <input
      type="date"
      value={filters.fromDate}
      onChange={(e) =>
        setFilters({
          ...filters,
          fromDate: e.target.value
        })
      }
    />

    <input
      type="date"
      value={filters.toDate}
      onChange={(e) =>
        setFilters({
          ...filters,
          toDate: e.target.value
        })
      }
    />

    <button
      className="export-btn"
      onClick={exportExcel}
    >
      Export Excel
    </button>

  </div>

</div>
        {
          data && (

            <>
              {/* =====================
                  TOP CARDS
              ===================== */}

              <div className="admin-profit-grid">

                <div className="profit-card">
                  <h4>Total Sales</h4>
                  <p>
                    ₹{Math.round(filteredTotalSales)}
                  </p>
                </div>

                <div className="profit-card">
                  <h4>Product Cost</h4>
                  <p>
                    ₹{Math.round(filteredProductCost)}
                  </p>
                </div>

                <div className="profit-card">
                  <h4>Delivery Expense</h4>
                  <p>
                    ₹{Math.round(filteredDeliveryExpense)}
                  </p>
                </div>

                <div className="profit-card">
                  <h4>Discount Loss</h4>
                  <p>
                    ₹{Math.round(data.totalDiscount || 0)}
                  </p>
                </div>

                <div className="profit-card">
                  <h4>Refund Loss</h4>
                  <p>
                    ₹{Math.round(filteredRefund)}
                  </p>
                </div>

                <div className="profit-card net">
                  <h4>Net Profit</h4>
                  <p>
                    ₹{Math.round(filteredProfit)}
                  </p>
                </div>

              </div>

              {/* =====================
                  ORDER TABLE
              ===================== */}

              <div className="profit-table-wrapper">

                <div className="profit-table-header">

                  <h3>
                    Order Profit Details
                  </h3>



                </div>

                <table className="profit-table">

                  <thead>

                    <tr>

                      <th>Order ID</th>

                      <th>Customer</th>

                      <th>Sales</th>

                      <th>Product Cost</th>

                      <th>Delivery</th>

                      
                      
                      <th>Refund</th>

                      <th>Profit</th>

                      <th>Status</th>

                    </tr>

                  </thead>

                  <tbody>

                    {
                     currentOrders?.map((order) => (

                        <tr key={order._id}>

                          <td className="order-id">
                            #{order._id.slice(-6)}
                          </td>

                          <td>
                            {
                              order.name
                              || "User"
                            }
                          </td>

                          <td>
                            ₹{Math.round(order.sales || 0)}
                          </td>

                          <td>
                            ₹{Math.round(order.productCost || 0)}
                          </td>

                          <td>
                            ₹{Math.round(order.deliveryExpense || 0)}
                          </td>

                        

                          <td>
                            ₹{Math.round(order.refund || 0)}
                          </td>

                          <td
                            className={
                              order.profit >= 0
                              ? "profit-green"
                              : "profit-red"
                            }
                          >

                            ₹{Math.round(order.profit || 0)}

                          </td>

                          <td>

                            <span
                              className={`status-badge
                              ${
                                order.status === "Delivered"
                                ? "status-delivered"
                                : order.status === "Cancelled"
                                ? "status-cancelled"
                                : order.status === "Returned"
                                ? "status-returned"
                                : "status-pending"
                              }`}
                            >

                              {order.status}

                            </span>

                          </td>

                        </tr>

                      ))
                    }

                  </tbody>

                </table>
                <div className="profit-pagination">

  <button
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage((prev) => prev - 1)
    }
  >
    Prev
  </button>

  <span>
    Page {currentPage} of {totalPages}
  </span>

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

            </>

          )
        }

      </div>

    </AdminLayout>

  );

}