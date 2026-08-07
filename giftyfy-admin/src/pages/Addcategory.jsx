import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/CategoryPage.css";
import AdminLayout from "../layout/AdminLayout";
import { useNavigate } from "react-router-dom";

/* ---- small inline icon set (no extra dependency) ---- */
const Icon = {
  Search: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Plus: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Box: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
    </svg>
  ),
  Edit: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  Block: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="m5.5 5.5 13 13" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
    </svg>
  ),
  Close: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Upload: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 16V4M12 4 7 9M12 4l5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  ),
  Inbox: (p) => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  ),
};

export default function CategoryPage() {

  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editId,setEditId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
const [selectedSubcategory, setSelectedSubcategory] = useState("");
 const [selectedDate, setSelectedDate] = useState("");
 const [image, setImage] = useState(null);
const [newCategory, setNewCategory] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const [showModal, setShowModal] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("http://localhost:4000/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const blockCategory = async (id) => {
    try {

      const token = localStorage.getItem("token");

      await axios.put(`http://localhost:4000/api/categories/block/${id}`,{},{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      fetchCategories();
    } catch (error) {
      console.log(error);
    }
  };

 const addCategory = async(e)=>{
  e.preventDefault();

  try{

    const token = localStorage.getItem("token");
    const formData = new FormData();
    const finalCategory = category === "__new__" ? newCategory : category;

    formData.append("category", finalCategory);
    formData.append("subcategory",subcategory);
    formData.append("code",code);
    formData.append("date",date);
if (category === "__new__" && image) {
   formData.append("image", image);
}
    await axios.post("http://localhost:4000/api/categories",formData,{
      
    headers:{
      Authorization:`Bearer ${token}`,
      "Content-Type":"multipart/form-data",
    },
  });

  fetchCategories();

  setCategory("");
  setSubcategory("");
  setCode("");
  setDate("");

  setShowForm(false);
  setShowModal(false);

  }catch(error){
    console.log(error);
  }
 };



 const handleEdit =(item)=>{
  setShowModal(true);
  setIsEdit(true);
  setEditId(item._id);

  setCategory(item.category || "");
  setSubcategory(item.subcategory || "");
  setCode(item.code || "");
  setDate(item.date ? item.date.split("T")[0]: "");
 };


 const updateCategory = async(e)=>{
  e.preventDefault();

  try{
    const token = localStorage.getItem("token");
    const formData = new FormData();
    const finalCategory = category === "__new__" ? newCategory : category;

    formData.append("category", finalCategory);
    formData.append("subcategory",subcategory);
    formData.append("code",code);
    formData.append("date",date);
    if(image) {formData.append("image",image);}

    await axios.put(`http://localhost:4000/api/categories/${editId}`,formData,
    {
      headers:{
        Authorization:`Bearer ${token}`,
        "Content-Type":"multipart/form-data",
      },
    });
    fetchCategories();
    setShowModal(false);
    setIsEdit(false);
    setCategory("");
setSubcategory("");
setCode("");
setDate("");
setImage(null);
setEditId(null);
  }catch(error){
    console.log(error);
  }
};
const uniqueCategories = [...new Set(categories.map(item => item.category))];
const uniqueSubcategories = [
  ...new Set(
    categories
      .filter(item => {
        const categoryValue = String(item.category || "").toLowerCase().trim();
        return (
          !selectedCategory ||
          categoryValue === selectedCategory.toLowerCase().trim()
        );
      })
      .map(item => String(item.subcategory || ""))
  )
];
const filteredCategories = categories.filter(item => {

  const itemDate = item.date
    ? new Date(item.date).toISOString().split("T")[0]
    : "";

  const categoryValue = String(item.category || "").toLowerCase();
  const subcategoryValue = String(item.subcategory || "").toLowerCase();
  const codeValue = String(item.code || "").toLowerCase();

  const search = searchTerm.toLowerCase();

  return (
    (!selectedCategory || categoryValue === selectedCategory.toLowerCase()) &&
    (!selectedSubcategory || subcategoryValue === selectedSubcategory.toLowerCase()) &&
    (!selectedDate || itemDate === selectedDate) &&

    (
      categoryValue.includes(search) ||
      subcategoryValue.includes(search) ||
      codeValue.includes(search)
    )
  );
});



const deleteCategory = async (id) =>{
  const confirmDelete = window.confirm("Are you sure to delete this category ?");

  if(!confirmDelete)return;
  try{
    const token = localStorage.getItem("token");

    await axios.delete(`http://localhost:4000/api/categories/${id}`,{
      headers:{
        Authorization:`Bearer ${token}`
      }
    });
    fetchCategories();
  }catch(error){
    console.log(error);
  }
}


// Pagination
const totalPages = Math.ceil(
  filteredCategories.length / itemsPerPage
);

const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const currentCategories = filteredCategories.slice(
  indexOfFirstItem,
  indexOfLastItem
);

useEffect(() => {
  setCurrentPage(1);
}, [
  selectedCategory,
  selectedSubcategory,
  selectedDate,
  searchTerm
]);


  return (


<AdminLayout>
      <div className="cp-page">

        {/* HEADER */}
        <div className="cp-header">
          <div className="cp-header-titles">
            <h1>Category Management</h1>
            <p>Organize and manage your product categories, subcategories and codes.</p>
          </div>

          <div className="cp-header-actions">
            <button className="cp-btn cp-btn-outline" onClick={()=>navigate("/admin/addproduct")}>
              <Icon.Box /> Add New Product
            </button>

            <button
              className="cp-btn cp-btn-primary"
              onClick={() => {
                setShowModal(true);
                setIsEdit(false);
              }}
            >
              <Icon.Plus /> Add New Category
            </button>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="cp-card cp-filters">
          <div className="cp-search">
            <Icon.Search />
            <input
              type="text"
              placeholder="Search by category, subcategory or code..."
              className="cp-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="cp-field dropdown"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
            }}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            className="cp-field dropdown"
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
          >
            <option value="">All Subcategories</option>
            {uniqueSubcategories.map((sub, index) => (
              <option key={index} value={sub}>{sub}</option>
            ))}
          </select>

          <input
            type="date"
            className="cp-field date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {(searchTerm || selectedCategory || selectedSubcategory || selectedDate) && (
            <button
              type="button"
              className="cp-filters-clear"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedSubcategory("");
                setSelectedDate("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* TABLE CARD */}
        <div className="cp-card cp-table-card">

          {isLoading ? (
            <div className="cp-loading">
              <div className="cp-spinner" />
              <p>Loading categories…</p>
            </div>
          ) : currentCategories.length === 0 ? (
            <div className="cp-empty">
              <Icon.Inbox />
              <h4>No categories found</h4>
              <p>Try adjusting your filters, or add a new category to get started.</p>
            </div>
          ) : (
            <div className="cp-table-scroll">
              <table className="cp-table">

                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                    <th>Code</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {currentCategories.map((item) => (

                    <tr key={item._id}>
                      <td>
                        <img
                          src={`http://localhost:4000/uploads/${item.image}`}
                          alt="category"
                          className="cp-thumb"
                        />
                      </td>

                      <td className="cp-cat-name">{item.category}</td>
                      <td>{item.subcategory}</td>
                      <td><span className="cp-code">{item.code}</span></td>
                      <td>{item.date}</td>

                      <td>
                        <span
                          className={
                            item.status === "Active"
                              ? "cp-status cp-status-active"
                              : "cp-status cp-status-blocked"
                          }
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div className="cp-actions">
                          <button className="cp-icon-btn edit" onClick={()=>handleEdit(item)}>
                            <Icon.Edit /> Edit
                          </button>

                          <button
                            className="cp-icon-btn block"
                            onClick={() => {
                              console.log("clicked", item._id);
                              blockCategory(item._id);
                            }}
                          >
                            <Icon.Block /> Block
                          </button>

                          <button
                            className="cp-icon-btn delete"
                            onClick={() => deleteCategory(item._id)}
                          >
                            <Icon.Trash /> Delete
                          </button>
                        </div>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!isLoading && currentCategories.length > 0 && (
            <div className="cp-pagination">

              <button
                className="cp-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                ← Prev
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={
                    currentPage === index + 1
                      ? "cp-page-btn active"
                      : "cp-page-btn"
                  }
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className="cp-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next →
              </button>

            </div>
          )}
        </div>

        {/* ADD / EDIT MODAL */}
        {showModal && (
          <div className="cp-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="cp-modal" onClick={(e) => e.stopPropagation()}>

              <div className="cp-modal-head">
                <h3>{isEdit ? "Edit Category" : "Add Category"}</h3>
                <button className="cp-modal-close" onClick={() => setShowModal(false)}>
                  <Icon.Close />
                </button>
              </div>

              <form className="cp-form" onSubmit={isEdit ? updateCategory : addCategory}>

                <div className="cp-form-group span-2">
                  <label>Category</label>
                  <select
                    className="cp-field"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value !== "__new__") {
                        setNewCategory("");
                      }
                    }}
                  >
                    <option value="">Select Category</option>

                    {uniqueCategories.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}

                    <option value="__new__">+ Add New Category</option>
                  </select>
                </div>

                {category === "__new__" && (
                  <>
                    <div className="cp-form-group span-2">
                      <label>New category name</label>
                      <input
                        type="text"
                        className="cp-field"
                        placeholder="Enter new category name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                    </div>

                    <div className="cp-form-group span-2">
                      <label>Category image</label>
                      <div className="cp-upload">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImage(e.target.files[0])}
                        />
                        <Icon.Upload />
                        <div className="cp-upload-text">Click to upload an image</div>
                        <div className="cp-upload-hint">PNG or JPG, up to a few MB</div>
                        {image && <div className="cp-upload-filename">{image.name}</div>}
                      </div>
                    </div>
                  </>
                )}

                <div className="cp-form-group">
                  <label>Subcategory</label>
                  <input
                    type="text"
                    className="cp-field"
                    placeholder="Subcategory"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  />
                </div>

                <div className="cp-form-group">
                  <label>Code</label>
                  <input
                    type="text"
                    className="cp-field"
                    placeholder="Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>

                <div className="cp-form-group span-2">
                  <label>Date</label>
                  <input
                    type="date"
                    className="cp-field"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="cp-modal-actions">
                  <button type="submit" className="cp-btn cp-btn-primary">
                    {isEdit ? "Update Category" : "Add Category"}
                  </button>

                  <button
                    type="button"
                    className="cp-btn cp-btn-outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
</AdminLayout>

  );
}