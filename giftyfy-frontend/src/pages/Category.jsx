import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/category.css";
import { FaStar, FaHeart, FaRegHeart, FaFilter, FaShoppingCart } from "react-icons/fa";

import { toast } from "react-toastify";

export default function Category() {
  const { name } = useParams();
  const navigate = useNavigate();

  const decodedName = decodeURIComponent(name);

  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
const [wishlist, setWishlist] = useState([]);

useEffect(() => {
  const userId = localStorage.getItem("userId");

  if (!userId) return;

  axios
    .get(`http://localhost:4000/api/wishlist/${userId}`)
    .then((res) => {
      setWishlist(res.data);
    })
    .catch(console.error);
}, []);
  // FETCH PRODUCTS
  useEffect(() => {
    fetchProducts();
  }, [name]);

  useEffect(() => {
  const userId = localStorage.getItem("userId");

  if (!userId) return;

  axios
    .get(`http://localhost:4000/api/wishlist/${userId}`)
    .then((res) => {
      setWishlist(res.data);
    })
    .catch(console.error);
}, []);




  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/product/category/${decodedName}`
      );

      setProducts(res.data);
    } catch (error) {
      console.log(error);
    }
  };



  // UNIQUE SUBCATEGORY
  const subcategories = [
    ...new Set(
      products
        .map((p) => p.subcategory)
        .filter(Boolean)
    ),
  ];

  // FILTER
  let filteredProducts = [...products];

  if (selectedSub) {
    filteredProducts = filteredProducts.filter(
      (p) => p.subcategory === selectedSub
    );
  }

  // SORT
  const sortedProducts = filteredProducts.sort((a, b) => {
    const priceA =
      a.discountType === "percentage"
        ? a.price - (a.price * a.discountValue) / 100
        : a.price - (a.discountValue || 0);

    const priceB =
      b.discountType === "percentage"
        ? b.price - (b.price * b.discountValue) / 100
        : b.price - (b.discountValue || 0);

    if (sort === "low") return priceA - priceB;
    if (sort === "high") return priceB - priceA;

    return 0;
  });

  // IMAGE
  const getImage = (product) => {
    if (product?.variants?.[0]?.images?.length > 0) {
      return product.variants[0].images[0];
    }

    if (product?.image?.length > 0) {
      return product.image[0];
    }

    if (product?.photos?.length > 0) {
      return product.photos[0];
    }

    return "https://dummyimage.com/400x400/eee/aaa";
  };

  // FINAL PRICE
  const getFinalPrice = (product) => {
    let price = product.price || 0;

    // GST
    price =
      price + (price * (product.gst || 0)) / 100;

    // DISCOUNT
    if (product.discountType === "percentage") {
      price =
        price -
        (price * product.discountValue) / 100;
    }

    if (product.discountType === "flat") {
      price =
        price - (product.discountValue || 0);
    }

    return Math.max(Math.round(price), 0);
  };


const handleWishlist = async (e, product) => {
  e.stopPropagation();

  const userId = localStorage.getItem("userId");

  if (!userId) {
    toast.error("Please Login First", {
      position: "bottom-right",
    });
    return;
  }

  try {
    const existing = wishlist.find(
      (item) =>
        String(item.productId) === String(product._id)
    );

    // REMOVE
    if (existing) {
      await axios.delete(
        `http://localhost:4000/api/wishlist/remove/${existing._id}`
      );

      setWishlist((prev) =>
        prev.filter((item) => item._id !== existing._id)
      );

      toast.info("Removed from Wishlist 💔", {
        position: "bottom-right",
        autoClose: 1500,
      });

      return;
    }

    // ADD
    const res = await axios.post(
      "http://localhost:4000/api/wishlist",
      {
        userId,
        productId: product._id,
      }
    );

    if (res.data?.newItem) {
      setWishlist((prev) => [
        ...prev,
        res.data.newItem,
      ]);
    }

    toast.success("Added to Wishlist ❤️", {
      position: "bottom-right",
      autoClose: 1500,
    });

  } catch (err) {
    console.log(err);
    toast.error("Something went wrong", {
      position: "bottom-right",
    });
  }
};
  return (
    <div className="gfc-category-page">

      {/* HERO */}
      <div className="gfc-category-hero">
        <div className="gfc-category-overlay">

          <p className="gfc-breadcrumb">
            Home &gt; Category &gt; {decodedName}
          </p>

          <h1 className="gfc-category-title">
            {decodedName}
          </h1>

          <p className="gfc-category-subtitle">
            Explore premium gifts & trending
            collections curated for every occasion
          </p>

        </div>
      </div>

      {/* TOP BAR */}
      <div className="gfc-topbar">

        <div className="gfc-product-count">
          {sortedProducts.length} Products Found
        </div>

        <div className="gfc-sort-box">

          <FaFilter />

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value)
            }
          >
            <option value="">
              Sort Products
            </option>

            <option value="low">
              Price Low → High
            </option>

            <option value="high">
              Price High → Low
            </option>
          </select>

        </div>

      </div>

      {/* SUBCATEGORY CHIPS */}
      {subcategories.length > 0 && (
        <div className="gfc-chip-wrapper">

          <button
            className={`gfc-chip ${
              selectedSub === ""
                ? "gfc-chip-active"
                : ""
            }`}
            onClick={() => setSelectedSub("")}
          >
            All
          </button>

          {subcategories.map((sub, index) => (
            <button
              key={index}
              className={`gfc-chip ${
                selectedSub === sub
                  ? "gfc-chip-active"
                  : ""
              }`}
              onClick={() =>
                setSelectedSub(sub)
              }
            >
              {sub}
            </button>
          ))}

        </div>
      )}

      {/* PRODUCTS */}
      <div className="gfc-product-grid">

        {sortedProducts.map((product) => {

          const finalPrice =
            getFinalPrice(product);

          return (
            <div
              className="gfc-product-card"
              key={product._id}
              onClick={() =>
                navigate(
                  `/product/${product._id}`
                )
              }
            >

              {/* IMAGE */}
              <div className="gfc-image-box">

                <img
                  src={`http://localhost:4000/uploads/${getImage(
                    product
                  )}`}
                  alt={product.name}
                  className="gfc-product-image"
                />

                {product.discountValue > 0 && (
                  <span className="gfc-offer-badge">
                    {product.discountType ===
                    "percentage"
                      ? `${product.discountValue}% OFF`
                      : `₹${product.discountValue} OFF`}
                  </span>
                )}

  <button
  className="gfc-wishlist-btn"
  onClick={(e) => handleWishlist(e, product)}
>
  {wishlist.some(
    (item) =>
      String(item.productId) === String(product._id)
  ) ? (
    <FaHeart color="red" />
  ) : (
    <FaRegHeart />
  )}
</button>
              </div>

              {/* CONTENT */}
              <div className="gfc-product-content">

                {product.subcategory && (
                  <p className="gfc-subcategory">
                    {product.subcategory}
                  </p>
                )}

                <h3 className="gfc-product-name">
                  {product.name}
                </h3>

                <div className="gfc-rating-row">
                  <FaStar />
                  <span>4.5</span>
                  <small>(120 Reviews)</small>
                </div>

                {/* PRICE */}
                <div className="gfc-price-row">

                  <span className="gfc-final-price">
                    ₹{finalPrice}
                  </span>

                  {product.discountValue >
                    0 && (
                    <span className="gfc-old-price">
                      ₹{product.price}
                    </span>
                  )}

                </div>

                {/* BUTTON */}
                <button className="gfc-cart-btn">
                  <FaShoppingCart />
                  Add To Cart
                </button>

              </div>
            </div>
          );
        })}

      </div>

      {/* EMPTY */}
      {sortedProducts.length === 0 && (
        <div className="gfc-empty-box">
          <h2>No Products Found</h2>
          <p>
            Try changing filters or explore
            other categories
          </p>
        </div>
      )}

    </div>
  );
}