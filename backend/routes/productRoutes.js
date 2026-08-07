const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getcategories,
  getCityByPincode,
  getAllCities,
  getProductsByCity,
  getPincodesByCity,
  getRecommendedProducts,
  recentproduct,

} = require("../controllers/productController");

// ✅ Pincode → City
router.get("/pincode/:pin", getCityByPincode);

// ✅ Get all cities
router.get("/cities", getAllCities);

// ✅ Get products by city
router.get("/city/:cityName", getProductsByCity);

// ✅ Get pincodes by city
router.get("/pincodes/:city", getPincodesByCity);
router.get("/category/:name", getcategories);
router.get("/recommended/:id", getRecommendedProducts);
router.get("/recommend/:id", getRecommendedProducts);
router.post("/recent",recentproduct);



// existing routes
router.get("/", getProducts);
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "variantImages", maxCount: 20 }
  ]),
  createProduct
);

router.put(
  "/:id",
  upload.any(),
  updateProduct
);
router.delete("/:id", deleteProduct);
router.get("/:id", getProductById);

module.exports = router;