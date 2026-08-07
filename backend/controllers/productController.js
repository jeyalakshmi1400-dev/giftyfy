const Product = require("../models/Product");
const pincodes = require("../data/pincodes.json");
const Order = require("../models/Order");
const Review = require("../models/Review");

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const getProductById = async(req,res)=>{
  try{
    console.log("Get by id hit");
    const product = await Product.findById(req.params.id);
    if(!product){
      return res.status(404).json({message:"Product not found"});

    }
    res.json(product);
  }catch(error){
    res.status(500).json({message:error.message});
  }
};
// CREATE PRODUCT (ADMIN)

const createProduct = async (req, res) => {
  try {
    console.log("Body:", req.body);

    // ✅ NORMAL IMAGES
    let images = [];
    let variantImages = [];

    if (req.files) {
      if (req.files.images) {
        images = req.files.images.map(file => file.filename);
      }

      if (req.files.variantImages) {
        variantImages = req.files.variantImages.map(file => file.filename);
      }
    }

    // ✅ LOCATIONS
    let locations = JSON.parse(req.body.locations);

    const updatedLocations = locations.map((loc) => ({
      city: loc.city,
      pincode: loc.pincode
    }));

    // ✅ VARIANTS PARSE
    let variants = [];
    if (req.body.variants) {
      variants = JSON.parse(req.body.variants);
    }

    // ✅ VARIANT IMAGES MAP
    let imgIndex = 0;

    variants = variants.map((variant) => {
      const count = variant.images.length; // frontend la ethana images select panniyo

      const imgs = variantImages.slice(imgIndex, imgIndex + count);

      imgIndex += count;

      return {
        ...variant,
        images: imgs
      };
    });

    // ✅ PRICE CALCULATION (NON-DRESS)
    const price = Number(req.body.price || 0);
    const discount = Number(req.body.discountValue || 0);
    const gst = Number(req.body.gst || 0);

    if (req.body.discountType === "percentage" && discount > 100) {
      return res.status(400).json({ message: "Invalid discount %" });
    }

    if (req.body.discountType === "flat" && discount > price) {
      return res.status(400).json({ message: "Discount > price" });
    }

    if (gst > 100) {
      return res.status(400).json({ message: "Invalid GST %" });
    }

    const discountedPrice =
      req.body.discountType === "percentage"
        ? price - (price * discount) / 100
        : price - discount;

    const finalPrice =
      discountedPrice + (discountedPrice * gst) / 100;

      

    // ✅ CREATE PRODUCT
  const product = await Product.create({

  ...req.body,

  isCustomized:
    req.body.isCustomized === "true",

  customizationFields:
    req.body.customizationFields
      ? JSON.parse(
          req.body.customizationFields
        )
      : [],

  price,
  discountValue: discount,
  gst,
  finalPrice,
  locations: updatedLocations,
  image: images,
  variants

});

    res.status(201).json(product);

  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// UPDATE PRODUCT (ADMIN ONLY)
const updateProduct = async (req, res) => {
  try {
    console.log("🔥 UPDATE API HIT");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // =========================
    // ✅ NORMALIZE FILES
    // =========================
    let allFiles = [];

    if (Array.isArray(req.files)) {
      allFiles = req.files;
    } else if (req.files) {
      allFiles = Object.values(req.files).flat();
    }

    // =========================
    // ✅ EXISTING MAIN IMAGES
    // =========================
    let existingImages = [];

    try {
      existingImages = JSON.parse(req.body.existingImages || "[]");
    } catch {
      existingImages = [];
    }

    existingImages = [...new Set(existingImages.filter(Boolean))];

    // =========================
    // ✅ NEW MAIN IMAGES
    // =========================
    const newImages = allFiles
      .filter(f => f.fieldname === "images")
      .map(f => f.filename);

    const finalImages = [...existingImages, ...newImages];

    // =========================
    // ✅ LOCATIONS
    // =========================
    let locations = [];

    try {
      locations =
        typeof req.body.locations === "string"
          ? JSON.parse(req.body.locations)
          : req.body.locations || [];
    } catch {
      locations = [];
    }

    locations = Array.isArray(locations) ? locations : [];

    // =========================
    // ✅ VARIANTS
    // =========================
    let variants = [];

    try {
      variants = JSON.parse(req.body.variants || "[]");
    } catch {
      variants = [];
    }

    // =========================
    // ✅ EXISTING VARIANT IMAGES
    // =========================
    let existingVariantImages = [];

    try {
      if (req.body.existingVariantImages) {
        if (Array.isArray(req.body.existingVariantImages)) {
          existingVariantImages = req.body.existingVariantImages.map(item =>
            JSON.parse(item || "[]")
          );
        } else {
          existingVariantImages = [
            JSON.parse(req.body.existingVariantImages || "[]")
          ];
        }
      }
    } catch {
      existingVariantImages = [];
    }

    // =========================
    // ✅ MERGE VARIANT IMAGES
    // =========================
    variants = variants.map((variant, index) => {
      const existingImgs = existingVariantImages[index] || [];

      const newImgs = allFiles
        .filter(file =>
          file.fieldname.includes("variantImages")
        )
        .map(file => file.filename);

      return {
        ...variant,
        images: [...existingImgs, ...newImgs]
      };
    });

    // =========================
    // ✅ PRICE CALCULATION
    // =========================
    const price = Number(req.body.price || 0);
    const discount = Number(req.body.discountValue || 0);
    const gst = Number(req.body.gst || 0);

    const discounted =
      req.body.discountType === "percentage"
        ? price - (price * discount) / 100
        : price - discount;

    const finalPrice = discounted + (discounted * gst) / 100;

    // =========================
    // ✅ FINAL UPDATE DATA
    // =========================
    const updateData = {
      name: req.body.name,
      category: req.body.category,
      subcategory: req.body.subcategory,
      brand: req.body.brand,
      isCustomized:
  req.body.isCustomized === "true",

customizationFields:
  req.body.customizationFields
    ? JSON.parse(
        req.body.customizationFields
      )
    : [],
      price,
       purchasePrice:
    Number(req.body.purchasePrice || 0),
      gst,
      discountType: req.body.discountType,
      discountValue: discount,
      quantity: Number(req.body.quantity || 0),
      description: req.body.description,
      locations,
      image: finalImages,
      finalPrice,
      variants:
        req.body.category?.toLowerCase() === "dress"
          ? variants
          : []
    };

    console.log("FINAL UPDATE DATA 👉", updateData);

    // =========================
    // ✅ UPDATE DB
    // =========================
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after" }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "✅ Updated Successfully",
      product
    });

  } catch (error) {
    console.log("❌ UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// DELETE PRODUCT (ADMIN ONLY)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getLocationFromPincode = (pin)=>{
  const result = pincodes.find(
    (item)=>item.pincode.toString() === pin.toString()
  );

  if(result){
    return{
      city:result.divisionname,
      region:result.regionname,
    };
  }
  return null;
};


const getcategories = async (req, res) => {
  try {
    const categoryName = decodeURIComponent(req.params.name);

    const products = await Product.find({
      category: {
        $regex: `^${categoryName}$`,
        $options: "i"
      }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getCityByPincode = (req, res) => {
  console.log("Pincode API HIT");

  const { pin } = req.params;

  const result = pincodes.find(
    (item) => item.pincode.toString() === pin.toString()
  );

  if (!result) {
    return res.status(404).json({ message: "Invalid pincode" });
  }

  res.json({
    city: result.divisionname,
    region: result.regionname,
  });
};


// ✅ 2. Get all cities
const getAllCities = (req, res) => {
  try {
    const cities = [
      ...new Set(
        pincodes.map((item) => item.divisionname)
      )
    ];

    res.json(cities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ 3. Get products by city
const getProductsByCity = async (req, res) => {
  try {
    console.log("🔥 CITY API HIT");

    const { cityName } = req.params;

    const products = await Product.find({
      "locations.city": {
        $regex: `^${cityName}$`,
        $options: "i"
      }
    });

    res.json(products);

  } catch (error) {
    console.log("CITY ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ✅ 4. Get pincodes by city
const getPincodesByCity = (req, res) => {
  const { city } = req.params;

  const result = pincodes.filter(
    (item) =>
      item.divisionname.toLowerCase() === city.toLowerCase()
  );

  const uniquePins = [
    ...new Set(result.map((item) => item.pincode))
  ];

  res.json(uniquePins);
};


const addRatingsToProducts = async (products) => {
  return Promise.all(
    products.map(async (product) => {
      const reviews = await Review.find({
        product: product._id,
      });

      const averageRating =
        reviews.length > 0
          ? Number(
              (
                reviews.reduce(
                  (sum, r) => sum + Number(r.rating || 0),
                  0
                ) / reviews.length
              ).toFixed(1)
            )
          : 0;

      return {
        ...product.toObject(),
        averageRating,
        reviewCount: reviews.length,
      };
    })
  );
};


// 🔥 GET RECOMMENDED PRODUCTS
const getRecommendedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ 1. SAME CATEGORY + SAME SUBCATEGORY
    const sameTypeProducts = await Product.find({
  category: product.category,
  subcategory: product.subcategory,
  _id: { $ne: product._id },
}).limit(6);

const similarCategoryProducts = await Product.find({
  category: product.category,
  subcategory: { $ne: product.subcategory },
  _id: { $ne: product._id },
}).limit(6);

const exploreMoreProducts = await Product.find({
  category: { $ne: product.category },
}).limit(6);

const sameType =
  await addRatingsToProducts(
    sameTypeProducts
  );

const similarCategory =
  await addRatingsToProducts(
    similarCategoryProducts
  );

const exploreMore =
  await addRatingsToProducts(
    exploreMoreProducts
  );

res.json({
  sameType,
  similarCategory,
  exploreMore,
});

    

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const recentproduct = async (req, res) => {
  try {
    let { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.json([]);
    }

    ids = [...new Set(ids)];
    ids = ids.slice(-3);

    const products = await Product.find({
      _id: { $in: ids },
    });

    const ordered = ids
      .map((id) =>
        products.find(
          (p) => p._id.toString() === id
        )
      )
      .filter(Boolean)
      .reverse();

    const ratedProducts =
      await addRatingsToProducts(ordered);

    return res.json(ratedProducts);

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getcategories,
  getCityByPincode,
  getAllCities,
  getProductById,
  getPincodesByCity,
  getProductsByCity,
  getRecommendedProducts,
  recentproduct,

};