import React, { useEffect, useState } from "react";
import axios from "axios";
import logoDefault from "../assets/logo.png";
import signature from "../assets/signature.jpg";
import "./InvoicePDFNew.css";

const InvoicePDFNew = ({ order, shippingRef, invoiceRef }) => {
  const [site, setSite] = useState(null);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/site-content")
      .then((res) => setSite(res.data))
      .catch(console.error);

    axios
      .get("http://localhost:4000/api/logo")
      .then((res) => setLogo(res.data))
      .catch(console.error);
  }, []);

  if (!order) return null;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN");

  const money = (value) =>
    `₹${Number(value || 0).toFixed(2)}`;

  const productPrice = order.items.reduce(
    (sum, item) =>
      sum + (item.originalPrice || item.price) * (item.quantity || 1),
    0
  );

  const productDiscount = order.items.reduce(
    (sum, item) =>
      sum +
      ((item.originalPrice || item.price) - item.price) *
        (item.quantity || 1),
    0
  );

  const taxableValue = order.items.reduce(
    (sum, item) => sum + (item.taxablePrice || 0),
    0
  );

  const gstAmount = order.items.reduce(
    (sum, item) => sum + (item.gstAmount || 0),
    0
  );
  if (!order) return null;

console.log("Invoice Order:", order);
console.log("Order ID:", order?.orderId);
console.log("Created At:", order?.createdAt);
console.log("Payment:", order?.paymentMethod);
console.log("Delivery:", order?.delivery);
console.log("Discount:", order?.discount);
console.log("Total:", order?.totalAmount);

  return (
    <div className="invoice-new-root">

      {/* ================================================= */}
      {/* PAGE 1 - SHIPPING LABEL */}
      {/* ================================================= */}

      <section
        ref={shippingRef}
        className="ship-page"
      >
                {/* ================= HEADER ================= */}

        <div className="ship-header">

          <div className="ship-company">

            <img
              src={
                logo?.image
                  ? `http://localhost:4000/uploads/${logo.image}`
                  : logoDefault
              }
              alt="logo"
              className="ship-logo"
            />

            <div className="ship-company-content">

              <h2 className="ship-company-name">
                {site?.companyName}
              </h2>

              <div className="ship-company-info">
                {site?.contactAddress}
              </div>

              <div className="ship-company-info">
                Phone : {site?.contactPhone}
              </div>

              <div className="ship-company-info">
                Email : {site?.contactEmail}
              </div>

            </div>

          </div>

          <div className="ship-order-card">

            <div className="ship-title">
              SHIPPING LABEL
            </div>

            <table className="ship-order-table">
              <tbody>

                <tr>
                  <td>Order ID</td>
                  <td>{order.orderId}</td>
                </tr>

                <tr>
                  <td>Date</td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>

                <tr>
                  <td>Payment</td>

                  <td>
                    <span
                      className={
                        order.paymentMethod === "COD"
                          ? "ship-status ship-cod"
                          : "ship-status ship-paid"
                      }
                    >
                      {order.paymentMethod}
                    </span>
                  </td>

                </tr>

              </tbody>
            </table>

          </div>

        </div>

        {/* ================= ADDRESS ================= */}

        <div className="ship-address-wrapper">

          {/* FROM */}

          <div className="ship-address-card">

            <div className="ship-address-title">
              FROM
            </div>

            <div className="ship-address-body">

              <strong>
                {site?.companyName}
              </strong>

              <br />

              {site?.contactAddress
                ?.split("\n")
                .map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}

              <br />

              Phone : {site?.contactPhone}

            </div>

          </div>

          {/* TO */}

          <div className="ship-address-card">

            <div className="ship-address-title ship-address-title-primary">
              SHIP TO
            </div>

            <div className="ship-address-body">

              <div className="ship-customer-name">
                {order.name}
              </div>

              <div>

                {order.address}

                <br />
                <br />

                Phone : {order.phone}

                <br />

                PIN : {order.deliveryPincode}

              </div>

            </div>

          </div>

        </div>
                {/* ================= ORDER ITEMS ================= */}

        <div className="ship-items-section">

          <div className="ship-section-title">
            ORDER ITEMS
          </div>

          <table className="ship-items-table">

            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>

              {order.items.map((item, index) => {

                const qty = item.quantity || 1;
                const total = item.price * qty;

                return (

                  <tr key={index}>

                    <td>

                      <div className="ship-product">

                        <img
                          src={
                            item.image?.startsWith("http")
                              ? item.image
                              : `http://localhost:4000/uploads/${item.image}`
                          }
                          alt=""
                          className="ship-product-image"
                        />

                        <div>

                          <div className="ship-product-name">
                            {item.name}
                          </div>

                          {item.variant && (
                            <div className="ship-product-meta">
                              Color : {item.variant}
                            </div>
                          )}

                          {item.size && (
                            <div className="ship-product-meta">
                              Size : {item.size}
                            </div>
                          )}

                          {item.customName && (
                            <div className="ship-product-meta">
                              Name : {item.customName}
                            </div>
                          )}

                        </div>

                      </div>

                    </td>

                    <td className="ship-center">
                      {qty}
                    </td>

                    <td className="ship-right">
                      {money(item.price)}
                    </td>

                    <td className="ship-right">
                      {money(total)}
                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

        {/* ================= PACKAGE ================= */}

        <div className="ship-package">

          <div>

            <div className="ship-package-title">
              PACKAGE ID
            </div>

            <div className="ship-barcode">
              ||||||||||||||||||||||||
            </div>

            <div className="ship-package-id">
              {order.orderId}
            </div>

          </div>

          <div className="ship-qr">
            QR
          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <div className="ship-footer">

          <div>
            📦 Handle With Care
          </div>

          <div>
            Thank you for shopping with {site?.companyName}
          </div>

        </div>

      </section>

      <div className="invoice-page-break"></div>

      {/* ================================================= */}
      {/* PAGE 2 - TAX INVOICE */}
      {/* ================================================= */}

      <section
        ref={invoiceRef}
        className="invoice-page-new"
      >
              {/* ================= HEADER ================= */}

      <div className="invoice-header-new">

        {/* LEFT */}

        <div className="invoice-company">

          <img
            src={
              logo?.image
                ? `http://localhost:4000/uploads/${logo.image}`
                : logoDefault
            }
            alt="logo"
            className="invoice-logo-new"
          />

          <div>

            <h2 className="invoice-company-name">
              {site?.companyName}
            </h2>

            <div className="invoice-company-info">
              {site?.contactAddress
                ?.split("\n")
                .map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
            </div>

            <div className="invoice-company-info">
              Phone : {site?.contactPhone}
            </div>

            <div className="invoice-company-info">
              Email : {site?.contactEmail}
            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="invoice-meta-card">

          <div className="invoice-title-new">
            TAX INVOICE
          </div>

          <table className="invoice-meta-table-new">

            <tbody>

              <tr>
                <td>Invoice No</td>
                <td>INV-{order.orderId}</td>
              </tr>

              <tr>
                <td>Order ID</td>
                <td>{order?.orderId || "No Order ID"}</td>
              </tr>

              <tr>
                <td>Date</td>
                <td>{order?.createdAt || "No Date"}</td>
              </tr>

              <tr>
                <td>Payment</td>
                <td>{order?.paymentMethod || "No Payment"}</td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* ================= BILL FROM / BILL TO ================= */}

      <div className="invoice-address-wrapper">

        {/* BILL FROM */}

        <div className="invoice-address-card">

          <div className="invoice-address-title">
            BILL FROM
          </div>

          <div className="invoice-address-body">

            <strong>{site?.companyName}</strong>

            <br />

            {site?.contactAddress
              ?.split("\n")
              .map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}

            <br />

            Phone : {site?.contactPhone}

            <br />

            Email : {site?.contactEmail}

            <br />

            GSTIN : 33ABCDE1234F1Z5

          </div>

        </div>

        {/* BILL TO */}

        <div className="invoice-address-card">

          <div className="invoice-address-title invoice-address-title-primary">
            BILL TO
          </div>

          <div className="invoice-address-body">

            <div className="invoice-customer-name">
              {order.name}
            </div>

            {order.address}

            <br />
            <br />

            Phone : {order.phone}

            <br />

            PIN : {order.deliveryPincode}

          </div>

        </div>

      </div>

      {/* ================= PRODUCT TABLE ================= */}

      <table className="invoice-table-new">

        <thead>

          <tr>

            <th>Item</th>

            <th>Qty</th>

            <th>Rate</th>

            <th>GST</th>

            <th>Total</th>

          </tr>

        </thead>

        <tbody>
                    {order.items.map((item, index) => {

          const qty = item.quantity || 1;
          const rate = item.price || 0;
          const gst = item.gst || 0;
          const total = qty * rate;

          return (

            <tr key={index}>

              <td>

                <div className="invoice-product">

                  <img
                    src={
                      item.image?.startsWith("http")
                        ? item.image
                        : `http://localhost:4000/uploads/${item.image}`
                    }
                    alt=""
                    className="invoice-product-image"
                  />

                  <div>

                    <div className="invoice-product-name">
                      {item.name}
                    </div>

                    {item.variant && (
                      <div className="invoice-product-meta">
                        Color : {item.variant}
                      </div>
                    )}

                    {item.size && (
                      <div className="invoice-product-meta">
                        Size : {item.size}
                      </div>
                    )}

                    {item.customName && (
                      <div className="invoice-product-meta">
                        Name : {item.customName}
                      </div>
                    )}

                    {item.message && (
                      <div className="invoice-product-meta">
                        Message : {item.message}
                      </div>
                    )}

                  </div>

                </div>

              </td>

              <td className="invoice-center">
                {qty}
              </td>

              <td className="invoice-right">
                {money(rate)}
              </td>

              <td className="invoice-center">
                {gst}%
              </td>

              <td className="invoice-right invoice-bold">
                {money(total)}
              </td>

            </tr>

          );

        })}

        </tbody>

      </table>

      {/* ================= BOTTOM ================= */}

      <div className="invoice-bottom">

        {/* TERMS */}

        <div className="invoice-terms">

          <div className="invoice-section-title">
            Terms & Conditions
          </div>

          <ul className="invoice-terms-list">

            <li>
              Payment is due upon receipt of this invoice.
            </li>

            <li>
              Customized products cannot be exchanged or returned.
            </li>

            <li>
              Goods once sold will not be taken back.
            </li>

            <li>
              Subject to Madurai Jurisdiction only.
            </li>

          </ul>

        </div>

        {/* TOTALS */}

        <div className="invoice-summary">

          <table className="invoice-summary-table">

            <tbody>

              <tr>
                <td>Product Price</td>
                <td>{money(productPrice)}</td>
              </tr>

              <tr>
                <td>Product Discount</td>
                <td>- {money(productDiscount)}</td>
              </tr>

              <tr>
                <td>Taxable Value</td>
                <td>{money(taxableValue)}</td>
              </tr>

              <tr>
                <td>GST</td>
                <td>{money(gstAmount)}</td>
              </tr>

              <tr>
                <td>Delivery</td>
                <td>{money(order.delivery)}</td>
              </tr>

              <tr>
                <td>Additional Discount</td>
                <td>- {money(order.discount)}</td>
              </tr>

            </tbody>

          </table>

          <div className="invoice-grand-total">

            <span>GRAND TOTAL</span>

            <span>
              {money(order.totalAmount)}
            </span>

          </div>

        </div>

      </div>

      {/* ================= SIGNATURE ================= */}

      <div className="invoice-signature">

        <img
          src={signature}
          alt="signature"
          className="invoice-sign-image"
        />

        <div className="invoice-sign-line">
          Authorized Signatory
        </div>

      </div>
            {/* ================= FOOTER ================= */}

      <footer className="invoice-footer-new">

        <div className="invoice-footer-left">
          Thank you for shopping with <strong>{site?.companyName}</strong>.
        </div>

        <div className="invoice-footer-right">
          This is a computer generated invoice and does not require a physical signature.
        </div>

      </footer>

    </section>
    


  </div>

  );
};

export default InvoicePDFNew;