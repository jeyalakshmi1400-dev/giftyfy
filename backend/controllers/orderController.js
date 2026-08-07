const Order = require("../models/Order");
const Cart = require("../models/Cart");
const DeliveryPartner = require("../models/DeliveryPartner");
const OrderRequest = require("../models/OrderRequest");
const { getPartnersByPincode } = require("./deliveryPartnerController");
const Coupon = require("../models/coupon");
const sendCouponNotification = require("../utils/sendCoupon");
const User = require("../models/User");
const Product = require("../models/Product");
const Notification = require("../models/Notification");

const Review = require("../models/Review");

const Payment = require("../models/Payment");

// =======================
// PLACE ORDER
// =======================
const placeOrder = async (req, res) => {

  try {

  const {
  name,              // ✅ Add
  address,
  phone,
  pincode,
  couponCode,
  paymentMethod,
  paymentId,
  buyNowItem,
   discount: frontendDiscount,
  totalAmount: frontendTotal,
} = req.body;
console.log("REQ BODY =>", req.body);
    if (!address || !phone || !pincode) {

      return res.status(400).json({
        message:
          "Address, phone and pincode required"
      });

    }

    let items = [];

// =====================================
// BUY NOW
// =====================================
if (buyNowItem) {

  const product = await Product.findById(
    buyNowItem.productId
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  items = [
    {
      ...buyNowItem,
      product
    }
  ];
}

// =====================================
// NORMAL CART
// =====================================
else {

  const cart = await Cart.findOne({
    user: req.user.id
  }).populate("items.product");

  if (!cart || cart.items.length === 0) {

    return res.status(400).json({
      message: "Cart is empty"
    });

  }

  items = cart.items;
}

    // ✅ DELIVERY CHECK
    for (let item of items) {

      const product = item.product;

      if (!product) continue;

      const allPincodes =
        product.locations?.flatMap(
          (loc) => loc.pincode
        ) || [];

      if (allPincodes.length === 0)
        continue;

      if (
        !allPincodes.includes(
          Number(pincode)
        )
      ) {

        return res.status(400).json({
          message:
            `${product.name} is not deliverable to this pincode`
        });

      }

    }

    // 💰 TOTAL
    let total = 0;

    for (let item of items) {

      total +=
        (item.price || 0) *
        (item.quantity || 1);

    }

    // 🎁 COUPON
    let discount = Number(frontendDiscount || 0);

    if (couponCode) {

      const coupon =
        await Coupon.findOne({
          code:
            couponCode.toUpperCase(),
          isActive: true
        });

      if (!coupon) {

        return res.status(400).json({
          message: "Invalid coupon"
        });

      }

      if (
        coupon.discountType ===
        "percentage"
      ) {

        discount =
          (total *
            coupon.discountValue) /
          100;

      } else {

        discount =
          coupon.discountValue;

      }

    }

   const finalAmount = Number(frontendTotal || Math.max(total - discount, 0));
    // 🧾 CREATE ORDER
    const order = await Order.create({

      user: req.user.id,
      name,  
      

items: items.map((item) => {

  const product = item.product;
  console.log("PRODUCT GST CHECK 👉", {
  name: product.name,
  category: product.category,
  gst: product.gst,
  price: product.finalPrice,
  variants: product.variants
});


  const sellingPrice =
    item.price || product.finalPrice || product.price;


  const gstPercent =
    product.gst || 0;


  const taxablePrice =
    Number(
      (
        sellingPrice /
        (1 + gstPercent / 100)
      ).toFixed(2)
    );


  const gstAmount =
    Number(
      (
        sellingPrice - taxablePrice
      ).toFixed(2)
    );


  return {

    product: product._id,

    quantity:
      item.quantity || 1,


    name:
      item.name || product.name,


    // GST INCLUDED PRICE
    price:
      sellingPrice,


    // GST DETAILS
    gst:
      gstPercent,


    taxablePrice,

    gstAmount,


    purchasePrice:
      product.purchasePrice || 0,


    originalPrice:
      item.originalPrice ||
      product.price,


    image:
      item.image ||
      product.image?.[0],


    size:
      item.size || null,


    variant:
      item.variant || null,


    message:
      item.message || "",


    customName:
      item.customName || "",


    extraImages:
      item.extraImages || [],


    isCustomized:
      item.isCustomized || false,

  };

}),

      address,
      phone,

      deliveryPincode:
        pincode,

      paymentMethod:
        paymentMethod || "COD",

    paymentStatus:
    paymentMethod === "COD"
      ? "Pending"
      : "Paid",


      subtotal: total,

      discount,

      totalAmount:
        finalAmount,

      status: "Pending",

customizationStatus:
  items.some(
    (item) => item.isCustomized
  )

    ? "Requested"

    : "Not Required"
    
    });

    // ✅ STOCK UPDATE
    for (const item of items) {

      const product =
        await Product.findById(
          item.product._id
        );

      if (!product) continue;

      // 👗 DRESS PRODUCT
      if (
        product.category ===
        "Dress"
      ) {

        const variantIndex =
          product.variants.findIndex(
            (v) =>
              v.color ===
              item.variant
          );

        if (variantIndex !== -1) {

          const sizeIndex =
            product.variants[
              variantIndex
            ].sizes.findIndex(
              (s) =>
                s.size ===
                item.size
            );

          if (sizeIndex !== -1) {

            product.variants[
              variantIndex
            ].sizes[
              sizeIndex
            ].quantity -=
              item.quantity;

          }

        }

      }

      // 📦 NORMAL PRODUCT
      else {

        product.quantity -=
          item.quantity;

      }

      await product.save();

    }

   // 🧹 CLEAR CART ONLY NORMAL ORDER
if (!buyNowItem) {

  const cart = await Cart.findOne({
    user: req.user.id
  });

  if (cart) {
    cart.items = [];
    await cart.save();
  }

}
    await Payment.create({

  user: req.user.id,

  order: order._id,

  amount: finalAmount,

  method:
    paymentMethod || "COD",

  razorpay_payment_id:
    paymentId || "",

  status:
    paymentMethod === "COD"
      ? "Pending"
      : "Success"

});

    res.status(201).json({

      message:
        "Order placed successfully",

      order,

      finalAmount

    });

  } catch (error) {

    console.log(
      "ORDER ERROR 👉",
      error
    );

    res.status(500).json({

      message: "Server error",

      error: error.message

    });

  }

};
// =======================
// GET USER ORDERS
// =======================
const getMyOrders = async (req, res) => {
  try {

    const partnerId = req.user?._id;

    if (!partnerId) {
      return res.status(401).json({ message: "Partner not found" });
    }

    const orders = await Order.find({
      deliveryPartner: partnerId
    })
      .populate("user")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {

  try {

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {

      return res.status(404).json({
        message: "Order not found"
      });

    }

    // ✅ OWNER CHECK
    if (
      order.user.toString() !==
      req.user.id
    ) {

      return res.status(401).json({
        message: "Unauthorized"
      });

    }

    // ✅ ONLY PENDING / CONFIRMED
    // =========================
// ✅ CUSTOMIZED CANCEL BLOCK
// =========================

const hasCustomized =
  order.items.some(
    (item) => item.isCustomized
  );

if (
  hasCustomized &&
  order.customizationStatus ===
    "In Progress"
) {

  return res.status(400).json({
    message:
      "Customization already started. Order cannot be cancelled."
  });

}

    // =========================
    // ✅ RETURN PRODUCT STOCK
    // =========================

  for (const item of order.items) {

  const product =
    await Product.findById(
      item.product
    );

  if (product) {

    // =========================
    // VARIANT + SIZE STOCK
    // =========================

    if (
      item.size &&
      item.variant
    ) {

      const variant =
        product.variants.find(
          (v) =>
            v.color === item.variant
        );

      if (variant) {

        const sizeObj =
          variant.sizes.find(
            (s) =>
              s.size === item.size
          );

        if (sizeObj) {

          sizeObj.quantity +=
            item.quantity;

        }

      }

    }

    // =========================
    // NORMAL PRODUCT STOCK
    // =========================

    else {

      product.quantity +=
        item.quantity;

    }

    await product.save();

  }

}

    // =========================
    // ✅ CANCEL ORDER
    // =========================

    order.status = "Cancelled";

    await order.save();

    res.json({
      success: true,
      message:
        "Order cancelled successfully"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({      message: error.message
    });

  }

};

const getuserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "User not found" });
    }

    const orders = await Order.find({
      user: userId
    })
      .populate("user")
      .populate("items.product")
      .populate(
  "deliveryPartner",
  "name phone email vehicleType vehicleNumber photo"
)
      .sort({ createdAt: -1 });
const formattedOrders = orders.map((order) => {
  const obj = order.toObject();

  // ✅ முதலில் Order-ல save ஆன name-ஐ use பண்ணும்
  obj.name =
    obj.name ||
    obj.user?.name ||
    obj.user?.firstName ||
    "Customer";

  obj.phone =
    obj.phone ||
    obj.user?.phone;

  if (obj.status !== "Out for Delivery") {
    obj.otp = "";
  }

  return obj;
});

res.json(formattedOrders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const checkDelivery = async (cartItems, userPincode) => {
  // 🔥 எல்லா productIds எடு
  const productIds = cartItems.map(item => item.product);

  // 🔥 ஒரே queryல எல்லா products fetch
  const products = await Product.find({
    _id: { $in: productIds }
  });

  for (let item of cartItems) {
    const product = products.find(
      p => p._id.toString() === item.product.toString()
    );

    if (!product) continue;

    // 🔥 productல இருந்து pincodes எடு
    const allPincodes =
      product.locations?.flatMap(loc => loc.pincode) || [];

    // 👉 restriction இல்லனா allow
    if (allPincodes.length === 0) continue;

    // ❌ match இல்லனா block
    if (!allPincodes.includes(userPincode)) {
      return {
        success: false,
        itemName: product.name
      };
    }
  }

  return { success: true };
};


// =======================
// ADMIN – ALL ORDERS
// =======================
const getAllOrders = async (req, res) => {

  try {

    const orders = await Order.find()

      .populate("user")

      // ✅ DELIVERY PARTNER POPULATE
      .populate(
        "deliveryPartner",
        "name email phone  totalWithdrawn totalDeliveredOrders"
      )

      .populate({
        path: "items.product",
        model: "Product"
      })

      .sort({ createdAt: -1 });

    res.json({ orders });

  } catch (error) {

    console.log(
      "GET ALL ORDERS ERROR 👉",
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};

// =======================
// ADMIN – UPDATE STATUS
// =======================


const updateOrderStatus = async (req, res) => {
  try {
    const { status, customizationStatus } = req.body;

    console.log("BODY =>", req.body);

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ===========================
    // UPDATE CUSTOMIZATION STATUS
    // ===========================
    if (customizationStatus) {
      const validFlow = {
        Requested: ["In Progress"],
        "In Progress": ["Completed"],
      };

      if (
        validFlow[order.customizationStatus] &&
        !validFlow[order.customizationStatus].includes(customizationStatus)
      ) {
        return res.status(400).json({
          message: "Invalid customization flow",
        });
      }

      order.customizationStatus = customizationStatus;
    }

    // ===========================
    // UPDATE ORDER STATUS
    // ===========================
    if (status) {
      order.status = status;

      if (status === "Delivered") {
        order.deliveredAt = new Date();
      }
    }

    console.log("Before Save:", order.status);

    await order.save();

    const updatedOrder = await Order.findById(order._id);

    console.log("After Save:", updatedOrder.status);

    // ===========================
    // SEND DELIVERY REQUEST
    // ===========================
    if (updatedOrder.status === "Shipped") {
      const partners = await DeliveryPartner.find({
        pincode: String(updatedOrder.deliveryPincode),
        isApproved: true,
      });

      console.log("FOUND PARTNERS:", partners.length);

      for (const partner of partners) {
        const existingRequest = await OrderRequest.findOne({
          order: updatedOrder._id,
          deliveryPartner: partner._id,
        });

        if (!existingRequest) {
          await OrderRequest.create({
            order: updatedOrder._id,
            deliveryPartner: partner._id,
          });
        }

        const existingNotification = await Notification.findOne({
          order: updatedOrder._id,
          partner: partner._id,
          hidden: false,
        });

        if (!existingNotification) {
          await Notification.create({
            partner: partner._id,
            order: updatedOrder._id,
            message: `New delivery request for pincode ${updatedOrder.deliveryPincode}`,
          });
        }
      }
    }

    return res.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.log("STATUS UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =======================
// ADMIN – MANUAL ASSIGN
// =======================
const assignDeliveryPartner = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🚫 Already accepted / started / delivered -> don't reassign
    if (
      order.deliveryStatus === "Accepted" ||
      order.status === "Out for Delivery" ||
      order.status === "Delivered"
    ) {
      return res.status(400).json({
        message: "This order cannot be reassigned."
      });
    }

    // 🚫 If partner rejected earlier
    if (order.deliveryStatus === "Rejected") {
      return res.status(400).json({
        message: "Delivery partner rejected this order."
      });
    }

    const partner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!partner) {
      return res.status(404).json({
        message: "Delivery partner not found"
      });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.status = "Shipped"; // or Assigned (your project logic)
    order.deliveryStatus = "Assigned";

    await order.save();

    res.json({
      message: "Delivery partner assigned successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// 🚚 DELIVERY PARTNER ACCEPT ORDER
const acceptOrder = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔥 FIX HERE
const partnerId = req.partner?._id || req.partner?.id;


    if (!partnerId) {
      return res.status(400).json({
        message: "Partner not found in request"
      });
    }

    // already assigned
    if (order.deliveryPartner) {
      return res.status(400).json({
        message: "Order already assigned"
      });
    }

    order.deliveryPartner = partnerId;
    
    order.status = "Assigned";

    await order.save();

    // hide notifications
    await Notification.updateMany(
      { order: order._id },
      { hidden: true }
    );

    res.json({
      message: "Order accepted successfully",
      order
    });

  } catch (error) {

    console.log("ACCEPT ERROR 👉", error);

    res.status(500).json({
      message: error.message
    });

  }

};


const acceptReturnOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res.status(400).json({ message: "Partner not found in request" });
    }

    console.log("ORDER BEFORE 👉", order.deliveryPartner);
    console.log("RETURN PARTNER 👉", partnerId);

    // 🔥 FORCE UPDATE ALL RELATED FIELDS
    order.set({
      returnDeliveryPartner: partnerId,
      deliveryPartner: partnerId, // (optional but recommended if same partner handles return)
      returnStatus: "Pickup Assigned",
      deliveryCancelled: false,
      deliveryCancelReason: null,
    });

    await order.save();

    await Notification.updateMany(
      {
        order: order._id,
        type: "RETURN_PICKUP",
      },
      {
        hidden: true,
      }
    );

    return res.json({
      success: true,
      message: "Return accepted successfully",
      order,
    });

  } catch (error) {
    console.log("RETURN ERROR 👉", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🚚 DELIVERY STATUS UPDATE
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ✅ PARTNER
    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res.status(401).json({
        message: "Partner not found",
      });
    }

    // ✅ CHECK ASSIGNED PARTNER
    if (
      !order.deliveryPartner ||
      order.deliveryPartner.toString() !== partnerId.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // ✅ VALID FLOW
    const validFlow = {
      Assigned: ["Out for Delivery"],
    };

    if (
      validFlow[order.status] &&
      !validFlow[order.status].includes(status)
    ) {
      return res.status(400).json({
        message: `Cannot change ${order.status} → ${status}`,
      });
    }

    // ✅ OTP GENERATE
    const oldStatus = order.status;

    if (status === "Out for Delivery") {
      const otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      order.otp = otp;
      order.otpVerified = false;

      console.log("DELIVERY OTP =>", otp);
    }

    order.status = status;

    // =========================
    // DELIVERY COMPLETED
    // =========================
    if (
      status === "Delivered" &&
      oldStatus !== "Delivered"
    ) {
      order.deliveredAt = new Date();

      // ✅ COD ORDER
      if (order.paymentMethod === "COD") {
        order.codStatus = "Collected";
      }

      const partner = await DeliveryPartner.findById(partnerId);

      if (partner) {
        // ✅ Only Count Orders
        partner.totalDeliveredOrders =
          Number(partner.totalDeliveredOrders || 0) + 1;

        await partner.save();
      }
    }

    await order.save();

    res.json({
      success: true,
      message: "Delivery status updated",
      order,
    });

  } catch (error) {
    console.log("DELIVERY STATUS ERROR 👉", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// 💰 ADMIN PROCESS REFUND
const processRefund = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.refundStatus !== "Requested") {
      return res.status(400).json({ message: "No refund request found" });
    }

    order.refundStatus = "Processed";
    await order.save();

    res.json({
      message: "Refund processed successfully",
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestReturn = async (req, res) => {
  try {

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        message: "Return reason required"
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        message: "Return allowed only after delivery"
      });
    }

    // ✅ FIX HERE (important safety)
    order.returnRequested = true;
    order.returnReason = reason;
    order.returnStatus = "Requested";

    // 🔥 IMPORTANT FIX (prevents future errors)
    order.refundStatus = "Pending";

    await order.save();

    res.json({
      success: true,
      message: "Return request submitted"
    });

  } catch (error) {
    console.log("RETURN ERROR 👉", error);
    res.status(500).json({
      message: error.message
    });
  }
};


const getReturnOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      returnRequested: true
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const assignReturnPickup = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // find partners with same pincode
    const partners = await DeliveryPartner.find({
      pincode: order.deliveryPincode,
      isApproved: true,
    });

    // send notifications
    for (const partner of partners) {

      await Notification.create({
        partner: partner._id,
        order: order._id,
        type: "RETURN_PICKUP",
        message: `Return pickup request for pincode ${order.deliveryPincode}`,
      });

    }

    order.returnStatus = "Pickup Assigned";

    await order.save();

    res.json({
      success: true,
      message: "Pickup assigned"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


// =======================
// GET RETURN PICKUPS
// =======================

const getReturnPickupOrders = async (req, res) => {

  try {

    const partnerId = req.partner._id;

    const orders = await Order.find({

      deliveryPartner: partnerId,

      // ✅ BOTH STATUS FETCH
      returnStatus: {
        $in: [
          "Pickup Assigned",
          "Picked Up",
          "Returned"
        ]
      }

    })
    .populate("user")
    .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

// =======================
// PICKED UP
// =======================

const markReturnPickedUp = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.returnStatus = "Picked Up";

    // ✅ No wallet update for Monthly Salary Model

    await order.save();

    res.json({
      success: true,
      message: "Return picked up successfully",
    });

  } catch (err) {

    console.log("RETURN PICKUP ERROR 👉", err);

    res.status(500).json({
      message: err.message,
    });

  }
};

const refundReturnedOrder = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // ✅ only picked up orders
    if (order.returnStatus !== "Picked Up") {

      return res.status(400).json({
        message: "Return not picked up yet"
      });

    }

    // ✅ update refund
    order.returnStatus = "Returned";

    order.refundStatus = "Processed";

    order.refundAmount =
      order.totalAmount;

    await order.save();

    res.json({
      success: true,
      message: "Refund processed successfully",
      order
    });

  } catch (error) {

    console.log(
      "REFUND RETURN ERROR 👉",
      error
    );

    res.status(500).json({
      message: error.message
    });

  }

};


const submitReview = async (req, res) => {

  try {

    const { rating, comment } = req.body;

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {

      return res.status(404).json({
        message: "Order not found",
      });

    }

    // ✅ only delivered orders
    if (order.status !== "Delivered") {

      return res.status(400).json({
        message: "Order not delivered yet",
      });

    }

    // ✅ only owner can review
    if (
      order.user.toString() !==
      req.user.id.toString()
    ) {

      return res.status(401).json({
        message: "Unauthorized",
      });

    }

    // ✅ already reviewed
    const alreadyReviewed =
      await Review.findOne({
        order: order._id,
      });

    if (alreadyReviewed) {

      return res.status(400).json({
        message: "Already reviewed",
      });

    }

    // ✅ create review for each product
    for (const item of order.items) {

      await Review.create({

        user: req.user.id,

        product: item.product,

        order: order._id,

        rating,

        comment,

      });

    }

    res.json({

      success: true,

      message: "Review submitted",

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }


};
const delayOrder = async (req, res) => {
  try {
    const { reason,  rescheduleDate, rescheduleTime } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.isDelayed = true;
    order.delayReason = reason;
order.rescheduleDate = rescheduleDate;
order.rescheduleTime = rescheduleTime;
    await order.save();

    res.json({
      success: true,
      message: "Order delayed successfully",
      order,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const cancelOrderByDelivery = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.status = "Cancelled";

    order.deliveryCancelled = true;
    order.deliveryCancelReason = reason;
    order.deliveryCancelledAt = new Date();
    order.status = "Cancelled";

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


// =======================
// VERIFY DELIVERY OTP
// =======================

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!order.otp) {
      return res.status(400).json({
        success: false,
        message: "OTP not generated yet",
      });
    }

    if (order.otpVerified) {
      return res.status(400).json({
        success: false,
        message: "OTP already verified",
      });
    }

    if (String(order.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    order.otpVerified = true;
    order.deliveryStage = "OTP_VERIFIED";


    await order.save();

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.log("VERIFY OTP ERROR", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




const completeDelivery = async (req, res) => {
  try {
    const {
      deliveryMethod,
      codCollectionMethod,
      deliveryNotes,
      amountReceived,
    } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const partnerId = req.partner?._id;

    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (!order.otpVerified) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified",
      });
    }

    if (!deliveryMethod) {
      return res.status(400).json({
        success: false,
        message: "Delivery method required",
      });
    }

    // ================= COD CHECK =================
    if (order.paymentMethod === "COD") {

      if (!codCollectionMethod) {
        return res.status(400).json({
          success: false,
          message: "Select COD method",
        });
      }

      // ⚠️ IMPORTANT FIX HERE
      const received = Number(amountReceived || 0);
      const total = Number(order.totalAmount || 0);

      if (received !== total) {
        return res.status(400).json({
          success: false,
          message: `Collected amount mismatch: expected ₹${total}, got ₹${received}`,
        });
      }

      order.codStatus = "Collected";
      order.codCollectionInfo = {
        collectedBy: partnerId,
        amount: received,
        collectedAt: new Date(),
      };
    }

    order.deliveryMethod = deliveryMethod;
    order.codCollectionMethod = codCollectionMethod || "";
    order.deliveryNotes = deliveryNotes || "";
order.deliveryStage = "DELIVERED";
    order.status = "Delivered";
    order.deliveredAt = new Date();
    order.deliveryPartner = partnerId;

    order.otp = "";
order.otpVerified = false;

    await order.save();

    return res.json({
      success: true,
      message: "Order delivered successfully",
      order,
    });

  } catch (error) {
    console.log("COMPLETE DELIVERY ERROR", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkStatusUpdate = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    const orders = await Order.find({
      _id: { $in: orderIds },
    });

    // Validation
    for (const order of orders) {
      if (
        order.status === "Out for Delivery" &&
        status === "Assigned"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Out for Delivery orders cannot be changed back to Assigned.",
        });
      }

      if (order.status === "Delivered") {
        return res.status(400).json({
          success: false,
          message: "Delivered orders cannot be updated.",
        });
      }
    }

    // ✅ Update each order individually
    for (const order of orders) {
      order.status = status;

      // Generate OTP only when moving to Out for Delivery
      if (status === "Out for Delivery") {
        const otp = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        order.otp = otp;
        order.otpRequested = true;
        order.otpVerified = false;
        order.deliveryStage = "OTP_PENDING";

        console.log(
          `Order ${order._id} OTP => ${otp}`
        );

        // 👉 Optional: Send SMS / WhatsApp OTP here
      }

      await order.save();
    }

    res.json({
      success: true,
      message: "Status Updated Successfully",
    });

  } catch (err) {
    console.log("BULK STATUS ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  assignDeliveryPartner,
  acceptOrder,
  updateDeliveryStatus,
  cancelOrder,
  processRefund,
  getuserOrders,
  requestReturn,
  getReturnOrders,
  assignReturnPickup,
  getReturnPickupOrders,
markReturnPickedUp,
refundReturnedOrder, 
submitReview,
delayOrder,
cancelOrderByDelivery,
verifyOtp,
completeDelivery ,
acceptReturnOrder,
bulkStatusUpdate ,
// ✅ ADD THIS
};