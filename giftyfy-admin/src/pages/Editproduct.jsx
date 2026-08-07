import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/editproduct.css";
import Select from "react-select";

export default function Editproduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    category: "",
    brand: "",
    price: "",
    gst: "",
    discountType: "flat",
    discountValue: "",
    quantity: "",
    description: ""
  });

  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [locations, setLocations] = useState([{ city: "", pincode: [] }]);

  const [cities, setCities] = useState([]);
  const [pincodeOptions, setPincodeOptions] = useState({});
  const [variants, setVariants] = useState([]);


  const cityOptions = cities.map((city) => ({
    label: city,
    value: city
  }));

  // ✅ FETCH PINCODES
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
          value: String(pin)
        }))
      ];

      setPincodeOptions((prev) => ({
        ...prev,
        [index]: options
      }));
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ FETCH PRODUCT
  const fetchProduct = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/product/${id}`
      );

      const data = res.data;
      setProduct(data);
      // ✅ DRESS VARIANTS FIX
if (data.category === "Dress" && data.variants) {
  setVariants(data.variants);
}
      // IMAGES
      if (data.image) {
        setExistingImages(data.image);
        setPreview(
          data.image.map(
            (img) => `http://localhost:4000/uploads/${img}`
          )
        );
      }

      // LOCATIONS FIX
      if (data.locations) {
        let parsed = [];

        if (typeof data.locations === "string") {
          parsed = JSON.parse(data.locations);
        } else {
          parsed = data.locations;
        }

        const formatted = parsed.map((loc) => ({
          city: loc.city,
          pincode: loc.pincode.map((p) => String(p))
        }));

        setLocations(formatted);

        // 🔥 IMPORTANT FIX
        await Promise.all(
          formatted.map(async (loc, index) => {
            if (loc.city) {
              await fetchPincodes(loc.city, index);
            }
          })
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/product/cities"
      );
      setCities(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchCities();
  }, []);

  // INPUT CHANGE
  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // IMAGE
  const handleImage = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);

    const newPreview = files.map((file) =>
      URL.createObjectURL(file)
    );
    setPreview([...preview, ...newPreview]);
  };

  const handleDeleteImage = (index) => {
    const updatedPreview = [...preview];
    const updatedExisting = [...existingImages];

    updatedPreview.splice(index, 1);
    updatedExisting.splice(index, 1);

    setPreview(updatedPreview);
    setExistingImages(updatedExisting);
  };

  // LOCATION
  const addLocation = () => {
    setLocations([...locations, { city: "", pincode: [] }]);
  };

  const removeLocation = (index) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  // UPDATE
  const updateProduct = async () => {
    const formData = new FormData();

    Object.keys(product).forEach((key) => {
      if (key !== "image") {
        formData.append(key, product[key]);
      }
    });

    formData.append(
      "existingImages",
      JSON.stringify(existingImages)
    );

    images.forEach((img) => {
      formData.append("images", img);
    });

    formData.append("locations", JSON.stringify(locations));

    try {
      await axios.put(
        `http://localhost:4000/api/product/${id}`,
        formData
      );

      alert("✅ Updated");
      navigate("/admin/product");
    } catch (err) {
      console.log(err);
      alert("❌ Failed");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar />

      <div className="productPage">
        <h2>Edit Product</h2>

        {/* BASIC */}
        <div className="form-grid">
          <input name="name" value={product.name} onChange={handleChange} placeholder="Name" />
          <input name="brand" value={product.brand} onChange={handleChange} placeholder="Brand" />
          <input name="gst" value={product.gst} onChange={handleChange} placeholder="GST" />

{product.category !== "Dress" && (
  <>
    <input name="price" value={product.price} onChange={handleChange} placeholder="Price" />
    <input name="quantity" value={product.quantity} onChange={handleChange} placeholder="Qty" />
  </>
)}


        </div>

        <textarea
          name="description"
          value={product.description}
          onChange={handleChange}
          placeholder="Description"
        />

        <h3>Locations</h3>

        {locations.map((loc, index) => (
          <div key={index} className="row">

            {/* CITY */}
            <Select
              options={cityOptions}
              placeholder="Select City"
              value={loc.city ? { label: loc.city, value: loc.city } : null}
              onChange={(selected) => {
                const updated = [...locations];
                updated[index].city = selected.value;
                updated[index].pincode = [];
                setLocations(updated);
                fetchPincodes(selected.value, index);
              }}
            />

            {/* PINCODE */}
            <Select
              options={pincodeOptions[index] || []}
              isMulti
              placeholder="Select Pincodes"
              value={
                loc.pincode.map((pin) => ({
                  label: pin,
                  value: pin
                })) || []
              }
              onChange={(selected) => {
                const updated = [...locations];

                // 🔥 SELECT ALL FIX
                if (selected?.some((s) => s.value === "ALL")) {
                  const allPins = (pincodeOptions[index] || [])
                    .filter((opt) => opt.value !== "ALL")
                    .map((opt) => opt.value);

                  updated[index].pincode = allPins;
                } else {
                  updated[index].pincode = selected
                    ? selected.map((s) => s.value)
                    : [];
                }

                setLocations(updated);
              }}
            />

            {index !== 0 && (
              <button onClick={() => removeLocation(index)}>❌</button>
            )}
          </div>
        ))}

        <button onClick={addLocation}>+ Add City</button>

        {/* IMAGE */}



        {product.category === "Dress" && (
  <div>
    <h3>Variants</h3>

    {variants.map((variant, vIndex) => (
      <div key={vIndex} className="variantBox">

        <h4>Color: {variant.color}</h4>

        {/* Images */}
        <div style={{ display: "flex", gap: "10px" }}>
          {variant.images.map((img, i) => (
            <img
              key={i}
              src={`http://localhost:4000/uploads/${img}`}
              width="80"
            />
          ))}
        </div>

        {/* Sizes */}
        {variant.sizes.map((sizeObj, sIndex) => (
          <div key={sIndex} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

            <input value={sizeObj.size} readOnly />

            <input
              type="number"
              value={sizeObj.price}
              placeholder="Price"
              onChange={(e) => {
                const updated = [...variants];
                updated[vIndex].sizes[sIndex].price = e.target.value;
                setVariants(updated);
              }}
            />

            <input
              type="number"
              value={sizeObj.quantity}
              placeholder="Qty"
              onChange={(e) => {
                const updated = [...variants];
                updated[vIndex].sizes[sIndex].quantity = e.target.value;
                setVariants(updated);
              }}
            />

          </div>
        ))}
      </div>
    ))}
  </div>
)}


{/* without color optio */}
        <div className="image-section">
          <h4>Images</h4>

          <div className="preview-box">
            {preview.map((img, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={img} alt="" />
                <button
                  onClick={() => handleDeleteImage(i)}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "red",
                    color: "#fff"
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <input type="file" multiple onChange={handleImage} />
        </div>

        <button className="update-btn" onClick={updateProduct}>
          Update Product
        </button>
      </div>
    </div>
  );
}