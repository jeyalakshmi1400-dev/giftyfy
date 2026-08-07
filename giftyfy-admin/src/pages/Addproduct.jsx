import React, { useEffect, useState ,useRef} from "react";
import axios from "axios";
import "../styles/addproduct.css";
import AdminSidebar from "../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { components } from "react-select";
import { useParams } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import TipTapEditor from "../components/TipTapEditor";
import DOMPurify from "dompurify";



export default function AddProduct() {

  const [product,setProduct]=useState({
    name:"",
    category:"",
    subcategory:"",
    brand:"",
    price:"",
     purchasePrice:"",
    gst:"",
    discountType:"flat",
    discountValue:"",
    quantity:"",
    description:"",
      isCustomized:false,
  customizationFields:[],

  });
const { id } = useParams(); 
const [colors, setColors] = useState([]);



  const navigate = useNavigate();
  const [categories,setCategoryies] = useState([]);
  const [locations,setLocations] = useState([{city:"",pincode:[]}]);
  const [pincodeOptions,setPincodeOptions]=  useState({});
  const [images,setImages] = useState([]);
  const [preview,setPreview] = useState([]);
  const [cities, setCities] = useState([]);
  const [showAllSelected, setShowAllSelected] = useState({});
  const fileInputRefs = useRef([]);

  const [existingImages, setExistingImages] = useState([]);
const [existingVariantImages, setExistingVariantImages] = useState([]);

const [aiPreview, setAiPreview] = useState("");
const [showPreview, setShowPreview] = useState(false);
const [descriptionMode, setDescriptionMode] = useState("manual");


  // ✅ FINAL PRICE (NEW)
  const price = Number(product.price);
  const discount = Number(product.discountValue);
  const  gst = Number(product.gst);

  const isDress = product.category?.trim() === "Dress";

  

  const discountedPrice =
    product.discountType === "percentage"
      ? price - (price * discount) / 100
      : price - discount;

  const finalPrice = discountedPrice+(discountedPrice*gst)/100;
const estimatedProfit =
  finalPrice -
  Number(product.purchasePrice || 0);


  const handleChange = (e) => {
  const { name, value } = e.target;

  setProduct((prev) => ({
    ...prev,
    [name]: value,
    ...(name === "category" && { subcategory: "" })
  }));

  
 if (name === "category") {
  if (value === "Dress") {
    setColors([
      {
        color: "",
        images: [],
        preview: [],
        sizes: [{ size: "", price: "", quantity: "",purchasePrice:"", }],
        showImages: true
      }
    ]);
  } else {
    setColors([]); // 🔥 reset
  }
}
};

  const addLocation = ()=>{
    setLocations([...locations,{city:"",pincode:[]}]);
  };

  const removeLocation =(index)=>{
    const values= locations.filter((_,i)=>i !== index);
    setLocations(values);
  };

  // ✅ FIXED SUBMIT
const submitHandler = async (e) => {
  e.preventDefault();
console.log(product);
  // Convert numeric values
  const price = Number(product.price) || 0;
  const discount = Number(product.discountValue) || 0;
  const gst = Number(product.gst) || 0;
  const quantity = Number(product.quantity) || 0;

  // Validation
  if (product.discountType === "percentage" && discount > 100) {
    alert("Discount cannot be more than 100%");
    return;
  }
  if (product.discountType === "flat" && discount > price) {
    alert("Discount cannot be higher than price");
    return;
  }
  if (gst > 100) {
    alert("GST cannot be more than 100%");
    return;
  }

  const formData = new FormData();

  // Append basic product info
  formData.append("name", product.name);
  formData.append("category", product.category);
  formData.append("subcategory", product.subcategory);
  formData.append("brand", product.brand || "");
  formData.append("price", price);
  formData.append(
  "purchasePrice",
  Number(product.purchasePrice) || 0
);
  formData.append("gst", gst);
  formData.append("discountType", product.discountType);
  formData.append("discountValue", discount);
  formData.append("quantity", quantity);
  formData.append("description", product.description || "");
  // ✅ CUSTOMIZATION
formData.append(
  "isCustomized",
  product.isCustomized
);

formData.append(
  "customizationFields",
  JSON.stringify(product.customizationFields)
);

  // Locations → convert pincode to numbers
  const formattedLocations = locations.map((loc) => ({
    city: loc.city,
    pincode: loc.pincode.map((p) => Number(p) || 0),
  }));
  formData.append("locations", JSON.stringify(formattedLocations));

  // 🔹 NORMAL IMAGES
  // Include existing images
formData.set("existingImages", JSON.stringify(existingImages || []));
// Append newly uploaded images
if (images && images.length > 0) {
  images.forEach((img) => {
    formData.append("images", img);
  });
}


  // 🔹 VARIANTS
 const formattedVariants = colors.map((col) => ({
  color: col.color || "",
  sizes: col.sizes.map((sz) => ({
    size: sz.size || "",
    price: Number(sz.price) || 0,
    purchasePrice:
  Number(sz.purchasePrice) || 0,
    quantity: Number(sz.quantity) || 0,
  })),
  images: col.existingImages || [] // 🔥🔥 THIS IS THE FIX
}));
  formData.append("variants", JSON.stringify(formattedVariants));

  // Variant images
  colors.forEach((col, cIndex) => {
    // Existing variant images first
    formData.append(
  `existingVariantImages[${cIndex}]`,
  JSON.stringify(col.existingImages || [])
);
    // Append newly uploaded variant images
    col.images.forEach((img) =>
      formData.append(`variantImages[${cIndex}]`, img)
    );
  });

  const token = localStorage.getItem("token");

  try {
    if (id) {
      // UPDATE PRODUCT
      await axios.put(`http://localhost:4000/api/product/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Product updated successfully ✅");
    } else {
      // CREATE PRODUCT
      await axios.post("http://localhost:4000/api/product", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Product added successfully ✅");
    }

    navigate("/admin/product");
  } catch (err) {
    console.error("Submit Error:", err);
    console.log("Existing Images:", existingImages);
console.log("New Images:", images);
    alert(
      "Something went wrong! ❌ Check console for details or verify backend expects correct data types."
    );
  }
};

  const handleImage = (e)=>{
    const files = Array.from(e.target.files);

    if(images.length + files.length > 5){
      alert("Only 5 images allowed");
      return;
    }

    setImages((prev)=>[...prev,...files]);

    const previews = files.map((file)=>URL.createObjectURL(file));
    setPreview((prev)=>[...prev,...previews]);
  };

 const removeImage = (index) => {
  if (index < existingImages.length) {
    // Remove from existingImages if index is in existing
    const updatedExisting = [...existingImages];
    updatedExisting.splice(index, 1);
    setExistingImages(updatedExisting);
  } else {
    // Remove from newly uploaded images
    const newIndex = index - existingImages.length;
    setImages(prev => prev.filter((_, i) => i !== newIndex));
  }

  // Remove from preview
  setPreview(prev => prev.filter((_, i) => i !== index));
};



  const fetchCategories = async ()=>{
    try{
      const res = await axios.get("http://localhost:4000/api/categories");
      setCategoryies(res.data);
    }catch(error){
      console.log(error);
    }
  }

  const fetchCities = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/product/cities");
      setCities(res.data);
    } catch (error) {
      console.log(error);
    }
  };

 const fetchPincodes = async (city, index) => {
  try {
    const res = await axios.get(
      `http://localhost:4000/api/product/pincodes/${city}`
    );

    const pins = res.data;

    const options = [
      { label: "Select All", value: "ALL" },
      ...pins.map((pin) => ({
        label: pin,
        value: String(pin) // 🔥 MUST STRING
      }))
    ];

    setPincodeOptions((prev) => ({
      ...prev,
      [index]: options // 🔥 index based store
    }));

  } catch (error) {
    console.log(error);
  }
};

 useEffect(() => {
  fetchCategories();
  fetchCities();

  if (id) {
    fetchProduct(); // 👈 call only in edit mode
  }
}, [id]);
  const cityOptions = cities.map((city) => ({
    label: city,
    value: city
  }));

const CustomValueContainer = ({ children, ...props }) => {
  const selected = props.getValue();

  return (
    <components.ValueContainer {...props}>
      {selected.length > 0 ? (
        <span style={{ marginLeft: "8px", fontWeight: "500" }}>
          Selected ({selected.length})
        </span>
      ) : (
        children
      )}
    </components.ValueContainer>
  );
};
const uniqueCategories = [
  ...new Set(categories.map(cat => cat.category))
];

const addColor = () => {
  setColors([
    ...colors,
    {
      color: "",
      images: [],
      preview: [],
      sizes: [{ size: "", price: "", quantity: "", purchasePrice: "", }],
      showImages: true   // ✅ every new color opens image
    }
  ]);
};

const handleColorChange =(index,value)=>{
  const updated =[...colors];
  updated[index].color = value;
  setColors(updated);
};

const handleColorImages = (e, index) => {
  const files = Array.from(e.target.files);

  const updated = [...colors];

  if (updated[index].images.length + files.length > 5) {
    alert("Only 5 images allowed");
    return;
  }

  updated[index].images.push(...files);
  updated[index].preview.push(
    ...files.map(file => URL.createObjectURL(file))
  );

  setColors(updated);
};
const removeColorImage = (cIndex, imgIndex) => {
  const updated = [...colors];
  const col = updated[cIndex];

  const existingLength = col.existingImages?.length || 0;

  if (imgIndex < existingLength) {
    // 🔥 remove from existing
    col.existingImages = col.existingImages.filter((_, i) => i !== imgIndex);
  } else {
    // 🔥 remove from new images
    const newIndex = imgIndex - existingLength;
    col.images = col.images.filter((_, i) => i !== newIndex);
  }

  // 🔥 rebuild FULL preview (IMPORTANT)
  const existingPreview = (col.existingImages || []).map(
    img => `http://localhost:4000/uploads/${img}`
  );

  const newPreview = (col.images || []).map(
    file => URL.createObjectURL(file)
  );

  col.preview = [...existingPreview, ...newPreview];

  setColors(updated);
};



const addSize = (colorIndex)=>{
  const updated =[...colors];

  updated[colorIndex].sizes.push({
    size:"",
    price:"",
    purchasePrice:"",
    quantity:""
  });

  setColors(updated);
};


const handleSizeChange = (colorIndex, sizeIndex, field, value) => {
  setColors((prev) => {
    const updated = [...prev];

    const sizes = [...updated[colorIndex].sizes];

    sizes[sizeIndex] = {
      ...sizes[sizeIndex],
      [field]: value,
    };

    updated[colorIndex] = {
      ...updated[colorIndex],
      sizes,
    };

    return updated;
  });
};


const fetchProduct = async () => {
  try {
    const res = await axios.get(`http://localhost:4000/api/product/${id}`);
    const data = res.data;

    // Set product basic info
    setProduct({
      ...data,
       isCustomized:
    data.isCustomized || false,

  customizationFields:
    data.customizationFields || [],
      price: data.price || "",
       purchasePrice:
    data.purchasePrice || "",
      gst: data.gst || "",
      discountValue: data.discountValue || "",
      quantity: data.quantity || "",
    });

    // 🔹 NORMAL IMAGES (for non-Dress products)
    if (data.image && data.image.length > 0) {
      const uniqueImages = [...new Set(data.image)]; // remove duplicates
      setExistingImages(uniqueImages); // backend files
      setPreview(uniqueImages.map(img => `http://localhost:4000/uploads/${img}`)); // frontend preview
    } else {
      setExistingImages([]);
      setPreview([]);
    }

    // 🔹 LOCATIONS
    if (data.locations) {
      const parsed = typeof data.locations === "string" ? JSON.parse(data.locations) : data.locations;

      const formattedLocations = parsed.map(loc => ({
        city: loc.city,
        pincode: loc.pincode.map(p => String(p)),
      }));

      setLocations(formattedLocations);

      // Fetch pincodes for each city
      formattedLocations.forEach((loc, index) => {
        if (loc.city) fetchPincodes(loc.city, index);
      });
    } else {
      setLocations([{ city: "", pincode: [] }]);
    }

    // 🔹 DRESS VARIANTS
    if (data.category === "Dress" && data.variants) {
      const updatedColors = data.variants.map(col => ({
        ...col,
        images: [], // new uploads by user
        existingImages: col.images || [], // backend images
        preview: col.images
          ? col.images.map(img => `http://localhost:4000/uploads/${img}`)
          : [],
        showImages: true,
       sizes: col.sizes.map((sz) => ({
  size: sz.size || "",
  price: Number(sz.price) || 0,
  purchasePrice:
    Number(sz.purchasePrice) || 0,
  quantity: Number(sz.quantity) || 0,
})),
      }));

      setColors(updatedColors);
    } else {
      setColors([]);
    }

  } catch (err) {
    console.log("Fetch Product Error:", err);
  }
};

const generateAIDescription = async () => {
  try {
    const res = await axios.post(
      "http://localhost:4000/api/ai/generate-description",
      {
        productName: product.name,
      }
    );

    setAiPreview(res.data.description);
    setShowPreview(true); // 👈 open preview box
  } catch (err) {
    console.log(err);
    alert("AI failed ❌");
  }
};


 return (
<div>
<AdminLayout>

<div className="ap-page">

<div className="ap-header">

  <div>
    <div className="ap-sectionTitle">
      Product Details
    </div>
    <h2>
      {id ? "Edit Product" : "Add Product"}
    </h2>
    <p>
      Manage your product inventory
    </p>
  </div>

  <button
    type="submit"
    form="productForm"
    className="ap-topPublish"
  >
    Publish Product
  </button>

</div>




<form
  id="productForm"
  onSubmit={submitHandler}
>
{/* DETAILS SECTION */}
<div className="ap-layout">
  
  <div className="ap-card">

<input 
  name="name" 
  value={product.name} 
  placeholder="Product Name" 
  onChange={handleChange}
  className="ap-input"
/>

{/* LOCATION */}
<span className="ap-fieldLabel">Delivery Locations</span>
{locations.map((loc, index) => (
<div className="ap-locationCard" key={index}>

<div className="ap-row">
<Select
  options={cityOptions}
  value={cityOptions.find(opt => opt.value === locations[index].city)}
  placeholder="Select City"
  className="citySelect"
  classNamePrefix="select"
  onChange={(selected) => {
    const values = [...locations];
    values[index].city = selected.value;
    values[index].pincode = []; // reset when city changes
    setLocations(values);

    // Fetch pincodes for this city
    fetchPincodes(selected.value, index);
  }}
/>
<Select
  options={pincodeOptions[index] || []}  // 🔹 safe access
  isMulti
  placeholder="Select Pincodes"
  className="citySelect"
  classNamePrefix="select"
  closeMenuOnSelect={false}
  hideSelectedOptions={false}
  components={{ ValueContainer: CustomValueContainer }}
  value={(pincodeOptions[index] || []).filter(opt =>
    locations[index]?.pincode?.includes(opt.value)
  )}
  onChange={(selected, actionMeta) => {
    const values = [...locations];
    const allPins = (pincodeOptions[index] || [])
      .filter(opt => opt.value !== "ALL")
      .map(opt => opt.value);

    if (!selected || selected.length === 0) {
      values[index].pincode = [];
    } else if (actionMeta.option.value === "ALL") {
      if (actionMeta.action === "select-option") {
        values[index].pincode = allPins;
      } else {
        values[index].pincode = [];
      }
    } else {
      values[index].pincode = selected
        .filter(item => item.value !== "ALL")
        .map(item => item.value);
    }

    setLocations(values);
  }}
/>
</div>

<div className="ap-locationBottom">
<span className="ap-selected">
  Selected: {locations[index]?.pincode?.length || 0}
</span>

{index !== 0 && (
<button type="button" className="ap-removeBtn" onClick={()=>removeLocation(index)}>Remove</button>
)}
</div>

</div>
))}

<button type="button" className="ap-btn ap-btnLight" style={{marginTop:"14px"}} onClick={addLocation}>+ Add More City</button>

{/* CATEGORY */}
<span className="ap-fieldLabel">Category</span>
<div className="ap-row">

<select
  name="category"
  value={product.category}
  onChange={handleChange}
  className="ap-select"
>
  <option value="">Select Category</option>

  {uniqueCategories.map((cat, index) => (
    <option key={index} value={cat}>
      {cat}
    </option>
  ))}
</select>

<select name="subcategory" value={product.subcategory} onChange={handleChange} className="ap-select">
    <option value="">Select Subcategory</option>

  {categories
    .filter(cat => cat.category === product.category)
    .map(cat => (
      <option key={cat._id} value={cat.subcategory}>
        {cat.subcategory}
      </option>
  ))}

</select>

</div>

{/* PRICE (ONLY NON-DRESS) */}
{/* PRICE (ONLY NON-DRESS) */}
{!isDress && (
  <>
  <span className="ap-fieldLabel">Pricing</span>
  <div className="ap-row">
    <input
      name="price"
      value={product.price}
      onChange={handleChange}
      placeholder="Selling Price"
      className="ap-input"
    />

    <input
      name="purchasePrice"
      value={product.purchasePrice}
      onChange={handleChange}
      placeholder="Purchase Price"
      className="ap-input"
    />

   
  </div>
  </>
)}

{/* QTY + BRAND */}
{product.category !== "Dress" && (
  <>
  <span className="ap-fieldLabel">Inventory</span>
  <div className="ap-row">
<input 
  name="quantity" 
  value={product.quantity} 
  onChange={handleChange}
  placeholder="Quantity"
  className="ap-input"
/>

<input 
  name="brand" 
  value={product.brand} 
  onChange={handleChange}
  placeholder="Brand"
  className="ap-input"
/>
  </div>
  </>
)}

{/* DISCOUNT */}
<span className="ap-fieldLabel">Tax &amp; Discount</span>
<div className="ap-row" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
   <input
      name="gst"
      value={product.gst}
      onChange={handleChange}
      placeholder="GST"
      className="ap-input"
    />

<select name="discountType" value={product.discountType} onChange={handleChange} className="ap-select">
<option value="flat">Flat (₹)</option>
<option value="percentage">Percentage (%)</option>
</select>

<input
type="number"
name="discountValue"
value={product.discountValue}
placeholder={product.discountType === "flat" ? "Enter Amount ₹" : "Enter %"}
onChange={handleChange}
className="ap-input"
/>




</div>
{product.category !== "Dress" && (
  <div className="ap-profit">
  <p
  style={{
    marginTop:"5px",
    fontWeight:"bold",
  }}
>
  Estimated Profit
  <br />
  <span style={{
    fontFamily:"var(--ap-font-mono)",
    fontSize:"28px",
    fontWeight:"600",
    color:"#ffffff",
    letterSpacing:"-0.01em"
  }}>
  ₹ {estimatedProfit > 0
      ? estimatedProfit
      : 0}
  </span>
</p>
</div>
)}

{/* =========================
   DESCRIPTION
========================= */}

<div className="descriptionSection">

  <h3>Description</h3>

  <div className="descriptionMode">

    <label className="radioBox">
      <input
        type="radio"
        name="descriptionMode"
        value="manual"
        checked={descriptionMode === "manual"}
        onChange={() => setDescriptionMode("manual")}
      />
      Write Manually
    </label>

    <label className="radioBox">
      <input
        type="radio"
        name="descriptionMode"
        value="ai"
        checked={descriptionMode === "ai"}
        onChange={() => setDescriptionMode("ai")}
      />
      Generate with AI
    </label>

  </div>

  {/* Manual Editor */}
  {descriptionMode === "manual" && (
    <TipTapEditor
      value={product.description}
      onChange={(value) =>
        setProduct((prev) => ({
          ...prev,
          description: value,
        }))
      }
    />
  )}

  {/* AI Generator */}
  {descriptionMode === "ai" && (
    <>
      <button
        type="button"
        className="ai-btn"
        onClick={generateAIDescription}
      >
        ✨ Generate AI Description
      </button>

    {showPreview && (
  <div className="ai-preview-box">

    <h3>✨ AI Generated Description Preview</h3>

   <div
  className="ai-preview-content"
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(aiPreview),
  }}
/>

    <div className="ai-preview-actions">

      <button
        type="button"
        onClick={() => {
  setProduct((prev) => ({
    ...prev,
    description: DOMPurify.sanitize(aiPreview),
  }));

  setDescriptionMode("manual");
  setShowPreview(false);
}}
      >
        ✅ Use This
      </button>

      <button
        type="button"
        onClick={() => setShowPreview(false)}
      >
        ❌ Cancel
      </button>

    </div>

  </div>
)}

    </>
  )}

</div>


{/* =========================
   CUSTOMIZATION SECTION
========================= */}

<div className="customizationBox">

  <label className="customizationToggle">

    <input
      type="checkbox"
      checked={product.isCustomized}
      onChange={(e)=>
        setProduct({
          ...product,
          isCustomized:e.target.checked
        })
      }
    />

    This Product Supports Customization

  </label>

  {product.isCustomized && (

    <div className="customFieldsBox">

      <h4>Customization Fields</h4>

      <div className="customFieldButtons">

        <button
          type="button"
          onClick={()=>
            setProduct({
              ...product,
              customizationFields:[
                ...product.customizationFields,
                "message"
              ]
            })
          }
        >
          + Message
        </button>

        <button
          type="button"
          onClick={()=>
            setProduct({
              ...product,
              customizationFields:[
                ...product.customizationFields,
                "image"
              ]
            })
          }
        >
          + Image Upload
        </button>

        <button
          type="button"
          onClick={()=>
            setProduct({
              ...product,
              customizationFields:[
                ...product.customizationFields,
                "name"
              ]
            })
          }
        >
          + Name
        </button>

      </div>

      <div className="selectedFields">

        {[...new Set(product.customizationFields)]
          .map((field,index)=>(

          <div
            key={index}
            className="selectedField"
          >

            {field}

            <span
              onClick={()=>{
                setProduct({
                  ...product,
                  customizationFields:
                    product.customizationFields
                    .filter((f)=>f !== field)
                })
              }}
            >
              ✖
            </span>

          </div>

        ))}

      </div>

    </div>

  )}

</div>



{/* ✅ DRESS VARIANTS */}
{product.category === "Dress" && (
  <div className="variantSection"> 

    <h3>Color Variants</h3>

    <button type="button" onClick={addColor}>
      + Add Color
    </button>

    {colors.map((col, cIndex) => (
      <div key={cIndex} className="productLayout">

        <div className="detailsSection">

          <input
            placeholder="Enter Color"
            value={col.color}
            onChange={(e) =>
              handleColorChange(cIndex, e.target.value)
            }
            className="ap-input"
          />

          <h4>Sizes</h4>

   {col.sizes.map((sz, sIndex) => (
  <div key={sIndex} className="sizeCard">

    {/* TOP ROW - SIZE ONLY */}
    <div className="sizeTop">
      <select
        value={sz.size || ""}
        onChange={(e) =>
          handleSizeChange(cIndex, sIndex, "size", e.target.value)
        }
        className="ap-select"
      >
        <option value="">Size</option>
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
      </select>
    </div>

    {/* BOTTOM ROW - PRICES */}
    <div className="sizeBottom">

      <input
        type="number"
        value={sz.price || ""}
        placeholder="Selling Price"
        onChange={(e) =>
          handleSizeChange(cIndex, sIndex, "price", e.target.value)
        }
        className="ap-input"
      />

      <input
        type="number"
        value={sz.purchasePrice || ""}
        placeholder="Purchase Price"
        onChange={(e) =>
          handleSizeChange(cIndex, sIndex, "purchasePrice", e.target.value)
        }
        className="ap-input"
      />

      <input
        type="number"
        value={sz.quantity || ""}
        placeholder="Qty"
        onChange={(e) =>
          handleSizeChange(cIndex, sIndex, "quantity", e.target.value)
        }
        className="ap-input"
      />

    </div>

  </div>
))}
          <button type="button" onClick={() => addSize(cIndex)}>
            + Add Size
          </button>

        </div>

      </div>
    ))}

  </div>
)}

<button type ="submit"  className="ap-submit">Publish Product</button>

  </div>
  <div className="ap-imageCard">

{/* ✅ NORMAL IMAGE ONLY FOR NON-DRESS */}
{product.category !== "Dress" && (
<>
  <span className="ap-fieldLabel" style={{marginTop:0}}>Product Images</span>

  {preview.length > 0 ? (
    <div className="ap-mainImage">
<img
  src={preview[0]}
  alt=""
/>      <button type="button" className="ap-removeMain" onClick={()=>removeImage(0)}>✕</button> 
    </div>
  ) : (
    <label className="ap-mainImage" style={{display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexDirection:"column",gap:"8px",color:"var(--ap-text-faint)",fontSize:"13px",fontWeight:600}}>
      <input type="file" multiple accept="image/*" onChange={handleImage} hidden className="ap-input"/>
      <span style={{fontSize:"30px",color:"var(--ap-accent)"}}>+</span>
      Drag &amp; drop or click to upload
    </label>
  )} 

<div className="ap-thumbGrid">
      {preview.slice(1).map((img,index)=>(
      <div  className="ap-thumb"key={index}> 
        <img src={img} className="subImg"/>
        <button type="button" className="closeIcon" onClick={()=>removeImage(index+1)}>✕</button> 
      </div>
    ))}

    {preview.length < 5 && preview.length > 0 && (
     <label className="ap-addImage">
        <input type="file" multiple accept="image/*" onChange={handleImage} hidden className="ap-input"/> 
        + 
      </label>
    )}
  </div>

</>
)}

{/* ✅ COLOR IMAGE ONLY FOR DRESS */}
{product.category === "Dress" && colors.length > 0 && (
<div className="imageSection">

  <h4>Color Images</h4>

  {colors.map((col, cIndex) => (
  <div key={cIndex} className="colorImageBlock">
    <p><b>{col.color || `Color ${cIndex + 1}`}</b></p>

    {/* MAIN IMAGE */}
 {col.preview.length > 0 ? (
  <div className="mainImageWrapper">
    
    <img src={col.preview[0]} className="mainImg" />

    <button
      type="button"
      className="mainClose"
      onClick={() => removeColorImage(cIndex, 0)}
    >
      ✕
    </button>

  </div>
) : (
  <label className="mainImageWrapper" style={{display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--ap-text-faint)",fontSize:"13px",fontWeight:600}}>
    <input
      type="file"
      multiple
      onChange={(e) => handleColorImages(e, cIndex)}
      hidden
      className="ap-input"
    />
    + Upload images
  </label>
)}

    {/* SUB IMAGES */}
    <div className="smallImages">
  {col.preview.slice(1).map((img, i) => (
    <div key={i} className="imgWrapper">
      <img src={img} className="subImg" />

      <button
        type="button"
        className="closeIcon"
        onClick={() => removeColorImage(cIndex, i + 1)}
      >
        ✕
      </button>
    </div>
  ))}

  {col.preview.length > 0 && (
  <label className="imgBox">
    <input
      type="file"
      multiple
      onChange={(e) => handleColorImages(e, cIndex)}
      hidden
      className="ap-input"
    />
    +
  </label>
  )}
</div>
  </div>
))}

</div>
)}

  </div>
</div>


</form>

</div>
</AdminLayout>
</div>

);
}