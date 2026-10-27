import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/checkout.css";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Checkout() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();

  const [newAddress, setNewAddress] = useState({
    firstName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    type: "home",
  });

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [cart, setCart] = useState({ items: [], summary: {} });
  const [editingId, setEditingId] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [showCouponPanel, setShowCouponPanel] = useState(false);
const [categoryDiscount,setCategoryDiscount]=useState(0);

const [amountDiscount,setAmountDiscount]=useState(0);  const [finalAmount, setFinalAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [autoCoupon, setAutoCoupon] = useState(null);
  const buyNowData = location.state;
  const [sentCouponCode, setSentCouponCode] = useState("");
  const { state } = useLocation();

  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [blockedProducts, setBlockedProducts] = useState([]);
  const [pendingAddress, setPendingAddress] = useState(null);

  const [method, setMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const buyNowItem = state?.item || null;
  const [deliveryCharge,setDeliveryCharge] = useState(0);
const [deliverySetting,setDeliverySetting] = useState(null);
  const deliveryPincode = localStorage.getItem("deliveryPincode");
  const [giftSetting,setGiftSetting]=useState(null);
const [giftOption,setGiftOption]=useState(false);
const [giftMessage,setGiftMessage]=useState("");
const [deliveryAvailable, setDeliveryAvailable] = useState(true);
const [codExtraCharge, setCodExtraCharge] = useState(0);


const giftCharge = giftOption && giftSetting
  ? Number(giftSetting.giftWrapCharge)
  : 0;


  useEffect(() => {
  if (buyNowData?.buyNow) {
  const item = buyNowData.item;

  const subtotal =
    (item.originalPrice || item.price) * item.quantity;

  const discount =
    ((item.originalPrice || item.price) - item.price) *
    item.quantity;

  const total = item.price * item.quantity;

  setCart({
    items: [item],
    summary: {
      subtotal,
      discount,
      total,
    },
  });

  return;
}



    const fetchCart = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/cart",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
setCart(res.data);



} catch (err) {
        console.log(err);
      }
    };

    fetchCart();
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      const res = await axios.get("http://localhost:4000/api/address", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setAddresses(res.data);

      if (res.data.length > 0) {
        setSelectedAddress(res.data[0]);
      }
    };

    fetchAddresses();
  }, []);

  useEffect(() => {
    setFinalAmount(cart.summary?.total || 0);
  }, [cart]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/coupons");
        setCoupons(res.data.coupons || []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCoupons();
  }, []);
useEffect(() => {
  const savedAutoCoupon = localStorage.getItem("autoCoupon");
  const savedCategoryDiscount = localStorage.getItem("categoryDiscount");

  if (savedAutoCoupon) setAutoCoupon(savedAutoCoupon);
  if (savedCategoryDiscount)
    setCategoryDiscount(Number(savedCategoryDiscount));
}, []);



  useEffect(() => {

  if(
    cart.items.length > 0 &&
    coupons.length > 0
  ){
    autoApplyCategoryCoupon(cart);
  }

}, [cart, coupons]);




useEffect(()=>{

  const fetchDeliverySetting = async()=>{

    try{

      const res = await axios.get(
        "http://localhost:4000/api/delivery-setting"
      );

      setDeliverySetting(res.data);

    }
    catch(err){
      console.log(err);
    }

  };


  fetchDeliverySetting();

},[]);




useEffect(() => {
  if (selectedAddress && deliverySetting) {
    calculateDeliveryCharge(selectedAddress);
  }
}, [
  selectedAddress,
  deliverySetting,
  cart,
  method
]);

useEffect(()=>{

 axios.get(
 "http://localhost:4000/api/gift-setting"
 )
 .then(res=>{
   setGiftSetting(res.data);
 })

},[]);



const indiaStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];
  const sendCoupon = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/coupons/send-first",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        setAppliedCoupon(null);
        alert("🎉 Coupon sent!");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Error ❌");
    }
  };

const sendSelectedCoupon = async (couponCode) => {
  try {
    const res = await axios.post(
      "http://localhost:4000/api/coupons/send",
      {
        code: couponCode,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!res.data.success) {
      console.log(res.data.message);
    }
  } catch (err) {
    console.log("Coupon send failed", err);
  }
};

  

const applyCoupon = async (codeFromBtn) => {
  const code = codeFromBtn || couponCode;

  try {
    const res = await axios.post(
      "http://localhost:4000/api/coupons/apply",
      {
        code,
        userId: localStorage.getItem("userId"),
        cartTotal: cart.summary?.total,
        items: cart.items,
        categoryDiscount, // ✅ Auto category discount send
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
console.log(res.data);
    if (res.data.success) {
      // Amount coupon
      setAmountDiscount(res.data.amountDiscount);

      // Total after category + amount coupon
      setFinalAmount(res.data.finalAmount);

      // Manual coupon
      setAppliedCoupon(res.data.couponCode);

      localStorage.setItem(
        "appliedCoupon",
        code
      );

      localStorage.setItem(
        "amountDiscount",
        res.data.amountDiscount
      );

      localStorage.setItem(
        "categoryDiscount",
        categoryDiscount
      );

      localStorage.setItem(
        "finalAmount",
        res.data.finalAmount
      );

      setShowCouponPanel(false);
      await sendSelectedCoupon(code);

      toast.success("Coupon Applied Successfully 🎉", {
        position: "top-center",
        autoClose: 2000,
        theme: "colored",
      });
    } else {
      toast.error(res.data.message);
    }
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Invalid Coupon"
    );
  }
};

  const goToPayment = () => {
    if (!selectedAddress) {
      alert("Select address ❌");
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      alert("Cart is empty ❌");
      return;
    }

    const addressPin = String(selectedAddress.pincode);

    cart.items.forEach((item) => {
      console.log("FULL ITEM:", item);
      console.log("PRODUCT:", item.product);
      console.log("LOCATIONS:", item.product?.locations);
    });

    const blockedProducts = cart.items.filter((item) => {
      const locations =
        item.product?.locations || [];

      const allPincodes = locations.flatMap((loc) =>
        loc.pincode.map((p) => String(p))
      );

      if (allPincodes.length === 0) return false;

      return !allPincodes.includes(
        String(selectedAddress.pincode)
      );
    });

    if (blockedProducts.length > 0) {
      const productNames = blockedProducts
        .map((item) => item.product?.name)
        .join(", ");

      alert(
        `❌ ${productNames} is not deliverable to pincode ${addressPin}`
      );

      return;
    }

    navigate("/payment", {
      state: {
        cart,
        selectedAddress,
        finalAmount,
        couponCode: appliedCoupon,
        buyNow: buyNowData?.buyNow || false,
        item: buyNowData?.item || null,
      },
    });
  };

  const removeCoupon = () => {
  const total = cart.summary?.total || 0;

  // Remove only amount coupon
  setAppliedCoupon(null);
  setAmountDiscount(0);
  setCouponCode("");

  // Keep category coupon
  setFinalAmount(total - categoryDiscount);

  localStorage.removeItem("appliedCoupon");
  localStorage.removeItem("amountDiscount");
  localStorage.setItem("finalAmount", total - categoryDiscount);

  toast.info("Amount coupon removed");
};

  const handleChange = (e) => {
    setNewAddress({
      ...newAddress,
      [e.target.name]: e.target.value
    });
  };

  const saveAddress = async () => {
    try {
      let res;

      if (editingId) {
        res = await axios.put(
          `http://localhost:4000/api/address/${editingId}`,
          newAddress,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setAddresses(
          addresses.map((addr) =>
            addr._id === editingId ? res.data : addr
          )
        );

        alert("Address updated successfully ✅");
      } else {
        res = await axios.post(
          "http://localhost:4000/api/address",
          newAddress,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setAddresses([res.data, ...addresses]);

        alert("Address added successfully ✅");
      }

      setEditingId(null);
      setSelectedAddress(res.data);
      setShowForm(false);
    } catch (err) {
      alert("Save failed ❌");
    }
  };

  const deleteAddress = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setAddresses(addresses.filter((addr) => addr._id !== id));

      if (selectedAddress?._id === id) {
        setSelectedAddress(null);
      }

      alert("Address deleted successfully");
    } catch (err) {
      alert("Delete failed ❌");
    }
  };

  const editAddress = (addr) => {
    setShowForm(true);
    setEditingId(addr._id);

    setNewAddress({
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",
      address: addr.address || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      pincode: addr.pincode || "",
      phone: addr.phone || "",
      altPhone: addr.altPhone || "",
      country: addr.country || "India",
      type: addr.type || "home",
      email: addr.email || "",
    });
  };

 const handlePayment = async () => {
  console.log("Place Order clicked");
  console.log("Selected Address:", selectedAddress);
console.log("Delivery Available:", deliveryAvailable);
console.log("Payment Method:", method);
console.log("Cart Items:", cart.items);
  if (!selectedAddress) {
    toast.error("Please select a delivery address");
    return;
  }
  

  const blockedProducts = cart.items.filter((item) => {
    const locations = item.product?.locations || [];

    const allowedPincodes = locations.flatMap((loc) =>
      loc.pincode.map((pin) => String(pin))
    );

    if (allowedPincodes.length === 0) return false;

    return !allowedPincodes.includes(String(selectedAddress.pincode));
  });

  if (blockedProducts.length > 0) {
    toast.error(
      `${blockedProducts
        .map((p) => p.product?.name)
        .join(", ")} cannot be delivered to ${selectedAddress.pincode}`
    );
    return;
  }

  if (!cart.items || cart.items.length === 0) {
    toast.error("Your cart is empty");
    navigate("/");
    return;
  }

  try {
    setLoading(true);

    // Final amount with delivery + gift wrap charge

const finalGiftCharge =
  giftOption && giftSetting?.giftWrapEnabled
    ? Number(giftSetting.giftWrapCharge)
    : 0;


const payableAmount = Math.round(
  Number(finalAmount) +
  Number(deliveryCharge) +
  Number(finalGiftCharge)
);

    // ===================== ONLINE PAYMENT =====================
    if (method === "razorpay") {
      if (!window.Razorpay) {
        toast.error("Razorpay SDK not loaded");
        setLoading(false);
        return;
      }

      const res = await axios.post(
        "http://localhost:4000/api/payment/create-order",
        {
          amount: payableAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const { razorpayOrder, key } = res.data;

      const options = {
        key,
        amount: razorpayOrder.amount,
        currency: "INR",
        order_id: razorpayOrder.id,
        name: "Giftyfy",
        description: "Secure Payment",

        prefill: {
          name: `${selectedAddress.firstName || ""} ${
            selectedAddress.lastName || ""
          }`,
          contact: selectedAddress.phone || "",
        },

        theme: {
          color: "#e91e63",
        },

        handler: async function (response) {
          try {
            // Verify Payment
            await axios.post(
              "http://localhost:4000/api/payment/verify",
              response,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            // Create Order
            const orderRes = await axios.post(
              "http://localhost:4000/api/orders",
              {
                name: selectedAddress.firstName,
                address: selectedAddress.address,
                phone: selectedAddress.phone,
                pincode: selectedAddress.pincode,

                couponCode,
                paymentMethod: "Online",
                paymentId: response.razorpay_payment_id,

                buyNowItem,

                discount: categoryDiscount + amountDiscount,
                deliveryCharge,
                giftWrap: giftOption,

                giftWrapCharge: finalGiftCharge,

                giftMessage,
                totalAmount: payableAmount,
                paymentMethod: "Online",
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            window.dispatchEvent(new Event("cartUpdated"));

            toast.success("Order placed successfully! 🎉", {
              position: "top-center",
              autoClose: 2000,
              theme: "colored",
            });

            setTimeout(() => {
              console.log(orderRes.data.order);
             navigate(`/success/${orderRes.data.order.orderId}`, {
                state: {
                  paymentMethod: "Online",
                  order: orderRes.data.order,
                },
              });
            }, 2000);
          } catch (err) {
            console.log(err);
            toast.error(
              err.response?.data?.message ||
                "Payment verification failed"
            );
          }
        },

        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    }

    // ===================== CASH ON DELIVERY =====================
    else {
      const orderRes = await axios.post(
        "http://localhost:4000/api/orders",
        {
          name: selectedAddress.firstName,
          address: selectedAddress.address,
          phone: selectedAddress.phone,
          pincode: selectedAddress.pincode,

          couponCode,
          paymentMethod: "COD",

          buyNowItem,

          discount: categoryDiscount + amountDiscount,
          deliveryCharge,
          giftWrap: giftOption,

          giftWrapCharge: finalGiftCharge,

          giftMessage,
          totalAmount: payableAmount,
          paymentMethod: "COD",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Order placed successfully! 🎉", {
        position: "top-center",
        autoClose: 2000,
        theme: "colored",
      });

      setTimeout(() => {
        console.log("Order Response:", orderRes.data.order);
        navigate(`/success/${orderRes.data.order.orderId}`, {
        state: {
          paymentMethod: "Cash on Delivery",
          order: orderRes.data.order,
        },
      });
      }, 2000);
    }
  } catch (err) {
    console.log(err);

    toast.error(
      err.response?.data?.message || "Payment failed ❌"
    );
  } finally {
    setLoading(false);
  }
};

  const removeUnavailableProducts = async () => {
    try {
      for (const item of blockedProducts) {
        await axios.delete(
          `http://localhost:4000/api/cart/remove/${item._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );
      }

      const res = await axios.get(
        "http://localhost:4000/api/cart",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setCart(res.data);
      setSelectedAddress(pendingAddress);
      setShowUnavailableModal(false);
      toast.success("Unavailable products removed");
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const moveToWishlistAndRemove = async () => {
    try {
      await axios.post(
        "http://localhost:4000/api/cart/move-undeliverable",
        {
          productIds: blockedProducts.map(item => item.product._id),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const cartRes = await axios.get(
        "http://localhost:4000/api/cart",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setCart(cartRes.data);
      setShowUnavailableModal(false);
      setBlockedProducts([]);
      setPendingAddress(null);
      setSelectedAddress(pendingAddress);
      toast.success("Products moved to wishlist ❤️");
    } catch (err) {
      console.log("MOVE ERROR:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed");
    }
  };


const calculateDeliveryCharge = (address) => {
  if (!deliverySetting || !address) return;

  const subtotal = cart.summary?.total || 0;

  // Free Delivery
  if (subtotal >= deliverySetting.freeDeliveryAmount) {
    setDeliveryCharge(0);
    return;
  }

  const state = address.state?.trim();

  const zone = deliverySetting.zones.find((z) =>
    z.states.includes(state)
  );

if (!zone) {
  setDeliveryAvailable(false);
  setDeliveryCharge(0);

  if (!toast.isActive("delivery-not-available")) {
    toast.error(`Delivery is not available in ${state}`, {
      toastId: "delivery-not-available",
    });
  }

  return;
}

setDeliveryAvailable(true);

const onlineCharge = Number(zone.onlineCharge);
const codCharge = Number(zone.codCharge);

setCodExtraCharge(codCharge - onlineCharge);


const charge =
  method === "cod"
    ? Number(zone.codCharge)
    : Number(zone.onlineCharge);

setDeliveryCharge(charge);


};

const calculateFinalAmount = () => {
  const productTotal = cart.summary?.total || 0;

  const discount =
    Number(categoryDiscount) + Number(amountDiscount);

  const finalGiftCharge =
    giftOption && giftSetting?.giftWrapEnabled
      ? Number(giftSetting.giftWrapCharge)
      : 0;

  return (
    productTotal +
    Number(deliveryCharge) +
    finalGiftCharge -
    discount
  );
};


const autoApplyCategoryCoupon = async (cartData) => {
  try {
    const cartTotal = Number(cartData.summary?.total || 0);

    const res = await axios.post(
      "http://localhost:4000/api/coupons/auto-category",
      {
        items: cartData.items,
        cartTotal,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // ❌ No coupon found
    if (!res.data.success) {
      setCategoryDiscount(0);
      setAutoCoupon(null);

      const final = cartTotal - Number(amountDiscount);

      setFinalAmount(final);

      localStorage.removeItem("categoryDiscount");
      localStorage.removeItem("autoCoupon");
      localStorage.setItem("finalAmount", final);

      return;
    }

    // ✅ Minimum Order validation (Frontend Safety)
    if (
      res.data.minOrderAmount &&
      cartTotal < Number(res.data.minOrderAmount)
    ) {
      setCategoryDiscount(0);
      setAutoCoupon(null);

      const final = cartTotal - Number(amountDiscount);

      setFinalAmount(final);

      localStorage.removeItem("categoryDiscount");
      localStorage.removeItem("autoCoupon");
      localStorage.setItem("finalAmount", final);

      return;
    }

    // ✅ Apply Category Coupon
    const discount = Number(res.data.discount || 0);

    setCategoryDiscount(discount);

    const totalDiscount =
      discount + Number(amountDiscount);

    const finalAmount =
      cartTotal - totalDiscount;

    setFinalAmount(finalAmount);

    setAutoCoupon(res.data.couponCode);

    localStorage.setItem(
      "categoryDiscount",
      discount
    );

    localStorage.setItem(
      "autoCoupon",
      res.data.couponCode
    );

    localStorage.setItem(
      "finalAmount",
      finalAmount
    );

    toast.success(
      `${res.data.couponCode} Auto Applied 🎉`,
      {
        toastId: "auto-category-coupon",
      }
    );
  } catch (err) {
    console.log(
      "AUTO COUPON ERROR",
      err.response?.data || err
    );

    setCategoryDiscount(0);
    setAutoCoupon(null);

    localStorage.removeItem("categoryDiscount");
    localStorage.removeItem("autoCoupon");
  }
};
const summary = cart.summary || {};
  return (
    <div className="checkout-wrapper">
      {/* HEADER */}
      <div className="checkout-header">
        <div className="checkout-header-content">
          <h1>Checkout</h1>
          <p className="checkout-header-subtitle">Complete your order securely</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="checkout-container">
        {/* LEFT SECTION */}
        <div className="checkout-left">
          {!showForm ? (
            <>
              {/* ADDRESS SECTION */}
              <div className="checkout-section">
                <div className="section-header">
                  <h2>Delivery Address</h2>
                  <p>Select where you want your order delivered</p>
                </div>

                <div className="address-cards-wrapper">
                  {addresses.length === 0 ? (
                    <p className="no-addresses">No addresses added yet. Please add one to continue.</p>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`address-card ${
                          selectedAddress?._id === addr._id ? "active" : ""
                        }`}
                        onClick={() => {
                          const blocked = cart.items.filter((item) => {
                            const locations = item.product?.locations || [];
                            const pincodes = locations.flatMap(loc =>
                              loc.pincode.map(pin => String(pin))
                            );
                            if (pincodes.length === 0) return false;
                            return !pincodes.includes(String(addr.pincode));
                          });

                          if (blocked.length > 0) {
                            setBlockedProducts(blocked);
                            setPendingAddress(addr);
                            setShowUnavailableModal(true);
                            return;
                          }
                          setSelectedAddress(addr);
                          calculateDeliveryCharge(addr);
                        }}
                      >
                        <div className="address-card-header">
                          <div className="address-card-title">
                            <h3>{addr.firstName} {addr.lastName}</h3>
                            <span className={`address-badge ${addr.type}`}>
                              {addr.type.charAt(0).toUpperCase() + addr.type.slice(1)}
                            </span>
                          </div>
                          {selectedAddress?._id === addr._id && (
                            <div className="address-checkmark">✓</div>
                          )}
                        </div>

                        <div className="address-card-body">
                          <p className="address-text">{addr.address}</p>
                          <p className="address-city">{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="address-phone">{addr.phone}</p>
                        </div>

                        <div className="address-card-actions">
                          <button
                            className="btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              editAddress(addr);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAddress(addr._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  className="btn-add-address"
                  onClick={() => {
                    setEditingId(null);
                    setNewAddress({
                      firstName: "",
                      lastName: "",
                      address: "",
                      landmark: "",
                      city: "",
                      pincode: "",
                      phone: "",
                      altPhone: "",
                      country: "India",
                      type: "home",
                      email: "",
                    });
                    setShowForm(true);
                  }}
                >
                  <span className="plus-icon">+</span> Add New Address
                </button>
              </div>

              {/* PAYMENT METHOD SECTION */}
              <div className="checkout-section">
                <div className="section-header">
                  <h2>Payment Method</h2>
                  <p>Choose how you want to pay</p>
                </div>

                <div className="payment-methods">
                  <div
                    className={`payment-method ${method === "razorpay" ? "active" : ""}`}
                    onClick={() => setMethod("razorpay")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={method === "razorpay"}
                      readOnly
                    />
                    <div className="payment-content">
                      <h3>Online Payment</h3>
                      <p>Cards • UPI • Net Banking</p>
                    </div>
                    <span className="payment-icon">💳</span>
                  </div>

                  <div
                    className={`payment-method ${method === "cod" ? "active" : ""}`}
                    onClick={() => setMethod("cod")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={method === "cod"}
                      readOnly
                    />
                    <div className="payment-content">
                      <h3>Cash on Delivery</h3>
                      <p>Pay when you receive your order</p>
                    </div>
                    <span className="payment-icon">🚚</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // ADDRESS FORM
            <div className="address-form-wrapper">
              <div className="address-form">
                <div className="form-header">
                  <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* CONTACT DETAILS */}
                <div className="form-section">
                  <h3 className="form-section-title">Contact Details</h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Enter your full name"
                        value={newAddress.firstName || ""}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="10-digit mobile number"
                        value={newAddress.phone || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={newAddress.email || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* ADDRESS DETAILS */}
                <div className="form-section">
                  <h3 className="form-section-title">Address Details</h3>

                  <div className="form-group">
                    <label>Full Address *</label>
                    <textarea
                      rows="3"
                      name="address"
                      placeholder="House number, street name, area"
                      value={newAddress.address || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="Your city"
                        value={newAddress.city || ""}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                    <label>State *</label>

                    <select
                      name="state"
                      value={newAddress.state || ""}
                      onChange={handleChange}
                    >
                      <option value="">
                        Select State
                      </option>

                      {indiaStates.map((state) => (
                        <option 
                          key={state}
                          value={state}
                        >
                          {state}
                        </option>
                      ))}

                    </select>
                  </div>
                  </div>

                  <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="6-digit pincode"
                      value={newAddress.pincode || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* ADDRESS TYPE */}
                <div className="form-section">
                  <h3 className="form-section-title">Address Type</h3>

                  <div className="address-type-selector">
                    {[
                      { value: "home", icon: "🏠", label: "Home" },
                      { value: "office", icon: "🏢", label: "Office" },
                      { value: "other", icon: "📍", label: "Other" }
                    ].map((type) => (
                      <button
                        key={type.value}
                        className={`type-option ${newAddress.type === type.value ? "active" : ""}`}
                        onClick={() =>
                          setNewAddress({ ...newAddress, type: type.value })
                        }
                      >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* FORM ACTIONS */}
                <div className="form-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save"
                    onClick={saveAddress}
                  >
                    {editingId ? "Update Address" : "Save Address"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SECTION - ORDER SUMMARY */}
        {cart.items && cart.items.length > 0 ? (
          <div className="checkout-right">
            {/* ORDER SUMMARY CARD */}
            <div className="order-summary-card">
              <h2 className="card-title">Order Summary</h2>

              {/* PRODUCTS LIST */}
              <div className="products-list">
                {cart.items.map((item) => (
                  <div key={item._id} className="product-item">
                    <img
                      src={`http://localhost:4000/uploads/${item.image}`}
                      alt={item.name}
                      className="product-image"
                    />
                    <div className="product-details">
                      <p className="product-name">{item.name}</p>
                      <p className="productgf-meta">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                      {(item.size || item.frameSize) && <p className="productgf-meta">Size: {item.size || item.frameSize}</p>}
                      {item.variant && <p className="productgf-meta">Color: {item.variant}</p>}
                      <p className="tax-note">Inclusive of all taxes</p>
                    </div>
                    <div className="product-price">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* COUPON SECTION */}
              <div className="coupon-section">
                <button
                  className="btn-view-coupons"
                  onClick={() => setShowCouponPanel(true)}
                >
                  View Available Coupons →
                </button>

                {showCouponPanel && (
                  <div className="coupon-drawer-overlay">
                    <div className="coupon-drawer">
                      <div className="drawer-header">
                        <h3>Available Coupons</h3>
                        <button
                          className="btn-close-drawer"
                          onClick={() => setShowCouponPanel(false)}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="coupon-input-section">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="coupon-input"
                        />
                        <button
                        className="btn-apply"
                        onClick={() => {
                          if (
                            c.expiryDate &&
                            new Date(c.expiryDate) < new Date()
                          ) {
                            toast.error("Coupon has expired ❌");
                            return;
                          }

                          applyCoupon(c.code);
                        }}
                      >
                        Apply
                      </button>
                      </div>

                     <div className="coupons-grid">
  {coupons.filter((c) => !c.categories || c.categories.length === 0).length === 0 ? (
    <p className="no-coupons">No coupons available</p>
  ) : (
    coupons
      .filter((c) => !c.categories || c.categories.length === 0)
      .map((c) => (
        <div
  className={`coupon-item ${
    c.expiryDate &&
    new Date(c.expiryDate) < new Date()
      ? "expired"
      : ""
  }`}
  key={c._id}
>
          <div className="coupon-badge">{c.code}</div>

          <h4 className="coupon-title">{c.description}</h4>

          <p className="coupon-offer">
            {c.discountType === "percentage"
              ? `${c.discountValue}% OFF`
              : `₹${c.discountValue} OFF`}
          </p>

          <p className="coupon-terms">
            Min Order ₹{c.minOrderAmount}
          </p>

          {c.maxDiscount > 0 && (
            <p className="coupon-terms">
              Max Discount ₹{c.maxDiscount}
            </p>
          )}

          {c.expiryDate && (
            <p className="coupon-expiry">
              Valid till {new Date(c.expiryDate).toLocaleDateString()}
            </p>
          )}

          <div className="coupon-actions">
            {appliedCoupon === c.code ? (
              <button className="btn-applied">
                ✓ Applied
              </button>
            ) : (
              <button
                className="btn-apply"
                onClick={() => applyCoupon(c.code)}
              >
                Apply
              </button>
            )}
          </div>
        </div>
      ))
  )}
</div>
                    </div>
                  </div>
                )}

              {/* Auto Category Coupon */}
{autoCoupon && (
  <div className="applied-coupon-banner">
    <span className="check-icon">✓</span>
    <span>Category Coupon "{autoCoupon}" Applied</span>
  </div>
)}

{/* Amount Coupon */}
{appliedCoupon && (
  <div className="applied-coupon-banner">
    <span className="check-icon">✓</span>
    <span>Amount Coupon "{appliedCoupon}" Applied</span>
    <button
      className="btn-remove-coupon"
      onClick={removeCoupon}
    >
      ✕
    </button>
  </div>
)}
              </div>

              {/* PRICE BREAKDOWN */}
<div className="price-breakdown">

  {/* Products Total */}
  <div className="price-row">
    <span className="label">
      Products Total
    </span>

    <span className="value">
      ₹{summary.total || 0}
    </span>
  </div>


  {/* Delivery Charge */}
  <div className="price-row">

    <span className="label">
      Delivery Charge
    </span>

    <span className="value">
    {!deliveryAvailable ? (
      <span className="text-danger">Not Available</span>
    ) : deliveryCharge === 0 ? (
      "FREE"
    ) : (
      `₹${deliveryCharge}`
    )}
  </span>

  </div>
{method === "cod" &&
  deliveryAvailable &&
  codExtraCharge > 0 && (
    <p className="cod-note">
      * Additional COD handling charge: ₹{codExtraCharge}
    </p>
)}


  {/* Gift Wrap Option */}

  {
    giftSetting?.giftWrapEnabled && (

      <div className="gift-wrap-box">

        <div className="gift-radio">

          <input
            type="checkbox"
            checked={giftOption}
            onChange={(e)=>
              setGiftOption(e.target.checked)
            }
          />


          <div className="gift-content">

            <h4>
              🎁 Add Gift Wrap
            </h4>

            <p>
              Make your gift special with a message
            </p>

          </div>


          <span>
            ₹{giftSetting.giftWrapCharge}
          </span>


        </div>



        {
          giftOption && (

            <textarea

              className="gift-message-input"

              placeholder="Write your gift message..."

              maxLength={
                giftSetting.maxMessageLength
              }

              value={giftMessage}

              onChange={(e)=>
                setGiftMessage(e.target.value)
              }

            />

          )
        }


      </div>

    )
  }



  {/* Gift Charge */}

  {
    giftCharge > 0 && (

      <div className="price-row">

        <span className="label">
          Gift Wrap Charge
        </span>


        <span className="value">
          ₹{giftCharge}
        </span>

      </div>

    )
  }




  {/* Coupon Discount */}

  {
    (categoryDiscount + amountDiscount) > 0 && (

      <div className="price-row discount">

        <span className="label">
          Coupon Discount
        </span>


        <span className="value">

          - ₹{
            Math.round(
              categoryDiscount + amountDiscount
            )
          }

        </span>


      </div>

    )
  }




  <p className="tax-info">
    Inclusive of all taxes
  </p>



  <div className="price-divider"></div>



  {/* Final Total */}

  <div className="price-row total">

    <span className="label">
      Total Amount
    </span>


    <span className="value total-value">

      ₹{
        Math.round(
          calculateFinalAmount()
        )
      }

    </span>


  </div>



</div>
              {/* SECURITY BADGE */}
              <div className="security-badge">
                <span className="lock-icon">🔒</span>
                <span>Secure checkout with SSL encryption</span>
              </div>

              {/* PLACE ORDER BUTTON */}
              <button
                className="btn-place-order"
                onClick={handlePayment}
                 disabled={loading || !deliveryAvailable}
              >
                {loading
                  ? "Processing..."
                  : method === "cod"
                  ? "PLACE ORDER"
                  : "PROCEED TO PAY"}
              </button>
            </div>
          </div>
        ) : (
          <div className="checkout-empty">
            <div className="empty-content">
              <div className="empty-icon">🛒</div>
              <h2>Your Cart is Empty</h2>
              <p>Add items to your cart to proceed with checkout</p>
              <button
                className="btn-continue-shopping"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>

      {/* UNAVAILABLE PRODUCTS MODAL */}
      {showUnavailableModal && (
        <div className="modal-overlay">
          <div className="modal-content unavailable-modal">
            <div className="modal-header warning">
              <div className="warning-icon">⚠️</div>
              <div>
                <h2>Products Not Deliverable</h2>
                <p>Some items can't be delivered to this address</p>
              </div>
            </div>

            <div className="blocked-products-list">
              {blockedProducts.map((item) => (
                <div className="blocked-item" key={item._id}>
                  <span className="blocked-indicator">✗</span>
                  <span className="product-name">{item.product.name}</span>
                  <span className="blocked-badge">Not Deliverable</span>
                </div>
              ))}
            </div>

            <div className="modal-info">
              <span className="info-icon">ℹ️</span>
              <p>You can remove these products or move them to your wishlist to continue</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setShowUnavailableModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-remove-products"
                onClick={removeUnavailableProducts}
              >
                Remove & Continue
              </button>
              <button
                className="btn-wishlist"
                onClick={moveToWishlistAndRemove}
              >
                ❤️ Move to Wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
