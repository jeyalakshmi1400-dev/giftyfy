import React, {
  useEffect,
  useState,
  useRef
} from "react";

import axios from "axios";
import "../styles/report.css";

export default function ReportPage() {

  const [reports, setReports] =
    useState([]);

  const [filter, setFilter] =
    useState("All");

  const [currentPage, setCurrentPage] = useState(1);

const reportsPerPage = 10;  

const tableRef = useRef(null);
  // ================= FETCH REPORTS =================
  const fetchReports = async () => {

    try {

      const token =
        localStorage.getItem(
          "deliveryToken"
        );

      const res = await axios.get(
        "http://localhost:4000/api/delivery/reports",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      console.log(
        "REPORT DATA 👉",
        res.data
      );

      setReports(res.data || []);

    } catch (error) {

      console.log(
        "REPORT ERROR 👉",
        error
      );

    }

  };

  useEffect(() => {

    fetchReports();

  }, []);
  useEffect(() => {
  if (tableRef.current) {
    const y =
      tableRef.current.getBoundingClientRect().top +
      window.pageYOffset -
      20;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  }
}, [currentPage]);

  // ================= FILTER REPORTS =================
  const filteredReports =
    reports.filter((order) => {

      const orderDate =
        new Date(order.updatedAt);

      const today =
        new Date();

      // TODAY
      if (filter === "Today") {

        return (
          orderDate.getDate() ===
            today.getDate() &&

          orderDate.getMonth() ===
            today.getMonth() &&

          orderDate.getFullYear() ===
            today.getFullYear()
        );

      }

      // WEEK
      if (filter === "Week") {

        const weekAgo =
          new Date();

        weekAgo.setDate(
          today.getDate() - 7
        );

        return (
          orderDate >= weekAgo
        );

      }

      // MONTH
      if (filter === "Month") {

        return (
          orderDate.getMonth() ===
            today.getMonth() &&

          orderDate.getFullYear() ===
            today.getFullYear()
        );

      }

      // ALL
      if (filter === "All") {

        return true;

      }

      return true;

    });

  // ================= TOTAL EARNING =================
  const totalEarning =
    filteredReports.reduce(

      (acc, item) =>

        acc +
        (
          item.deliveryEarning
          || 30
        ),

      0

    );


    const indexOfLastReport =
  currentPage * reportsPerPage;

const indexOfFirstReport =
  indexOfLastReport - reportsPerPage;

const currentReports =
  filteredReports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

const totalPages = Math.ceil(
  filteredReports.length / reportsPerPage
);

const handlePageChange = (page) => {
  setCurrentPage(page);

  setTimeout(() => {
    tableRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
};
return (

  <div className="dn2-page-wrap">

  

    <div className="delivery-report-main">

      {/* TOP */}
      <div className="delivery-report-top">

        <div>

          <h2>
            Delivery Reports
          </h2>

          <p className="delivery-report-subtitle">

            Track completed
            deliveries & earnings

          </p>

        </div>

        {/* FILTERS */}
        <div className="delivery-report-filter-btns">

          <button
            className={
              filter === "All"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("All")
            }
          >
            All
          </button>

          <button
            className={
              filter === "Today"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("Today")
            }
          >
            Today
          </button>

          <button
            className={
              filter === "Week"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("Week")
            }
          >
            Week
          </button>

          <button
            className={
              filter === "Month"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("Month")
            }
          >
            Month
          </button>

        </div>

      </div>

  

      {/* SUMMARY */}
      <div className="delivery-report-summary-cards">

        <div className="delivery-report-summary-card">

          <h3>
            {
              filteredReports.length
            }
          </h3>

          <p>
            Delivered Orders
          </p>

        </div>

        <div
          className="
          delivery-report-summary-card
          delivery-report-earnings-card
          "
        >

          <h3>

            ₹
            {
              Math.round(
                totalEarning
              )
            }

          </h3>

          <p>
            Total Earnings
          </p>

        </div>

      </div>

      {/* TABLE */}
      <div   ref={tableRef} className="delivery-report-table-wrapper">

        <table className="delivery-report-table">

          <thead>

            <tr>

              <th>
                Order
              </th>

              <th>
                Product
              </th>

              <th>
                Customer
              </th>

              <th>
                Delivered Date
              </th>
              <th>
  Payment Mode
</th>

              <th>
                Amount
              </th>


            </tr>

          </thead>

          <tbody>

            {
              filteredReports.length > 0 ? (

                currentReports.map((order) => (

                  <tr
                    key={order._id}
                  >

                    {/* ORDER */}
                    <td>

                      <div
                        className="
                        delivery-report-order-id
                        "
                      >

                        #
                        {
                          order._id.slice(
                            -5
                          )
                        }

                      </div>

                      <span
                        className="
                        delivery-report-delivered-badge
                        "
                      >

                        Delivered

                      </span>

                    </td>

                    {/* PRODUCTS */}
                    <td>

                      {
                        order.items?.map(
                          (
                            item,
                            i
                          ) => (

                          <div
                            key={i}
                            className="
                            delivery-report-product-box
                            "
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

                              <p>
                                {
                                  item.name
                                }
                              </p>

                              <small>

                                Qty :
                                {" "}
                                {
                                  item.quantity
                                }

                              </small>

                            </div>

                          </div>

                        ))
                      }

                    </td>

                    {/* CUSTOMER */}
                    <td>

                      <div
                        className="
                        delivery-report-customer-box
                        "
                      >

                        <h4>
                          {
                            order.name
                            || "No Name"
                          }
                        </h4>

                        <p>
                          {" "}
                          {
                            order.user?.email
                            || "No Email"
                          }
                        </p>

                        <p>
                          
                          {" "}
                          {
                            order.phone
                            || "No Phone"
                          }
                        </p>

                      </div>

                    </td>

                    {/* DATE */}
                    <td>

                      {
                        new Date(
                          order.updatedAt
                        ).toLocaleDateString()
                      }

                    </td>
                    <td>
  <span
    className={
      order.paymentMethod === "COD"
        ? "payment-cod"
        : "payment-online"
    }
  >
    {order.paymentMethod === "COD" ? "COD 💵" : "Online 💳"}
  </span>
</td>

                    {/* AMOUNT */}
                    <td>

                      ₹
                      {
                        Math.round(
                          order.totalAmount
                        )
                      }

                    </td>

                 

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="
                    delivery-report-no-data
                    "
                  >

                    No delivered
                    orders found

                  </td>

                </tr>

              )
            }

          </tbody>

        </table>

        {totalPages > 1 && (
  <div className="report-pagination">

   <button
  onClick={() =>
    handlePageChange(currentPage - 1)
  }
  disabled={currentPage === 1}
>
  Previous
</button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

<button
  onClick={() =>
    handlePageChange(currentPage + 1)
  }
  disabled={currentPage === totalPages}
>
  Next
</button>

  </div>
)}

      </div>

    </div>

  </div>

);

}