require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");


require("./utils/whatsapp"); // ✅ ADD THIS

require("./cron/salaryCron");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ✅ MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.log("Mongo error", err));

// ✅ Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const productRoutes = require("./routes/productRoutes");
app.use("/api/product", productRoutes);

const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/categories", categoryRoutes);


const cartRoutes = require("./routes/cartRoutes");
app.use("/api/cart", cartRoutes);


const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const deliveryPartnerRoutes=require("./routes/deliveryPartnerRoutes");
app.use("/api/delivery", deliveryPartnerRoutes);


const deliveryPartnerPaymentRoutes = require("./routes/deliveryPartnerPaymentRoutes");


app.use("/api/delivery-payment",deliveryPartnerPaymentRoutes);
const deliveryAuthRoutes = require("./routes/deliveryPartnerAuthRoutes");
app.use("/api/delivery-partner/auth", deliveryAuthRoutes);


const adminDeliveryRoutes = require("./routes/adminDeliveryRoutes");

app.use("/api/admin/delivery", adminDeliveryRoutes);

const orderRequestRoutes = require("./routes/orderRequestRoutes");
app.use("/api/order-requests", orderRequestRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin",adminRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);


const offerRoutes = require("./routes/offerRoutes");
app.use("/api/offers", offerRoutes);



const addressRoutes = require("./routes/addressRoutes");
app.use("/api/address", addressRoutes);



const bannerRoutes =require("./routes/bannerRoutes");
app.use("/api/banner",bannerRoutes);


const logoRoutes =require("./routes/logoRoutes");
app.use("/api",logoRoutes);




app.use("/uploads",express.static("uploads"));



const wishlistRoutes = require("./routes/wishlistRoutes");
app.use("/api/wishlist", wishlistRoutes);


const couponRoutes = require("./routes/couponRoutes.js");

app.use("/api/coupons", couponRoutes);



const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/notifications",notificationRoutes);

const adminNotificationRoutes = require(
  "./routes/adminNotificationRoutes"
);

app.use(
  "/api/admin",
  adminNotificationRoutes
);


const reviewRoutes = require("./routes/reviewRoutes");

app.use("/api/reviews", reviewRoutes);

const siteContentRoutes = require("./routes/siteContentRoutes");

app.use("/api/site-content",siteContentRoutes);


const profitRoutes = require("./routes/profitRoutes");

app.use("/api/profit", profitRoutes);


const dashboardRoutes = require("./routes/dashboardRoutes.js");

app.use("/api/admin/dash", dashboardRoutes);



const aiRoutes = require("./routes/ai");
app.use("/api/ai", aiRoutes);

const salaryRoutes = require("./routes/salaryRoutes");
app.use("/api/salary", salaryRoutes);

const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);

// ✅ PORT from .env
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 