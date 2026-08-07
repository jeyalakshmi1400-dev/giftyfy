import React from "react";
import logoDefault from "../assets/logo.png";
import signature from "../assets/signature.jpg";
import { useState, useEffect } from "react";
import axios from "axios";
import "./UserInvoicePDF.css";

const UserInvoicePDF = ({ order, invoiceRef }) => {
  const [site, setSite] = useState(null);
  const [logo, setLogo] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/site-content")
      .then((res) => {
        setSite(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    axios.get("http://localhost:4000/api/logo").then((res) => {
      setLogo(res.data);
    });
  }, []);

  if (!order) return null;

  return (
    <div className="invoice-pdf-root">
    

     

      {/* ==================================================== */}
      {/* PAGE 2 — TAX INVOICE */}
      {/* ==================================================== */}

      <div ref={invoiceRef} className="invoice-page">
        {/* ================= HEADER ================= */}

        <div className="inv-header">
          {/* LEFT */}

          <div className="inv-left">
            <img
              src={
                logo?.image
                  ? `http://localhost:4000/uploads/${logo.image}`
                  : logoDefault
              }
              alt="logo"
              className="inv-logo"
            />

            <div className="inv-company-name">Giftyfy</div>

            <div className="inv-company-details">
              Phone : {site?.contactPhone}
              <br />
              Email : {site?.contactEmail}
            </div>
          </div>

          {/* RIGHT */}

          <div className="inv-right">
            <div className="inv-badge">INVOICE</div>

            <table className="inv-meta-table">
              <tbody>
                <tr>
                  <td className="inv-meta-label">Invoice No</td>
                  <td>INV-{order._id.slice(-6)}</td>
                </tr>

                <tr>
                  <td className="inv-meta-label">Invoice Date</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>

                <tr>
                  <td className="inv-meta-label">Order ID</td>
                  <td>{order._id}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= BILL FROM / BILL TO ================= */}

        <div className="inv-billing-section">
          <div className="inv-bill-col">
            <div className="inv-bill-title">Bill From</div>

            <div className="inv-bill-details">
              {site?.contactAddress?.split("\n").map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
              GSTIN : 33ABCDE1234F1Z5
            </div>
          </div>

          <div className="inv-bill-col">
            <div className="inv-bill-title">Bill To</div>

            <div className="inv-bill-details">
              {order.name}
              <br />
              {order.address}
              <br />
              {order.phone}
              <br />
              {order.deliveryPincode}
            </div>
          </div>
        </div>

        {/* ================= PRODUCT TABLE ================= */}

        <table className="inv-table">
          <thead>
            <tr>
              <th className="inv-th">Item</th>
              <th className="inv-th">Qty</th>
              <th className="inv-th">Rate</th>
              <th className="inv-th">Tax</th>
              <th className="inv-th">Amount</th>
            </tr>
          </thead>

          <tbody>
            {order.items.map((item, index) => {
              const qty = item.quantity || 1;
              const rate = item.price || 0;
              const gstPercent = item.gst || 0;
              const taxableAmount = item.taxablePrice || 0;
              const gstAmount = item.gstAmount || 0;
              const amount = rate * qty;

              return (
                <tr key={index}>
                  {/* ITEM */}
                  <td className="inv-item-cell">
                    <div className="inv-item-flex">
                      {/* PRODUCT IMAGE */}
                      <img
                        src={`http://localhost:4000/uploads/${item.image}`}
                        alt=""
                        className="inv-item-image"
                      />

                      <div>
                        <div className="inv-item-name">{item.name}</div>

                        {item.size && (
                          <div className="inv-item-meta">
                            <b>Size :</b> {item.size}
                          </div>
                        )}

                        {item.variant && (
                          <div className="inv-item-meta">
                            <b>Color :</b> {item.variant}
                          </div>
                        )}

                        {item.customName && (
                          <div className="inv-item-meta">
                            <b>Name :</b> {item.customName}
                          </div>
                        )}

                        {item.message && (
                          <div className="inv-item-meta">
                            <b>Message :</b> {item.message}
                          </div>
                        )}

                        {/* Personalized Images */}
                        {item.extraImages?.length > 0 && (
                          <div className="inv-extra-images">
                            {item.extraImages.map((img, i) => (
                              <img
                                key={i}
                                src={`http://localhost:4000/uploads/${img}`}
                                alt=""
                                className="inv-extra-image"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* QTY */}
                  <td className="inv-td-center">{qty}</td>

                  {/* RATE */}
                  <td className="inv-td-right">
                    ₹{Math.round(rate.toFixed(2))}
                  </td>

                  {/* TAX */}
                  <td className="inv-td-center">{gstPercent}%</td>

                  {/* AMOUNT */}
                  <td className="inv-td-right inv-td-bold">
                    ₹{Math.round(amount.toFixed(2))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ================= BOTTOM SECTION ================= */}

        <div className="inv-bottom-section">
          {/* TERMS */}

          <div className="inv-terms">
            <h4 className="inv-terms-title">Terms &amp; Conditions</h4>

            <div className="inv-terms-body">
              • Payment is due upon receipt of this invoice.
              <br />
              • Customized products cannot be exchanged or returned.
              <br />
              • Goods once sold will not be taken back.
              <br />
              • Please keep this invoice for future reference.
              <br />
              • Subject to Madurai Jurisdiction only.
            </div>
          </div>

          {/* TOTALS */}

          <div className="inv-totals">
            <table className="inv-totals-table">
              <tbody>
                <tr>
                  <td className="inv-totals-label">Product Price</td>

                  <td className="inv-totals-value">
                    ₹
                    {Math.round(
                      order.items
                        .reduce(
                          (sum, item) =>
                            sum +
                            (item.originalPrice || item.price) *
                              (item.quantity || 1),
                          0
                        )
                        .toFixed(2)
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="inv-totals-label">
                    Product Discount (
                    {order.items?.[0]?.originalPrice
                      ? Math.round(
                          ((order.items[0].originalPrice -
                            order.items[0].price) /
                            order.items[0].originalPrice) *
                            100
                        )
                      : 0}
                    %)
                  </td>

                  <td className="inv-totals-value">
                    - ₹
                    {Math.round(
                      order.items
                        .reduce(
                          (sum, item) =>
                            sum +
                            (item.originalPrice - item.price) *
                              (item.quantity || 1),
                          0
                        )
                        .toFixed(2)
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="inv-totals-label">Taxable Value</td>

                  <td className="inv-totals-value">
                    ₹
                    {Math.round(
                      order.items
                        .reduce(
                          (sum, item) => sum + (item.taxablePrice || 0),
                          0
                        )
                        .toFixed(2)
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="inv-totals-label">
                    GST ({order.items?.[0]?.gst || 0}%)
                  </td>

                  <td className="inv-totals-value">
                    ₹
                    {Math.round(
                      order.items
                        .reduce((sum, item) => sum + (item.gstAmount || 0), 0)
                        .toFixed(2)
                    )}
                  </td>
                </tr>

                <tr className="inv-totals-divider-row">
                  <td className="inv-totals-label inv-totals-bold">
                    Gross Amount
                  </td>

                  <td className="inv-totals-value inv-totals-bold">
                    ₹
                    {Math.round(
                      order.items
                        .reduce(
                          (sum, item) =>
                            sum + item.price * (item.quantity || 1),
                          0
                        )
                        .toFixed(2)
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="inv-totals-label">Additional Discount</td>

                  <td className="inv-totals-value">
                    - ₹{Math.round((order.discount || 0).toFixed(2))}
                  </td>
                </tr>

                <tr>
                  <td className="inv-totals-label">Delivery</td>

                  <td className="inv-totals-value">
                    ₹{(order.delivery || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* TOTAL BOX */}

            <div className="inv-total-box">
              <span>TOTAL</span>
              <span>₹{Math.round(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ================= SIGNATURE ================= */}

        <div className="inv-signature-section">
          <div className="inv-signature-box">
            <img
              src={signature}
              alt="signature"
              className="inv-signature-img"
            />

            <div className="inv-signature-line">Authorized Signatory</div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}

        <div className="inv-footer">
          Thank you for shopping with <b>Giftyfy</b>.
          <br />
          This is a computer generated invoice.
        </div>
      </div>
    </div>
  );
};

export default UserInvoicePDF;
{/* ================= END MAIN ================= */}