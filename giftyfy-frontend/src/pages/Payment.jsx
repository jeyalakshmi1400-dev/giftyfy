import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/payment.css";

export default function Payment() {

  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    cart,
    selectedAddress,
    finalAmount,
    couponCode
  } = state || {};

  const [method, setMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const buyNowItem = state?.item || null;

  // =====================================
  // HANDLE PAYMENT
  // =====================================
  const handlePayment = async () => {

    try {

      setLoading(true);

      // =====================================
      // 💳 ONLINE PAYMENT
      // =====================================
      if (method === "razorpay") {

        // ✅ CHECK SDK
        if (!window.Razorpay) {
          alert("Razorpay SDK not loaded ❌");
          setLoading(false);
          return;
        }

        // ✅ CREATE RAZORPAY ORDER
        const res = await axios.post(
          "http://localhost:4000/api/payment/create-order",
          {
            amount: finalAmount
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        const { razorpayOrder, key } = res.data;

        // =====================================
        // RAZORPAY OPTIONS
        // =====================================
        const options = {

          key,

          amount: razorpayOrder.amount,

          currency: "INR",

          order_id: razorpayOrder.id,

          name: "Giftyfy",

          description: "Secure Payment",

          prefill: {
            name: `${selectedAddress?.firstName || ""} ${selectedAddress?.lastName || ""}`,
            contact: selectedAddress?.phone || ""
          },

          theme: {
            color: "#e91e63"
          },

          // =====================================
          // ✅ PAYMENT SUCCESS
          // =====================================
          handler: async function (response) {

            try {

              // ✅ VERIFY PAYMENT
              await axios.post(
                "http://localhost:4000/api/payment/verify",
                response,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                  }
                }
              );

              // ✅ CREATE ORDER AFTER PAYMENT SUCCESS
              const orderRes = await axios.post(
                "http://localhost:4000/api/orders",
                {
                  address: selectedAddress.address,
                  phone: selectedAddress.phone,
                  pincode: selectedAddress.pincode,
                  couponCode,
                  paymentMethod: "Online",
                  paymentId: response.razorpay_payment_id,
                  buyNowItem,
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                  }
                }
              );

              alert("Payment Successful 🎉");

              // ✅ SUCCESS PAGE
              navigate(`/success/${orderRes.data.order._id}`);

            } catch (err) {

              console.log(err);

              alert(
                err.response?.data?.message ||
                "Payment verification failed ❌"
              );
            }
          },

          // =====================================
          // ❌ PAYMENT CANCEL
          // =====================================
          modal: {
            ondismiss: function () {

              alert("Payment cancelled ❌");

            }
          }
        };

        // ✅ OPEN RAZORPAY
        const rzp = new window.Razorpay(options);

        rzp.open();
      }

      // =====================================
      // 🚚 COD
      // =====================================
      else {

        // ✅ CREATE ORDER DIRECTLY
        const orderRes = await axios.post(
          "http://localhost:4000/api/orders",
          {
            address: selectedAddress.address,
            phone: selectedAddress.phone,
            pincode: selectedAddress.pincode,
            couponCode,
            paymentMethod: "COD",
            buyNowItem,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        alert("Order placed successfully ✅");

        navigate(`/success/${orderRes.data.order._id}`);
      }

    } catch (err) {

      console.log(err);

      alert(
        err.response?.data?.message ||
        "Payment failed ❌"
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="payment-page">

      {/* ========================= */}
      {/* STEPS */}
      {/* ========================= */}
      <div className="steps">
        <span>Cart</span>
        <span>Address</span>
        <span className="active">Payment</span>
      </div>

      <div className="payment-container">

        {/* ========================= */}
        {/* LEFT */}
        {/* ========================= */}
        <div className="payment-left">

          <h3>Select Payment Method</h3>

          {/* ONLINE */}
          <div
            className={`pay-option ${method === "razorpay" ? "active" : ""}`}
            onClick={() => setMethod("razorpay")}
          >
            <input
              type="radio"
              checked={method === "razorpay"}
              readOnly
            />

            Online Payment (UPI / Card)
          </div>

          {/* COD */}
          <div
            className={`pay-option ${method === "cod" ? "active" : ""}`}
            onClick={() => setMethod("cod")}
          >
            <input
              type="radio"
              checked={method === "cod"}
              readOnly
            />

            Cash on Delivery
          </div>

          {/* ADDRESS */}
          <div className="address-box">

            <h4>Deliver To</h4>

            <p>
              {selectedAddress?.firstName}{" "}
              {selectedAddress?.lastName}
            </p>

            <p>{selectedAddress?.address}</p>

            <p>{selectedAddress?.city}</p>

            <p>{selectedAddress?.pincode}</p>

            <p>{selectedAddress?.phone}</p>

          </div>

        </div>

        {/* ========================= */}
        {/* RIGHT */}
        {/* ========================= */}
        <div className="payment-right">

          <h3>Order Summary</h3>

          {/* PRODUCTS */}
          {(buyNowItem
  ? [buyNowItem]
  : cart?.items || []
).map((item) => (

            <div
              key={item._id}
              className="summary-item"
            >

              <img
                src={`http://localhost:4000/uploads/${item.image}`}
                alt={item.name}
              />

              <div>

                <p>{item.name}</p>

                <p>Qty: {item.quantity}</p>

              </div>

              <span>
                ₹{item.price * item.quantity}
              </span>

            </div>
          ))}

          <hr />

          {/* TOTAL */}
          <div className="summary-total">

            <span>Total Payable</span>

            <span>₹{finalAmount}</span>

          </div>

          <p className="secure-text">
            🔒 Secure Payment via Razorpay
          </p>

          {/* BUTTON */}
          <button
            className="pay-btn"
            onClick={handlePayment}
            disabled={loading}
          >

            {loading
              ? "Processing..."
              : method === "cod"
              ? "PLACE ORDER"
              : "PAY NOW"}

          </button>

        </div>

      </div>

    </div>
  );
}