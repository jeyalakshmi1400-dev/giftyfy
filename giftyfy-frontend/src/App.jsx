import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Category from "./pages/Category";
import Allproducts from "./pages/Allproducts";
import Cart from "./pages/Cart";
import Product from "./pages/Product";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import VerifyOTP from "./pages/VerifyOTP";
import Payment from "./pages/Payment";
import Success from "./pages/Success";
import Profile from "./pages/Profile";
import ReturnProduct from "./pages/ReturnProduct";
import Orders from "./pages/Orders";
import ReviewPage from "./pages/ReviewPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";


function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP/>}/>
        <Route path="/category/:name" element={<Category/>}/>
        <Route path ="/products" element={<Allproducts/>}/>
        <Route path ="/cart" element={<Cart/>}/>
        <Route path="/product/:id" element={<Product/>}/>
        <Route path="/wishlist" element={<Wishlist/>}/>
        <Route path="/checkout"element={<Checkout/>}/>
        <Route path="/payment" element={<Payment/>}/>
        <Route path="/success/:id" element={<Success />} />
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/orders" element={<Orders/>}/>
        <Route path="/return/:id" element={<ReturnProduct/>}/>
        <Route path="/review/:id" element={<ReviewPage/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/contact" element={<Contact/>}/>
      </Routes>


        <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      <Footer/>
    </Router>
  );
}

export default App;