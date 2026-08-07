import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// PAGES
import DeliveryDashboard from "./pages/DeliveryDashboard";
import DeliveryRegister from "./pages/DeliveryRegister";
import DeliveryLogin from "./pages/DeliveryLogin";

// COMPONENTS
import DeliveryNavbar from "./components/DeliveryNavbar";
import OrderPickup from "./pages/OrderPickup";
import ReportPage from "./pages/ReportPage";
import DeliveryWallet from "./pages/DeliveryWallet";
import DeliveryProfile from "./pages/DeliveryProfile";
import ReturnPickup from "./pages/ReturnPickup";
import DeliveryCODPage from "./pages/DeliveryCODPage";
import DeliveryRequests from "./pages/DeliveryRequests";
import { ToastContainer } from "react-toastify";
import CancelOrders from "./pages/CancelOrders";


export default function App() {
  return (
    <BrowserRouter>
     <ToastContainer />

      {/* GLOBAL NAVBAR */}
      <DeliveryNavbar />

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<DeliveryLogin />}
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={<DeliveryRegister />}
        />

        {/* DASHBOARD */}
        <Route
          path="/"
          element={<DeliveryDashboard />}
        />
        <Route path="/order-pickup" element={<OrderPickup/>}/>
        <Route path="/reports" element={<ReportPage/>}/>
        <Route path="/wallet" element={<DeliveryWallet/>}/>
        <Route path="/profile" element={<DeliveryProfile/>}/>
        <Route path="/returns" element={<ReturnPickup/>}/>
    <Route path="/cod" element={<DeliveryCODPage/>}/>
    <Route path="/delivery-requests" element={<DeliveryRequests/>}/>
    <Route path="/delivery/cancel-orders" element={<CancelOrders/>}/>
      </Routes>

    </BrowserRouter>
  );
}