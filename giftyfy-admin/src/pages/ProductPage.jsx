import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/product.css"
import AdminLayout from "../layout/AdminLayout";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategoryies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [expandedPincode, setExpandedPincode] = useState({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
const productsPerPage = 10;

  const navigate = useNavigate();

  // Fetch
  const fetchProducts = async () => {
    const res = await axios.get("http://localhost:4000/api/product");
    setProducts(res.data);
  };

  const fetchCategories = async () => {
    const res = await axios.get("http://localhost:4000/api/categories");
    setCategoryies(res.data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Unique category
  const uniqueCategories = [...new Set(categories.map((c) => c.category))];

  const uniqueSubcategories = [
    ...new Map(
      categories
        .filter(
          (c) =>
            !selectedCategory ||
            c.category?.toLowerCase() === selectedCategory.toLowerCase()
        )
.map((c) => {
  const sub = String(c.subcategory || "").trim();
  return [sub.toLowerCase(), sub];
})
    ).values(),
  ];

  // Filter
  const filteredProducts = products.filter((p) => {
    return (
      (!selectedCategory ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase()) &&
      (!selectedSubcategory ||
        p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase()) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Delete
  const deleteProduct = async (id) => {
    const token = localStorage.getItem("token");

    await axios.delete(`http://localhost:4000/api/product/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchProducts();
  };

  // Toggle pincode
  const togglePincode = (id) => {
    setExpandedPincode((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Pagination
const totalPages = Math.ceil(
  filteredProducts.length / productsPerPage
);

const indexOfLastProduct = currentPage * productsPerPage;
const indexOfFirstProduct =
  indexOfLastProduct - productsPerPage;

const currentProducts = filteredProducts.slice(
  indexOfFirstProduct,
  indexOfLastProduct
);
useEffect(() => {
  setCurrentPage(1);
}, [
  search,
  selectedCategory,
  selectedSubcategory
]);

  return (
  
<AdminLayout>
<div className="giftyfy-product-page container-fluid p-4">
    {/* 🔥 STATS CARDS */}
<div className="giftyfy-product-stats">

  <div className="giftyfy-product-stat-col">

    <div className="giftyfy-product-stat-card">

      <div className="giftyfy-product-stat-body">

        <div className="giftyfy-product-stat-content">

          <h6 className="giftyfy-stat-title">
            Total Products
          </h6>

          <h4 className="giftyfy-stat-count">
            {products.length}
          </h4>

        </div>

        <div className="giftyfy-product-stat-icon">
          <i className="bi bi-box"></i>
        </div>

      </div>

    </div>

  </div>

  <div className="giftyfy-product-stat-col">

    <div className="giftyfy-product-stat-card">

      <div className="giftyfy-product-stat-body">

        <div className="giftyfy-product-stat-content">

          <h6 className="giftyfy-stat-title">
            Categories
          </h6>

          <h4 className="giftyfy-stat-count">
            {uniqueCategories.length}
          </h4>

        </div>

        <div className="giftyfy-product-stat-icon">
          <i className="bi bi-tags"></i>
        </div>

      </div>

    </div>

  </div>

</div>
    {/* 🔥 FILTER BAR */}
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body d-flex gap-3 flex-wrap">

        <input
          type="text"
          className="form-control w-auto"
          placeholder="🔍 Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select w-auto"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory("");
          }}
        >
          <option value="">All Category</option>
          {uniqueCategories.map((cat, i) => (
            <option key={i}>{cat}</option>
          ))}
        </select>

        <select
          className="form-select w-auto"
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
        >
          <option value="">All Subcategory</option>
          {uniqueSubcategories.map((sub, i) => (
            <option key={i}>{sub}</option>
          ))}
        </select>

      </div>
    </div>

    {/* 🔥 TABLE */}
   <div className="card shadow-sm border-0">
  <div className="card-body p-0">

    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">

        {/* HEADER */}
        <thead className="giftyfy-product-thead">
          <tr className="text-center">
            <th style={{ width: "25%" }}>Product</th>
            <th style={{ width: "15%" }}>Category</th>
            <th style={{ width: "15%" }}>City</th>
            <th style={{ width: "20%" }}>Pincode</th>
            <th style={{ width: "10%" }}>Qty</th>
            <th style={{ width: "15%" }}>Action</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {currentProducts.map((p) => (
            <tr key={p._id} className="text-center">

              {/* PRODUCT */}
              <td className="text-start">
                <div className="d-flex align-items-center gap-3">

                  <img
                    src={
                      p.category === "Dress"
                        ? p.variants?.[0]?.images?.[0]
                          ? `http://localhost:4000/uploads/${p.variants[0].images[0]}`
                          : "/no-image.png"
                        : p.image?.[0]
                        ? `http://localhost:4000/uploads/${p.image[0]}`
                        : "/no-image.png"
                    }
                    className="giftyfy-product-image"
                    style={{
                      width: "55px",
                      height: "55px",
                      objectFit: "cover"
                    }}
                  />

                  <div className="text-truncate" style={{ maxWidth: "180px" }}>
                    <div className="giftyfy-product-name">
  {p.name}
</div>
                  </div>

                </div>
              </td>

              {/* CATEGORY */}
            <td>
                <div className="giftyfy-product-category">
  {p.category}
</div>

<div className="giftyfy-product-subcategory">
  {p.subcategory}
</div>
              </td>

              {/* CITY */}
              <td className="small">
                {p.locations?.map((loc, i) => (
                  <div key={i}>{loc.city}</div>
                ))}
              </td>

             

              {/* PINCODE */}
              <td className="text-start">
                {p.locations?.map((loc, i) => {
                  const pins = loc.pincode || [];
                  const isExpanded = expandedPincode[p._id];

                  const visible = isExpanded ? pins : pins.slice(0, 2);

                  return (
                    <div key={i} className="mb-1">

                      {visible.map((pin, idx) => (
                        <span
                          key={idx}
className="giftyfy-pincode-badge"                        >
                          {pin}
                        </span>
                      ))}

                      {pins.length > 2 && (
                        <button
                          className="giftyfy-more-btn"
                          onClick={() => togglePincode(p._id)}
                        >
                          {isExpanded ? "Less" : "More"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </td>

              {/* QTY */}
              <td>
  <span className="giftyfy-qty-badge">
    {p.category === "Dress"
      ? p.variants?.reduce((t, v) => {
          return (
            t +
            v.sizes?.reduce(
              (s, size) => s + Number(size.quantity || 0),
              0
            )
          );
        }, 0)
      : p.quantity}
  </span>
</td>

              {/* ACTION */}
 <td>
  <div className="d-flex justify-content-center gap-2">

    <button
      className="btn btn-sm giftyfy-btn-view"
      onClick={() => navigate(`/admin/product/${p._id}`)}
    >
      View
    </button>

    <button
      className="btn btn-sm giftyfy-btn-edit"
      onClick={() =>
        navigate(`/admin/product/edit/${p._id}`)
      }
    >
      Edit
    </button>

    <button
      className="btn btn-sm giftyfy-btn-delete"
      onClick={() => deleteProduct(p._id)}
    >
      Delete
    </button>

  </div>
</td>

            </tr>
          ))}
        </tbody>

      </table>
      <div className="giftyfy-pagination">

  <button
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage((prev) => prev - 1)
    }
  >
    Prev
  </button>

  {[...Array(totalPages)].map((_, index) => (
    <button
      key={index}
      className={
        currentPage === index + 1
          ? "active-page"
          : ""
      }
      onClick={() =>
        setCurrentPage(index + 1)
      }
    >
      {index + 1}
    </button>
  ))}

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

  </div>
</div>

  </div>
  </AdminLayout>

  );
};

export default ProductPage;