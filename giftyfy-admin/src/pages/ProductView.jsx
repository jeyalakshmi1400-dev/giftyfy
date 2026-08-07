import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import { useParams } from "react-router-dom";
import "../styles/productview.css";
import AdminLayout from "../layout/AdminLayout";

export default function ProductView() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/product/${id}`
      );
      setProduct(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (!product) return <h3>Loading.....</h3>;

  const totalQty =
    product.category === "Dress"
      ? product.variants?.reduce((total, variant) => {
          const variantQty = variant.sizes?.reduce(
            (sum, size) => sum + Number(size.quantity || 0),
            0
          );
          return total + variantQty;
        }, 0)
      : product.quantity;

  return (
   <AdminLayout>

      <div className="product-view">

  {/* 🔥 NON-DRESS → IMAGE LEFT */}
  {product.category !== "Dress" && (
    <div className="product-top">
<img
src={`http://localhost:4000/uploads/${product.image ?.[0]}`}
alt=""
className="product-image"
/>

      <div className="right-info">
        <h2>{product.name}</h2>

        <p><b>Qty:</b> {product.quantity}</p>
        <p><b>Price:</b> ₹{product.price}</p>
        <p><b>Category:</b> {product.category}</p>
        <p><b>SubCategory:</b> {product.subcategory}</p>
        <p>
            <b>City:</b>{" "}
            {product.locations?.map((loc, i) => (
              <span key={i}>
                {loc.city}
                {i !== product.locations.length - 1 && ", "}
              </span>
            ))}
          </p>

          <p>
            <b>Pincode:</b>{" "}
            {product.locations?.map((loc, i) => (
              <span key={i}>
                {Array.isArray(loc.pincode)
                  ? loc.pincode.join(", ")
                  : loc.pincode}
                {i !== product.locations.length - 1 && ", "}
              </span>
            ))}
          </p>

      </div>

    </div>
  )}

  {/* 🔥 DRESS → FULL CARD (NO IMAGE LEFT) */}
  {product.category === "Dress" && (
    <div className="product-card">
      <h2>{product.name}</h2>

      <p><b>Category:</b> {product.category}</p>
      <p><b>SubCategory:</b> {product.subcategory}</p>
      <p>
            <b>City:</b>{" "}
            {product.locations?.map((loc, i) => (
              <span key={i}>
                {loc.city}
                {i !== product.locations.length - 1 && ", "}
              </span>
            ))}
          </p>

          <p>
            <b>Pincode:</b>{" "}
            {product.locations?.map((loc, i) => (
              <span key={i}>
                {Array.isArray(loc.pincode)
                  ? loc.pincode.join(", ")
                  : loc.pincode}
                {i !== product.locations.length - 1 && ", "}
              </span>
            ))}
          </p>


      {/* VARIANTS */}
      <div className="variants-section">
        {product.variants?.map((variant, i) => (
          <div key={i} className="variant-card">

            <h4>Color: {variant.color}</h4>

            <div className="variant-images">
              {variant.images?.map((img, index) => (
                <img
                  key={index}
                  src={`http://localhost:4000/uploads/${img}`}
                  alt=""
                />
              ))}
            </div>

            <table className="variant-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Qty</th>
                </tr>
              </thead>

              <tbody>
                {variant.sizes?.map((s, idx) => (
                  <tr key={idx}>
                    <td>{s.size}</td>
                    <td>₹{s.price}</td>
                    <td>{s.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        ))}
      </div>
    </div>
  )}
  
        {/* DESCRIPTION */}
        <div className="description">
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        {/* OFFER */}
        <div className="offer">
          <h3>Offer</h3>
          <p>
            {product.discountType === "percentage"
              ? `${product.discountValue}% OFF`
              : `₹${product.discountValue} OFF`}
          </p>
        </div>

</div>
    </AdminLayout>
  );
}