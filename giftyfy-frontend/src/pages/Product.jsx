import React, { useState, useEffect, useRef} from "react";
import axios from "axios";
import { useParams, useNavigate,useLocation } from "react-router-dom";
import "../styles/product.css";
import {
  FaTruck,
  FaMoneyBillWave,
  FaUndo,
  FaCheckCircle,
  FaShieldAlt,
  FaExpand,
  FaThumbsUp,
} from "react-icons/fa";

import { toast } from "react-toastify";
import Footer from "../components/Footer";
import ReCAPTCHA from "react-google-recaptcha";
import CustomEditor from "../components/CustomEditor";
import DOMPurify from "dompurify";
const REVIEWS_PER_PAGE = 4;

export default function Product() {
  const { id } = useParams();
  console.log("ID =", id);
  console.log("TYPE =", typeof id);
  const navigate = useNavigate();
  const location = useLocation();

const [customizedPreview, setCustomizedPreview] = useState("");
const [showCustomizedPreview, setShowCustomizedPreview] = useState(false);
const [savedCustomization, setSavedCustomization] = useState(null);
const [isCustomizationSaved, setIsCustomizationSaved] = useState(false);

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [qty, setQty] = useState(1);
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [isDeliverable, setIsDeliverable] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
const [selectedFrameSize, setSelectedFrameSize] = useState(null);
  const [liked, setLiked] = useState(false);
  const [openInfo, setOpenInfo] = useState(null);

  const imageRef = useRef();
  const lensRef = useRef();
  const zoomRef = useRef();
  const [zoomOpen, setZoomOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [customName, setCustomName] = useState("");

  const [recommend, setRecommend] = useState({});
  const [recentProducts, setRecentProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [similarCategory, setSimilarCategory] = useState([]);
  const [extraImages, setExtraImages] = useState([]);

  const [reviews, setReviews] = useState([]);
  const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  console.log("SITE KEY =>", SITE_KEY);

  const [captchaToken, setCaptchaToken] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [bestOffer, setBestOffer] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  /* =========================================================
     PRESENTATION-ONLY STATE (new)
     None of these touch cart / checkout / product / api logic.
     They only drive new visual UI requested in the redesign
     brief: description tabs, review sort/pagination/helpful,
     fullscreen viewer, mobile swipe dots.
     ========================================================= */
  const [activeDescTab, setActiveDescTab] = useState("description");
  const [reviewSort, setReviewSort] = useState("recent");
  const [reviewPage, setReviewPage] = useState(1);
  const [helpfulReviews, setHelpfulReviews] = useState({});
  const touchStartXRef = useRef(null);

  const isOutOfStock =
    product?.category === "Dress"
      ? (selectedSize?.quantity ?? 0) <= 0
      : (product?.quantity ?? 0) <= 0;

  const generateCaptcha = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

    let result = "";

    for (let i = 0; i < 6; i++) {
      result += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    return result;
  };
  const cleanHTML = DOMPurify.sanitize(product?.description || "");

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  useEffect(() => {
    axios.get(`http://localhost:4000/api/product/recommended/${id}`)
      .then(res => {
        console.log("RECOMMENDED API 👉", res.data);
        setRelatedProducts(
          res.data.sameType?.length
            ? res.data.sameType
            : res.data.exploreMore || []
        );

        setSimilarCategory(res.data.similarCategory || []);
      });
  }, [id]);

  useEffect(() => {
    let ids =
      JSON.parse(localStorage.getItem("recent")) || [];

    ids = ids.filter(
      (id) =>
        typeof id === "string" &&
        /^[0-9a-fA-F]{24}$/.test(id)
    );

    if (ids.length === 0) return;

    axios
      .post(
        "http://localhost:4000/api/product/recent",
        { ids }
      )
      .then((res) => {
        setRecentProducts(res.data.slice(0, 3));
      })
      .catch(console.error);

  }, [id]);
  useEffect(() => {
  setProduct(null);
  setMainImage("");
  setCustomizedPreview(null);
  setShowCustomizedPreview(false);
  setSavedCustomization(null);
  setIsCustomizationSaved(false);

  setSelectedFrameSize(null);
  setSelectedVariant(null);
  setSelectedSize(null);
}, [id]);

  // FETCH PRODUCT
  useEffect(() => {
    axios.get(`http://localhost:4000/api/product/${id}`).then((res) => {
      const data = res.data;

      setProduct(data);
      // Photo Frame default size
      if (data?.frameSizes?.length > 0) {
        setSelectedFrameSize(data.frameSizes[0]);
      }

      // ✅ VARIANT + SIZE AUTO SELECT (FIXED)
      if (data?.variants?.length > 0) {
        const firstVariant = data.variants[0];
        setSelectedVariant(firstVariant);

        // ✅ auto select size
        if (firstVariant?.sizes?.length > 0) {
          setSelectedSize(firstVariant.sizes[0]);
        }

        // ✅ set first image
        const firstImg = firstVariant?.images?.[0];
        if (firstImg) {
          setMainImage(firstImg);
          return; // ✅ ok here
        }
      }

      // ✅ FALLBACK (no variant case)
      const img =
        data?.image?.[0] ||
        data?.image ||
        data?.photos?.[0] ||
        data?.locations?.[0]?.image ||
        "";

      setMainImage(img);
    });
  }, [id]);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId || !id) return;

    axios
      .get(`http://localhost:4000/api/wishlist/${userId}`)
      .then((res) => {
        const exists = res.data.find(
          (item) => item.productId === id
        );

        if (exists) {
          setLiked(true); // ❤️ already in wishlist
        }
      })
      .catch((err) => console.log(err));
  }, [id]);
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

  useEffect(() => {

    let recent =
      JSON.parse(localStorage.getItem("recent")) || [];

    // ✅ only valid string ids keep
    recent = recent.filter(
      (item) =>
        typeof item === "string" &&
        item.length === 24
    );

    // ✅ remove duplicate
    recent = recent.filter(
      (item) => item !== id
    );

    // ✅ latest add
    recent.unshift(id);

    // ✅ max 5 items
    if (recent.length > 5) {
      recent.pop();
    }

    localStorage.setItem(
      "recent",
      JSON.stringify(recent)
    );

  }, [id]);

  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/reviews/product/${id}`)
      .then((res) => {
        setReviews(res.data || []);
      })
      .catch((err) => console.log(err));
  }, [id]);



  useEffect(() => {
    if (!product?.category) return;

    axios
      .get(`http://localhost:4000/api/coupons/category/${product.category}`)
      .then((res) => {
        setBestOffer(res.data);
      })
      .catch(() => setBestOffer(null));

  }, [product?.category]);

  // reset review pagination whenever sort or the underlying list changes
  useEffect(() => {
    setReviewPage(1);
  }, [reviewSort, reviews.length]);

useEffect(() => {
  const state = location.state;

  if (!state) return;

  if (state.customizedPreview) {
    setCustomizedPreview(state.customizedPreview);
    setShowCustomizedPreview(true);
    setIsCustomizationSaved(true);
  }

  if (state.savedCustomization) {
    setSavedCustomization(state.savedCustomization);
    setIsCustomizationSaved(true);
  }
}, [location.state]);


  if (!product) return <h2 className="gp-loading">Loading...</h2>;
  const goPersonalize = (isEdit = false) => {
  navigate(`/personalize/${product._id}`, {
    state: {
      frameSize: selectedFrameSize,
      quantity: qty,
      variant: selectedVariant,
      size: selectedSize,
      editMode: isEdit,
      savedCustomization: isEdit ? savedCustomization : null,
    },
  });
};


  
  const price =
    selectedFrameSize?.price ||
    selectedSize?.price ||
    selectedVariant?.sizes?.[0]?.price ||
    product?.price ||
    0;


  let basePrice =
    selectedFrameSize?.price ||
    selectedSize?.price ||
    selectedVariant?.sizes?.[0]?.price ||
    product?.price ||
    0;

  // GST ADD
  let priceWithGST = basePrice + (basePrice * (product?.gst || 0)) / 100;

  // DISCOUNT APPLY
  let finalPrice = priceWithGST;

  switch (product?.discountType?.toLowerCase()) {
    case "percentage":
      finalPrice =
        priceWithGST -
        (priceWithGST * (product.discountValue || 0)) / 100;
      break;

    case "flat":
    case "amount":
    case "fixed":
      finalPrice =
        priceWithGST - (product.discountValue || 0);
      break;

    default:
      finalPrice = priceWithGST;
  }

  finalPrice = Math.max(0, Math.round(finalPrice));

  if (finalPrice < 0) finalPrice = 0;
const checkPincode = async () => {

  if (!pincode || pincode.length !== 6) {
    setDeliveryMsg("❌ Invalid Pincode");
    setIsDeliverable(false);
    return;
  }


  try {

    // India pincode verify
    const pinRes = await axios.get(
      `http://localhost:4000/api/pincode/${pincode}`
    );


    if(!pinRes.data.available){

      setDeliveryMsg(
        "❌ Delivery available only in India"
      );

      setIsDeliverable(false);
      return;
    }



    // All India product
    if(product.deliveryType==="all"){

      const today=new Date();
      const deliveryDate=new Date();

      deliveryDate.setDate(today.getDate()+3);


      setDeliveryMsg(
        `✅ Delivery by ${deliveryDate.toDateString()}`
      );

      setIsDeliverable(true);
      return;
    }



    // Selected pincode product

    const allPincodes =
      product?.locations?.flatMap(
        loc=>loc.pincode
      ) || [];


    const isValid =
      allPincodes.includes(Number(pincode));


    if(isValid){

      const today=new Date();
      const deliveryDate=new Date();

      deliveryDate.setDate(today.getDate()+3);


      setDeliveryMsg(
        `✅ Delivery by ${deliveryDate.toDateString()}`
      );

      setIsDeliverable(true);

    }
    else{

      setDeliveryMsg(
        "❌ Not deliverable to this pincode"
      );

      setIsDeliverable(false);
    }


  }
  catch(err){

    console.log(err);

    setDeliveryMsg(
      "❌ Pincode verification failed"
    );

    setIsDeliverable(false);
  }

};

  let allImages = [];

  if (selectedVariant?.images?.length > 0) {
    allImages = selectedVariant.images;
  }
  else if (product?.image?.length > 0) {   // 🔥 FIX HERE
    allImages = product.image;
  }
  else if (product?.photos?.length > 0) {
    allImages = product.photos;
  }
  else if (product?.locations?.[0]?.images?.length > 0) {
    allImages = product.locations[0].images;
  }
  else if (product?.locations?.[0]?.image) {
    allImages = [product.locations[0].image];
  }


  // CART
  // CART
  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error("Out of Stock ❌");
      return;
    }
// Open personalization only if customization has not been saved yet
if (product?.customization?.enabled && !isCustomizationSaved) {
  goPersonalize(false);
  return;
}
    if (product?.isCustomized) {
      if (
        product.customizationFields?.includes("image") &&
        extraImages.length === 0
      ) {
        toast.error("Please upload an image");
        return;
      }

      if (
        product.customizationFields?.includes("name") &&
        customName.trim() === ""
      ) {
        toast.error("Please enter your name");
        return;
      }

      if (
        product.customizationFields?.includes("message") &&
        message.trim() === ""
      ) {
        toast.error("Please enter your message");
        return;
      }

      if (!captchaVerified) {
        toast.error("Please verify captcha");
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("productId", product._id);
      formData.append("quantity", qty);
      formData.append("name", product.name);
      formData.append("image", mainImage);
      formData.append("price", finalPrice);
      formData.append("originalPrice", price);
      formData.append(
        "discountType",
        product.discountType || "flat"
      );
      formData.append(
        "discountValue",
        product.discountValue || 0
      );
      formData.append("gst", product.gst || 0);

      if (selectedSize?.size) {
        formData.append("size", selectedSize.size);
      }
      if (selectedFrameSize?.size) {
        formData.append("frameSize", selectedFrameSize.size);
    }

      if (selectedVariant?.color) {
        formData.append("variant", selectedVariant.color);
      }

      // ✅ Customization
      if (product?.isCustomized) {
        formData.append("isCustomized", true);
        formData.append("message", message || "");
        formData.append("customName", customName || "");

        // Upload all selected images
        extraImages.forEach((file) => {
          formData.append("extraImages", file);
        });
      }

      await axios.post(
        "http://localhost:4000/api/cart/add",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Added to cart ✅");
      navigate("/cart");

    } catch (err) {
      console.log(err);
      toast.error("Login required ❌");
    }
  };

  const handleBuyNow = async () => {
    console.log("EXTRA IMAGES STATE 👉", extraImages);

    if (isOutOfStock) {
      toast.error("Out of Stock ❌");
      return;
    }
   if (product?.customization?.enabled && !isCustomizationSaved) {
  goPersonalize(false);
  return;
}   
    // ✅ Validation
    if (product?.isCustomized) {
      if (
        product.customizationFields?.includes("image") &&
        extraImages.length === 0
      ) {
        toast.error("Please upload an image");
        return;
      }

      if (
        product.customizationFields?.includes("name") &&
        customName.trim() === ""
      ) {
        toast.error("Please enter your name");
        return;
      }

      if (
        product.customizationFields?.includes("message") &&
        message.trim() === ""
      ) {
        toast.error("Please enter your message");
        return;
      }

      if (!captchaVerified) {
        toast.error("Please verify captcha");
        return;
      }
    }

    // ✅ Upload customization images
    let uploadedImages = [];

    if (extraImages.length > 0) {
      const formData = new FormData();

      extraImages.forEach((file) => {
        formData.append("extraImages", file);
      });

      const uploadRes = await axios.post(
        "http://localhost:4000/api/upload/custom-images",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      uploadedImages = uploadRes.data.images;
    }

    const buyNowItem = {
      _id: product._id,
      productId: product._id,
      product,

      name: product.name,
      image: mainImage,

      quantity: qty,

      price: finalPrice,
      originalPrice: price,

      size: selectedSize?.size || "",
      frameSize: selectedFrameSize?.size || "",
      variant: selectedVariant?.color || "",

      locations: product.locations || [],

      isCustomized: product?.isCustomized || false,

      message: message.trim(),

      customName: customName.trim(),

      // ✅ Uploaded filenames
      extraImages: uploadedImages,
    };

    console.log("BUY NOW ITEM 👉", buyNowItem);

    navigate("/checkout", {
      state: {
        buyNow: true,
        item: buyNowItem,
      },
    });
  };

  // WISHLIST
  const handleWishlist = async () => {
    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        toast.error("Please Login First");
        return;
      }

      const existing = wishlist.find(
        (item) => String(item.productId) === String(product._id)
      );

      // REMOVE
      if (existing) {
        await axios.delete(
          `http://localhost:4000/api/wishlist/remove/${existing._id}`
        );

        setWishlist((prev) =>
          prev.filter((item) => item._id !== existing._id)
        );

        setLiked(false);
        toast.info("Removed from Wishlist 💔");
        return;
      }

      // ADD
      const res = await axios.post(
        "http://localhost:4000/api/wishlist",
        {
          userId,
          productId: product._id,
          name: product.name,
          image: selectedVariant?.images?.[0] || "",
          price: selectedSize?.price || product.price,
          originalPrice: selectedSize?.price || product.price,
          size: selectedSize?.size,
          variant: selectedVariant?.color,
          sizeQuantity: selectedSize?.quantity || 0,
          category: product.category,
        }
      );

      if (res.data?.newItem) {
        setWishlist((prev) => [...prev, res.data.newItem]);
      }

      setLiked(true);
      toast.success("Added to Wishlist ❤️");
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    }
  };

  const getColor = (color) => {
    if (!color) return "#ccc";

    // hex இருந்தா direct return
    if (color.startsWith("#")) return color;

    // space remove + lowercase
    const clean = color.toLowerCase().replace(/\s+/g, "");

    const colorMap = {
      red: "#ff0000",
      blue: "#0000ff",
      green: "#008000",
      black: "#000000",
      white: "#ffffff",
      yellow: "#ffff00",
      pink: "#ffc0cb",
      orange: "#ffa500",
      purple: "#800080",
      grey: "#808080",
      gray: "#808080",
      brown: "#a52a2a",
      navy: "#000080",
      navyblue: "#000080",
      skyblue: "#87ceeb",
      lightblue: "#add8e6",
      darkgreen: "#006400",
      lightgreen: "#90ee90",
      sandal: "#f4e1c1",
    };

    return colorMap[clean] || "#ccc";
  };

  // SERVICE TOGGLE
  const toggleInfo = (type) => {
    setOpenInfo(openInfo === type ? null : type);
  };

  // ZOOM
  const handleMouseMove = (e) => {
    const img = imageRef.current;
    const lens = lensRef.current;
    const zoom = zoomRef.current;

    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensSize = 140;

    let lensX = x - lensSize / 2;
    let lensY = y - lensSize / 2;

    lensX = Math.max(0, Math.min(lensX, rect.width - lensSize));
    lensY = Math.max(0, Math.min(lensY, rect.height - lensSize));

    lens.style.left = lensX + "px";
    lens.style.top = lensY + "px";
    lens.style.display = "block";

    zoom.style.display = "block";
    zoom.style.backgroundImage = `url(${img.querySelector("img").src})`;

    const zoomLevel = 3;

    zoom.style.backgroundSize = `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`;

    zoom.style.backgroundPosition = `-${lensX * zoomLevel}px -${lensY * zoomLevel}px`;
  };

  const handleMouseLeave = () => {
    lensRef.current.style.display = "none";
    zoomRef.current.style.display = "none";
  };

  const getImage = (p) => {
    if (p?.variants?.[0]?.images?.length > 0) {
      return p.variants[0].images[0];
    }
    if (p?.images?.length > 0) {
      return p.images[0];
    }
    if (p?.image?.length > 0) {   // 🔥 ADD THIS
      return p.image[0];
    }
    if (p?.photos?.length > 0) {
      return p.photos[0];
    }
    if (p?.locations?.[0]?.image) {
      return p.locations[0].image;
    }
    return null;
  };




  const isExtraAllowed =
    product?.isCustomized === true;


  const handleExtraImages = (e) => {
    const files = Array.from(e.target.files);
    setExtraImages(files);
  };
  const getStock = () => {
    if (product?.category === "Dress") {
      return selectedSize?.quantity ?? 0;
    }
    if (product?.category === "Photo Frame") {
      return selectedFrameSize?.quantity ?? 0;
    }
    return product?.quantity ?? 0;
  };


  const averageRating =
    reviews.length > 0
      ? (
        reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
      : 0;

  const verifyCaptcha = (value) => {
    setCaptchaInput(value);

    if (value.trim() === captcha) {
      setCaptchaVerified(true);
    } else {
      setCaptchaVerified(false);
    }
  };

  const stock = getStock();

  const getPercentage = (star) => {
    const count = reviews.filter(
      (r) => Math.round(r.rating) === star
    ).length;

    return reviews.length
      ? Math.round((count / reviews.length) * 100)
      : 0;
  };
  const scrollToReviews = () => {
    const el = document.getElementById("reviews");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getFinalPrice = (p, size = null, variant = null) => {
    const base =
      size?.price ||
      variant?.sizes?.[0]?.price ||
      p?.price ||
      0;

    const gst = (base * Number(p?.gst || 0)) / 100;
    const priceWithGST = base + gst;

    const type = (p?.discountType || "")
      .toLowerCase()
      .trim();

    const value = Number(p?.discountValue || 0);

    let final = priceWithGST;

    if (type === "percentage") {
      final = priceWithGST - (priceWithGST * value) / 100;
    }
    else if (
      type === "flat" ||
      type === "amount" ||
      type === "fixed"
    ) {
      final = priceWithGST - value;
    }

    return Math.max(0, Math.round(final));
  };

  /* =========================================================
     PRESENTATION-ONLY DERIVED VALUES + HANDLERS (new)
     Pure display math on values already computed above, or
     pure front-end sort/paginate of the already-fetched
     `reviews` array. Nothing here calls an API or mutates
     cart/order/product state.
     ========================================================= */

  const savingsAmount = Math.max(0, Math.round(price - finalPrice));
  const emiEstimate = Math.round(finalPrice / 3);

  const personalizationTotalSteps =
    (product?.customizationFields?.length || 0) + 1; // +1 for captcha
  let personalizationDoneSteps = 0;
  if (product?.customizationFields?.includes("image") && extraImages.length > 0) personalizationDoneSteps++;
  if (product?.customizationFields?.includes("name") && customName.trim() !== "") personalizationDoneSteps++;
  if (product?.customizationFields?.includes("message") && message.trim() !== "") personalizationDoneSteps++;
  if (captchaVerified) personalizationDoneSteps++;
  const personalizationPercent = personalizationTotalSteps > 0
    ? Math.round((personalizationDoneSteps / personalizationTotalSteps) * 100)
    : 0;

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === "highest") return Number(b.rating || 0) - Number(a.rating || 0);
    if (reviewSort === "lowest") return Number(a.rating || 0) - Number(b.rating || 0);
    return 0; // "recent" keeps the API's own order
  });

  const totalReviewPages = Math.max(1, Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = sortedReviews.slice(
    (reviewPage - 1) * REVIEWS_PER_PAGE,
    reviewPage * REVIEWS_PER_PAGE
  );

  const toggleHelpful = (reviewId) => {
    setHelpfulReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const handleImageTouchStart = (e) => {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
  };

  const handleImageTouchEnd = (e) => {
    if (touchStartXRef.current === null || allImages.length < 2) return;

    const endX = e.changedTouches?.[0]?.clientX ?? touchStartXRef.current;
    const delta = endX - touchStartXRef.current;
    const currentIndex = allImages.indexOf(mainImage);

    if (Math.abs(delta) > 45 && currentIndex !== -1) {
      let nextIndex = currentIndex;
      if (delta < 0) nextIndex = (currentIndex + 1) % allImages.length;
      else nextIndex = (currentIndex - 1 + allImages.length) % allImages.length;
      setMainImage(allImages[nextIndex]);
    }

    touchStartXRef.current = null;
  };


  const openProduct = (p) => {
  if (!p?._id) {
    console.error("Product ID missing:", p);
    return;
  }

  navigate(`/product/${p._id}`);
};



  return (
    <div>
      <div className="product-details">

        <div className="gp-product-page">

          {/* BREADCRUMB */}
          <nav className="gp-breadcrumb">
            <span className="gp-bc-link">Home</span>
            <span className="gp-bc-sep">/</span>
            <span className="gp-bc-link">{product.category}</span>
            <span className="gp-bc-sep">/</span>
            <span className="gp-bc-current">{product.name}</span>
          </nav>

          <div className="gp-top-layout">

            {/* THUMBNAILS */}
           
<div className="gp-thumb-list">

  {/* Customized preview thumbnail */}
  {customizedPreview && (
    <button
      type="button"
      className={`gp-thumb-btn ${
        showCustomizedPreview ? "gp-thumb-active" : ""
      }`}
      onClick={() => setShowCustomizedPreview(true)}
      aria-label="View customized product"
    >
      <img
        src={customizedPreview}
        className="gpr-thumb-img"
        alt="Customized product preview"
      />
    </button>
  )}

  {/* Original product thumbnails */}
  {allImages.length > 0 ? (
    allImages.map((img, i) => (
      <button
        key={i}
        type="button"
        className={`gp-thumb-btn ${
          !showCustomizedPreview && mainImage === img
            ? "gp-thumb-active"
            : ""
        }`}
        onClick={() => {
          setShowCustomizedPreview(false);
          setMainImage(img);
        }}
      >
        <img
          src={`http://localhost:4000/uploads/${img}`}
          className="gpr-thumb-img"
          alt={`${product.name} view ${i + 1}`}
        />
      </button>
    ))
  ) : (
    <p className="gp-no-images">No Images</p>
  )}

</div>


            {/* IMAGE SECTION */}
           
<div className="gp-image-section">
  <div
    className="gp-image-box"
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    onTouchStart={handleImageTouchStart}
    onTouchEnd={handleImageTouchEnd}
    ref={imageRef}
  >
    {product.discountValue > 0 && (
      <span className="gp-image-offer">
        {product.discountType?.toLowerCase().trim() === "percentage"
          ? `${product.discountValue}% OFF`
          : `₹${product.discountValue} OFF`}
      </span>
    )}

    {/* Main product image / customized preview */}
    <img
      src={
        showCustomizedPreview && customizedPreview
          ? customizedPreview
          : mainImage
            ? `http://localhost:4000/uploads/${mainImage}`
            : "https://dummyimage.com/400x400/eee/aaa"
      }
      className="gp-main-image"
      alt={
        showCustomizedPreview
          ? "Customized product preview"
          : product.name
      }
      onClick={() => {
        if (window.innerWidth < 768) {
          setZoomOpen(true);
        }
      }}
    />

    {/* Desktop fullscreen viewer trigger */}
    <button
      type="button"
      className="gp-expand-btn"
      onClick={() => setZoomOpen(true)}
      aria-label="View fullscreen"
    >
      <FaExpand />
    </button>

    {/* Fullscreen / zoom modal */}
    {zoomOpen && (
      <div
        className="zoom-modal"
        onClick={() => setZoomOpen(false)}
      >
        <img
          src={
            showCustomizedPreview && customizedPreview
              ? customizedPreview
              : mainImage
                ? `http://localhost:4000/uploads/${mainImage}`
                : "https://dummyimage.com/400x400/eee/aaa"
          }
          alt={
            showCustomizedPreview
              ? "Customized product preview"
              : product.name
          }
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}

    <div className="gp-lens" ref={lensRef}></div>
  </div>

  {/* Swipe position dots */}
  {allImages.length > 1 && (
    <div className="gp-swipe-dots">
      {allImages.map((img, i) => (
        <span
          key={i}
          className={`gp-swipe-dot ${
            !showCustomizedPreview && mainImage === img
              ? "active"
              : ""
          }`}
        ></span>
      ))}
    </div>
  )}

  <div className="gp-zoom-preview" ref={zoomRef}></div>
</div>

            {/* RIGHT PANEL */}
            <div className="gp-right-panel">

              <span className="gp-cat-tag">{product.category}</span>

              <h2 className="gp-product-title">
                {product.name}
              </h2>


              <div className="gp-rating-box" onClick={scrollToReviews} style={{ cursor: "pointer" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= Math.round(averageRating)
                        ? "gp-star-filled"
                        : "gp-star-empty"
                    }
                  >
                    ★
                  </span>
                ))}

                <span className="gp-rating-text">
                  {averageRating} ({reviews.length} Reviews)
                </span>
              </div>

              {/* PRICE */}
              <div className="gp-price-card">

                <div className="gp-price-top">
                  <span className="gp-final-price">₹{finalPrice}</span>

                  <span className="gp-old-price">
                    ₹{selectedFrameSize?.price ||selectedSize?.price || selectedVariant?.sizes?.[0]?.price || product?.price}
                  </span>
                  <span className="gp-discount-badge">
                    {product.discountType?.toLowerCase().trim() === "percentage"
                      ? `${product.discountValue}% OFF`
                      : `₹${product.discountValue} OFF`}
                  </span>
                </div>

                <p className="gp-tax-text">
                  Inclusive of all taxes
                </p>

                {savingsAmount > 0 && (
                  <p className="gp-savings-row">
                    <FaCheckCircle /> You save ₹{savingsAmount} on this order
                  </p>
                )}

                {/* {finalPrice > 0 && (
                  <p className="gp-emi-row">
                    EMI available from <b>₹{emiEstimate}/mo</b> — no cost EMI on select cards
                  </p>
                )} */}

              </div>
              {bestOffer && (
                <div className="offer-card">

                  <div className="offer-title">
                    <span className="offer-icon">🏷️</span>
                    <span>Best Offers</span>
                  </div>

                  <div className="offer-item">
                    <div className="offer-badge">OFFER</div>

                    <div className="offer-info">
                      <h5>
                        {bestOffer.discountType === "percentage"
                          ? `${bestOffer.discountValue}% Instant Discount`
                          : `Flat ₹${bestOffer.discountValue} OFF`}
                      </h5>

                      <p>
                        On orders above <strong>₹{bestOffer.minOrderAmount}</strong>
                      </p>
                    </div>
                  </div>

                </div>
              )}


              {/* STOCK */}
              {product?.category === "Dress" ? (
                selectedSize?.quantity < 5 &&
                selectedSize?.quantity > 0 && (
                  <p className="gp-low-stock">
                    ⚡ Only few left!
                  </p>
                )
              ) : (
                product.quantity < 5 &&
                product.quantity > 0 && (
                  <p className="gp-low-stock">
                    ⚡ Only few left!
                  </p>
                )
              )}

              {/* COLORS */}
              {product?.category === "Dress" && (
                <div className="gp-color-section">

                  <h4 className="gp-section-title">
                    Select Color
                  </h4>

                  <div className="gp-color-list">
                    {product.variants?.map((v, i) => (
                      <div
                        key={i}
                        className={`gp-color-item ${selectedVariant === v ? "active" : ""
                          }`}
                        onClick={() => {
                          setSelectedVariant(v);
                          setMainImage(v?.images?.[0] || "");
                        }}
                      >
                        <div
                          className="gp-color-circle"
                          style={{
                            background: getColor(v.color),
                          }}
                        ></div>

                        <span className="gp-color-name">
                          {v.color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SIZE - ONLY FOR DRESS */}
              {product?.category === "Dress" && (
                <div className="gp-size-section">
                  <h4 className="gp-section-title">
                    Select Size
                  </h4>

                  <div className="gp-size-list">
                    {selectedVariant?.sizes?.map((s, i) => (
                      <button
                        key={i}
                        className={`gp-size-btn ${selectedSize === s ? "active" : ""
                          }`}
                        onClick={() => setSelectedSize(s)}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {product?.frameSizes?.length > 0 && (
                <div className="gp-size-section">

                  <h4 className="gp-section-title">
                    Select Frame Size
                  </h4>

                  <div className="gp-size-list">

                    {product.frameSizes.map((frame, index) => (

                      <button
                        key={index}
                        className={`gp-size-btn ${
                          selectedFrameSize?.size === frame.size
                            ? "active"
                            : ""
                        }`}
                        onClick={() => setSelectedFrameSize(frame)}
                      >
                        {frame.size}
                      </button>

                    ))}

                  </div>

                </div>
              )}
              {product?.isCustomized && (
                <div className="gp-personalize-card">

                  <div className="gp-personalize-header">
                    <h3>✨ Personalize Your Product</h3>
                    <p>Complete the details below before adding to cart.</p>
                  </div>

                  {/* Progress indicator (new, additive) */}
                  <div className="gp-personalize-progress">
                    <div className="gp-progress-track">
                      <div
                        className="gp-progress-fill"
                        style={{ width: `${personalizationPercent}%` }}
                      ></div>
                    </div>
                    <span className="gp-progress-label">{personalizationPercent}%</span>
                  </div>

                  {/* Upload Image */}
                  {product.customizationFields?.includes("image") && (
                    <div className="gp-custom-field">
                      <label>📷 Upload Image</label>

                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleExtraImages}
                      />
                    </div>
                  )}

                  {/* Name */}
                  {product.customizationFields?.includes("name") && (
                    <div className="gp-custom-field">
                      <label>👤 Name</label>

                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Message */}
                  {product.customizationFields?.includes("message") && (
                    <div className="gp-custom-field">
                      <label>💬 Message</label>

                      <textarea
                        rows={4}
                        placeholder="Write your personal message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="custom-captcha-box">

                    <div className="captcha-display">
                      {captcha}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCaptcha(generateCaptcha());
                        setCaptchaInput("");
                        setCaptchaVerified(false);
                      }}
                      className="captcha-refresh-btn"
                    >
                      ↻
                    </button>

                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) =>
                        verifyCaptcha(e.target.value)
                      }
                    />

                    {captchaInput && (
                      <p
                        className={
                          captchaVerified
                            ? "captcha-ok"
                            : "captcha-bad"
                        }
                      >
                        {captchaVerified
                          ? "✅ Captcha Verified"
                          : "❌ Invalid Captcha"}
                      </p>
                    )}

                  </div>

                </div>
              )}




              {/* PINCODE */}
              <div className="gp-pincode-box">

                <h4 className="gp-section-title">
                  Delivery Availability
                </h4>

                <div className="gp-pincode-inputs">

                  <input
                    type="number"
                    placeholder="Enter Pincode"
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value)
                    }
                  />

                  <button onClick={checkPincode}>
                    Check
                  </button>

                </div>

                <p className="gp-delivery-msg">
                  {deliveryMsg}
                </p>

                {/* Delivery perks strip (new, additive display copy only) */}
                <div className="gp-delivery-perks">
                  <span className="gp-delivery-perk"><FaMoneyBillWave /> Cash on Delivery</span>
                  <span className="gp-delivery-perk"><FaTruck /> Free Shipping</span>
                  <span className="gp-delivery-perk"><FaUndo /> 7 Day Returns</span>
                </div>

              </div>

              {/* QTY */}
              <div className="gp-qty-row">
                <span className="gp-qty-label">Quantity</span>

                <div className="gp-qty-box">

                  <button
                    className="gp-qty-btn"
                    onClick={() =>
                      setQty(qty > 1 ? qty - 1 : 1)
                    }
                  >
                    −
                  </button>

                  <span className="gp-qty-number">
                    {qty}
                  </span>

                  <button
                    className="gp-qty-btn"
                    onClick={() => {
                      if (isOutOfStock) return;

                      if (qty < stock) {
                        setQty(qty + 1);
                      }
                    }}
                    disabled={qty >= stock || isOutOfStock}
                  >
                    +
                  </button>
                </div>

                {stock > 0 && (
                  <p className="gp-stock-info">
                    Available: {stock}
                  </p>
                )}
              </div>

              <br />
              {/* ACTIONS */}
              <div className="gp-action-buttons">

                <button
                  className={`gp-wishlist-btn ${liked ? "liked" : ""}`}
                  onClick={handleWishlist}
                >
                  {liked ? "❤️" : "♡"}
                </button>
{product?.customization?.enabled && isCustomizationSaved ? (
  <div className="gp-customization-actions">
   <button
  type="button"
  className="gp-edit-personalization-btn"
  onClick={() => goPersonalize(true)}
>
  Edit Personalization
</button>

    <button
      type="button"
      className="gp-buy-btn"
      onClick={handleAddToCart}
      disabled={isOutOfStock}
    >
      Add to Cart
    </button>
  </div>
) : (
  <button
    type="button"
    className="gp-cart-btn"
    onClick={handleAddToCart}
    disabled={isOutOfStock}
  >
    {product?.customization?.enabled
      ? "Personalize Now"
      : product?.isCustomized
      ? "Customize Now"
      : "Add To Cart"}
  </button>
)}

              </div>
              <br />

              <button
                className="gp-buy-btn"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                Buy Now
              </button>

              {/* SERVICES / TRUST */}
              <div className="gp-service-row">

                <div
                  className="gp-service-card"
                  onClick={() => toggleInfo("delivery")}
                >
                  <FaTruck />
                  <span>Delivery</span>
                </div>

                <div
                  className="gp-service-card"
                  onClick={() => toggleInfo("cod")}
                >
                  <FaMoneyBillWave />
                  <span>COD</span>
                </div>

                <div
                  className="gp-service-card"
                  onClick={() => toggleInfo("return")}
                >
                  <FaUndo />
                  <span>Return</span>
                </div>

                <div
                  className="gp-service-card"
                  onClick={() => toggleInfo("original")}
                >
                  <FaCheckCircle />
                  <span>Original</span>
                </div>

              </div>

              <div className="gp-service-details">
                {openInfo === "delivery" && (
                  <p>Delivered in 2-3 days</p>
                )}

                {openInfo === "cod" && (
                  <p>Cash on Delivery available</p>
                )}

                {openInfo === "return" && (
                  <p>7 days return policy</p>
                )}

                {openInfo === "original" && (
                  <p>100% original product</p>
                )}
              </div>

            </div>

          </div>
          <div className="gp-description-box">

            {/* HEADER */}
            <div
              className="desc-header"
              onClick={() => setShowDescription(!showDescription)}
            >
              <div>
                <h3>Product Details</h3>
                <p>Everything you need to know about this product</p>
              </div>

              <button className="desc-toggle-btn">
                {showDescription ? "−" : "+"}
              </button>
            </div>

            {showDescription && (
              <>
                {/* TABS (new, additive — presentation only, same underlying data as before) */}
                <div className="gp-desc-tabs">
                  <button
                    type="button"
                    className={`gp-desc-tab ${activeDescTab === "description" ? "active" : ""}`}
                    onClick={() => setActiveDescTab("description")}
                  >
                    Description
                  </button>
                  <button
                    type="button"
                    className={`gp-desc-tab ${activeDescTab === "specifications" ? "active" : ""}`}
                    onClick={() => setActiveDescTab("specifications")}
                  >
                    Specifications
                  </button>
                  <button
                    type="button"
                    className={`gp-desc-tab ${activeDescTab === "shipping" ? "active" : ""}`}
                    onClick={() => setActiveDescTab("shipping")}
                  >
                    Shipping &amp; Returns
                  </button>
                </div>

                <div className="gp-desc-panel">

                  {activeDescTab === "description" && (
                    <>
                      {/* INTRO */}
                      <div className="desc-intro-box">
                        <p>
                          {product?.shortDescription ||
                            `${product?.name} is a premium quality product designed for style, comfort and durability.`}
                        </p>
                      </div>

                      {/* HIGHLIGHTS */}
                      <div className="desc-section">
                        <h4>✨ Key Highlights</h4>

                        <div
                          className="product-description-html"
                          dangerouslySetInnerHTML={{
                            __html: cleanHTML,
                          }}
                        />
                      </div>
                    </>
                  )}

                  {activeDescTab === "specifications" && (
                    /* FEATURES */
                    <div className="desc-section">
                      <h4>📌 Product Information</h4>

                      <div className="feature-grid">
                        <div className="feature-card">
                          <span>Category</span>
                          <b>{product.category}</b>
                        </div>

                        <div className="feature-card">
                          <span>Brand</span>
                          <b>{product.brand || "Premium Quality"}</b>
                        </div>

                        <div className="feature-card">
                          <span>Warranty</span>
                          <b>{product.warranty || "Not specified"}</b>
                        </div>

                        <div className="feature-card">
                          <span>Availability</span>
                          <b className={product.quantity > 0 ? "in-stock" : "out-stock"}>
                            {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                          </b>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDescTab === "shipping" && (
                    <div className="desc-section">
                      <h4>🚚 Shipping &amp; Returns</h4>

                      <div className="feature-grid">
                        <div className="feature-card">
                          <span>Delivery</span>
                          <b>2-3 Days</b>
                        </div>

                        <div className="feature-card">
                          <span>Cash on Delivery</span>
                          <b>Available</b>
                        </div>

                        <div className="feature-card">
                          <span>Returns</span>
                          <b>7 Day Policy</b>
                        </div>

                        <div className="feature-card">
                          <span>Warranty</span>
                          <b>{product.warranty || "Not specified"}</b>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

          </div>


          {/* CUSTOMER REVIEWS */}
          <div id="reviews" className="gp-review-panel-full">

            <div className="gp-review-summary">

              <div className="gp-review-summary-left">
                <div className="gp-review-score">
                  {averageRating} ★
                </div>

                <div>
                  <h3>Customer Reviews</h3>
                  <p>{reviews.length} Reviews</p>
                </div>
              </div>

              {reviews.length > 0 && (
                <select
                  className="gp-review-sort"
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              )}

            </div>

            {reviews.length > 0 && (
              <div className="gp-rating-breakdown">

                <div className="gp-rating-overview">
                  <h2>{averageRating} ★</h2>
                  <p>{reviews.length} Reviews</p>
                </div>

                <div className="gp-rating-bars">

                  {[5, 4, 3, 2, 1].map((star) => (
                    <div className="gp-rating-row" key={star}>
                      <span>{star}★</span>
                      <div className="gp-bar">
                        <div
                          className="gp-fill"
                          style={{ width: `${getPercentage(star)}%` }}
                        />
                      </div>
                      <span>{getPercentage(star)}%</span>
                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* REVIEW LIST */}
            <div className="gp-review-list">

              {reviews.length === 0 ? (
                <p className="gp-no-reviews">No reviews yet — be the first to share your experience!</p>
              ) : (
                paginatedReviews.map((r) => (
                  <div
                    key={r._id}
                    className="gp-review-card"
                  >
                    <div className="gp-review-header">
                      <div className="gp-review-user">
                        <span className="gp-review-avatar">
                          {(r.user?.name || "U").charAt(0).toUpperCase()}
                        </span>
                        <strong>{r.user?.name}</strong>
                        <span className="gp-verified-badge">Verified</span>
                      </div>

                      <span className="gp-review-rating">
                        ⭐ {r.rating}
                      </span>
                    </div>

                    <p>{r.comment}</p>

                    <button
                      type="button"
                      className={`gp-review-helpful ${helpfulReviews[r._id] ? "active" : ""}`}
                      onClick={() => toggleHelpful(r._id)}
                    >
                      <FaThumbsUp /> {helpfulReviews[r._id] ? "Helpful ✓" : "Helpful"}
                    </button>
                  </div>
                ))
              )}

            </div>

            {reviews.length > REVIEWS_PER_PAGE && (
              <div className="gp-review-pagination">
                {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={reviewPage === p ? "active" : ""}
                    onClick={() => setReviewPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

          </div>



          {/* ================= RECENTLY VIEWED ================= */}
          <div className="gp-product-section">
            <div className="gp-section-head">
              <h3>Recently Viewed</h3>
              <p>Products you explored recently</p>
            </div>

            <div className="gp-product-slider">
              {recentProducts.map((p) => (
                <div
                  className="gp-recommend-card"
                  key={p._id}
                 onClick={() => openProduct(p)}
                >
                  {/* IMAGE */}
                  <div className="gp-card-image-box">
                    <img
                      src={
                        getImage(p)
                          ? `http://localhost:4000/uploads/${getImage(p)}`
                          : "https://dummyimage.com/300x300/eee/aaa"
                      }
                      alt={p.name}
                      className="gp-card-image"
                    />

                    {p.discountValue > 0 && (
                      <span className="gp-card-offer">
                        {p.discountType === "percentage"
                          ? `${p.discountValue}% OFF`
                          : p.discountType === "flat"
                            ? `₹${p.discountValue} OFF`
                            : ""}
                      </span>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="gp-card-content">
                    <h4 className="gp-card-title">{p.name}</h4>

                    <div className="gp-card-rating">
                      <span>⭐ {p.averageRating || 0}</span>
                      <span> ({p.reviewCount || 0} Reviews)</span>
                    </div>

                    <div className="gp-card-price-row">
                      <span className="gp-card-price">
  ₹
  {getFinalPrice(
    p,
    p?.category === "Dress"
      ? p?.variants?.[0]?.sizes?.[0]
      : p?.frameSizes?.[0],
    p?.variants?.[0] || null
  )}
</span>

                      {p.discountValue > 0 && (
                        <span className="gp-card-old-price">
                          ₹{p.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= SAME TYPE PRODUCTS ================= */}
          <div className="gp-product-section">
            <div className="gp-section-head">
              <h3>Same Type Products</h3>
              <p>Similar styles picked for you</p>
            </div>

            <div className="gp-product-slider">
              {relatedProducts.map((p) => {

                // ===============================
                // SAFE VARIANT + SIZE PICK
                // ===============================
                const defaultVariant = p?.variants?.[0] || null;
                const defaultSize = defaultVariant?.sizes?.[0] || null;

                // ===============================
                // FINAL PRICE CALC (PER PRODUCT)
                // ===============================
                const finalPrice = getFinalPrice(
                  p,
                  defaultSize,
                  defaultVariant
                );

                return (
                  <div
                    className="gp-recommend-card"
                    key={p._id}
                    onClick={() => navigate(`/product/${p._id}`)}
                  >

                    {/* IMAGE */}
                    <div className="gp-card-image-box">
                      <img
                        src={
                          getImage(p)
                            ? `http://localhost:4000/uploads/${getImage(p)}`
                            : "https://dummyimage.com/300x300/eee/aaa"
                        }
                        alt={p.name}
                        className="gp-card-image"
                      />

                      {/* DISCOUNT BADGE */}
                      {p.discountValue > 0 && (
                        <span className="gp-card-offer">
                          {p.discountType?.toLowerCase() === "percentage"
                            ? `${p.discountValue}% OFF`
                            : `₹${p.discountValue} OFF`}
                        </span>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="gp-card-content">
                      <h4 className="gp-card-title">{p.name}</h4>

                      <div className="gp-card-rating">
                        <span>⭐ {p.averageRating || 0}</span>
                        <span> ({p.reviewCount || 0} Reviews)</span>
                      </div>

                      {/* PRICE */}
                      <div className="gp-card-price-row">
                        <span className="gp-card-price">
                          ₹{finalPrice}
                        </span>

                        {p.discountValue > 0 && (
                          <span className="gp-card-old-price">
                            ₹{p.price}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= YOU MAY ALSO LIKE ================= */}
          <div className="gp-product-section">
            <div className="gp-section-head">
              <h3>You May Also Like</h3>
              <p>Trending products curated for you</p>
            </div>

            <div className="gp-product-slider">
              {similarCategory.map((p) => (
                <div
                  className="gp-recommend-card"
                  key={p._id}
                  onClick={() => {
                    navigate(`/product/${p._id}`);
                  }}
                >
                  <div className="gp-card-image-box">
                    <img
                      src={
                        getImage(p)
                          ? `http://localhost:4000/uploads/${getImage(p)}`
                          : "https://dummyimage.com/300x300/eee/aaa"
                      }
                      alt={p.name}
                      className="gp-card-image"
                    />

                    {p.discountValue > 0 && (
                      <span className="gp-card-offer">
                        {p.discountType === "percentage"
                          ? `${p.discountValue}% OFF`
                          : `₹${p.discountValue} OFF`}
                      </span>
                    )}
                  </div>

                  <div className="gp-card-content">
                    <h4 className="gp-card-title">{p.name}</h4>

                    <div className="gp-card-rating">
                      <span>⭐ {p.averageRating || 0}</span>
                      <span> ({p.reviewCount || 0} Reviews)</span>
                    </div>

                    <div className="gp-card-price-row">
                      <span className="gp-card-price">
                        ₹{getFinalPrice(p)}
                      </span>

                      {p.discountValue > 0 && (
                        <span className="gp-card-old-price">
                          ₹{p.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        <div className="desktop-sticky-cart">

          {/* Product Info */}
          <div className="desktop-product">
            <img
              src={`http://localhost:4000/uploads/${mainImage}`}
              alt={product.name}
            />

            <div>
              <h4>{product.name}</h4>

              <p>
                ₹{finalPrice}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="desktop-actions">

            {/* Dress-ku mattum Color */}
            {product?.category === "Dress" && (
              <select
                className="sticky-select"
                value={selectedVariant?.color || ""}
                onChange={(e) => {
                  const variant = product.variants.find(
                    (v) => v.color === e.target.value
                  );

                  setSelectedVariant(variant);
                  setSelectedSize(variant?.sizes?.[0]);
                  setMainImage(variant?.images?.[0] || "");
                }}
              >
                {product?.variants?.map((v) => (
                  <option key={v.color} value={v.color}>
                    {v.color}
                  </option>
                ))}
              </select>
            )}

            {/* Dress-ku mattum Size */}
            {product?.category === "Dress" && (
              <select
                className="sticky-select"
                value={selectedSize?.size || ""}
                onChange={(e) => {
                  const size = selectedVariant?.sizes.find(
                    (s) => s.size === e.target.value
                  );

                  setSelectedSize(size);
                }}
              >
                {selectedVariant?.sizes?.map((s) => (
                  <option key={s.size} value={s.size}>
                    {s.size} - ₹{s.price}
                  </option>
                ))}
              </select>
            )}

            {/* Quantity */}
            <div className="sticky-qty">

              <button
                onClick={() =>
                  setQty(qty > 1 ? qty - 1 : 1)
                }
              >
                −
              </button>

              <span>{qty}</span>

              <button
                onClick={() => {
                  if (qty < stock && !isOutOfStock) {
                    setQty(qty + 1);
                  }
                }}
              >
                +
              </button>

            </div>

            {/* Add To Cart */}
            <button
              className="sticky-cart-btn"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Out of Stock" : "Add To Cart"}
            </button>

          </div>

        </div>

        <div className="mobile-buy-bar">

          <div className="mobile-buy-price">
            <h4>₹{finalPrice}</h4>
          </div>

          <button
            className="mobile-cart-btn"
            onClick={handleAddToCart}
          >
            Cart
          </button>

          <button
            className="mobile-buy-btn"
            onClick={handleBuyNow}
          >
            Buy
          </button>

        </div>



      </div>
    </div>
  );
}

