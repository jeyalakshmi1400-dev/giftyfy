import { Routes, Route, Navigate } from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import AdminBannerPage from "./pages/BannerPage";
import ProductPage from "./pages/ProductPage";
import Addproduct from "./pages/Addproduct";
import Addcategory from "./pages/Addcategory";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductView from "./pages/ProductView";
import CreateCoupon from "./pages/CreateCoupon";
import CouponList from "./pages/CouponList";
import AdminOrders from "./pages/AdminOrders";
import AdminUsers from "./pages/AdminUser";
import DeliveryPartnerList from "./pages/DeliveryPartnerList";
import AdminDeliveryPayments from "./pages/AdminDeliveryPayments";
import AdminReturns from "./pages/AdminReturns";
import AdminReviews from "./pages/AdminReviews";
import AdminPayments from "./pages/AdminPayments";
import AdminSiteContent from "./pages/AdminSiteContent";
import AdminProfit from "./pages/AdminProfit";
import AdminCODPage from "./pages/AdminCODPage";
import SalaryManagement from "./pages/SalaryManagement";
import AdminDeliveryCharge from "./pages/AdminDeliveryCharge";
import AdminGiftSetting from "./pages/AdminGiftSetting";

// 🔥 NEW IMPORT
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  return (
    <>
    <Routes>
       

      {/* default redirect */}
      <Route path="/" element={<Navigate to="/admin-login" />} />

      {/* AUTH */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-register" element={<AdminRegister />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/banner"
        element={
          <ProtectedRoute>
            <AdminBannerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/product"
        element={
          <ProtectedRoute>
            <ProductPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/product/edit/:id"
        element={
          <ProtectedRoute>
            <Addproduct />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/addproduct"
        element={
          <ProtectedRoute>
            <Addproduct />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/product/:id"
        element={
          <ProtectedRoute>
            <ProductView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/category"
        element={
          <ProtectedRoute>
            <Addcategory />
          </ProtectedRoute>
        }
      />

      {/* 🔥 COUPON ROUTE */}
      <Route path="/admin/create-coupon" element={<ProtectedRoute><CreateCoupon/></ProtectedRoute>}/>
            <Route path="/admin/create-coupon/:id" element={<ProtectedRoute><CreateCoupon/></ProtectedRoute>}/>

        <Route path="/admin/coupons" element={<ProtectedRoute><CouponList/></ProtectedRoute>}/>
        <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders/></ProtectedRoute>}/>
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers/></ProtectedRoute>}/>
        <Route path="/admin/delivery-partners" element={<ProtectedRoute><DeliveryPartnerList/></ProtectedRoute>}/>
        <Route path="/admin/delivery-payments" element={<ProtectedRoute><AdminDeliveryPayments/></ProtectedRoute>}/>
        <Route path="/admin/returns" element={<ProtectedRoute><AdminReturns/></ProtectedRoute>}/>
        <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews/></ProtectedRoute>}/>
        <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments/></ProtectedRoute>}/>
        <Route path="/admin/site-content" element={<ProtectedRoute><AdminSiteContent/></ProtectedRoute>}/>
        <Route path="/admin/profit" element={<ProtectedRoute><AdminProfit/></ProtectedRoute>}/>
        <Route path="/admin/cod" element={<ProtectedRoute><AdminCODPage/></ProtectedRoute>}/>
        <Route path="/salary-management" element={<SalaryManagement/>}/>
        <Route path="/adim/delivery-charge" element={<ProtectedRoute><AdminDeliveryCharge/></ProtectedRoute>}/>
        <Route path="/admin/gift-setting" element={<ProtectedRoute><AdminGiftSetting/></ProtectedRoute>}/>
        
    </Routes>
    {/* Toast Container */}
    <ToastContainer
      position="top-center"
      autoClose={2000}
      theme="colored"
      newestOnTop
      closeOnClick
      pauseOnHover
    />
    </>
  );
}

export default App;