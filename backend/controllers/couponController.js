const Coupon = require("../models/Coupon.js");
const User = require("../models/User");
const {sendCouponNotification} = require("../utils/sendCoupon");

const Order = require( "../models/Order.js");

// ➕ CREATE COUPON (Admin)
 const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created",
      coupon
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 📃 GET ALL COUPONS (Admin)
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({})
      .populate("categories", "category")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      coupons,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getCouponByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const coupons = await Coupon.find({
      isActive: true,
    }).populate("categories", "category");

    const coupon = coupons.find((c) =>
      c.categories.some(
        (cat) => cat.category.toLowerCase() === category.toLowerCase()
      )
    );

    if (!coupon) {
      return res.json(null);
    }

    res.json(coupon);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ❌ DELETE COUPON
 const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Coupon deleted"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 🎯 APPLY COUPON (User side)
const applyCoupon = async (req, res) => {
  try {
    const {
      code,
      userId,
      cartTotal,
      categoryDiscount = 0,
    } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    }).populate("categories", "category");

    if (!coupon) {
      return res.json({
        success: false,
        message: "Invalid coupon",
      });
    }

    // Category coupon cannot be applied manually
    if (
      coupon.categories &&
      coupon.categories.length > 0
    ) {
      return res.json({
        success: false,
        message: "Category coupon is auto applied",
      });
    }

    // Expiry check
    if (
      coupon.expiryDate &&
      new Date() > coupon.expiryDate
    ) {
      return res.json({
        success: false,
        message: "Coupon expired",
      });
    }

    // Minimum order
    if (cartTotal < coupon.minOrderAmount) {
      return res.json({
        success: false,
        message: `Minimum order ₹${coupon.minOrderAmount}`,
      });
    }

    // First order
    if (coupon.firstOrderOnly) {
      const orders = await Order.find({
        user: userId,
      });

      if (orders.length > 0) {
        return res.json({
          success: false,
          message: "Only for first order users",
        });
      }
    }

    let amountDiscount = 0;

    if (coupon.discountType === "percentage") {
      amountDiscount =
        (cartTotal * coupon.discountValue) / 100;

      if (
        coupon.maxDiscount &&
        amountDiscount > coupon.maxDiscount
      ) {
        amountDiscount = coupon.maxDiscount;
      }
    } else {
      amountDiscount = coupon.discountValue;
    }

    const totalDiscount =
      Number(categoryDiscount) +
      Number(amountDiscount);

    return res.json({
      success: true,
       couponCode: coupon.code,   // ✅ Must be here
       categoryDiscount: Number(categoryDiscount),
      amountDiscount,
      totalDiscount,

      finalAmount: cartTotal - totalDiscount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// 🔄 TOGGLE COUPON (Active / Block)
const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    // 🔥 toggle logic
    coupon.isActive = !coupon.isActive;

    await coupon.save();

    res.json({
      success: true,
      message: "Coupon status updated",
      coupon
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const sendFirstCoupon = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔍 first order check
    const orders = await Order.find({ user: userId });

    if (orders.length > 0) {
      return res.json({
        success: false,
        message: "Only for first order users"
      });
    }

    const user = await User.findById(userId);

    // 🔥 FIX: coupon return ஆகும்
    const coupon = await sendCouponNotification(user);

    if (!coupon) {
      return res.status(500).json({
        success: false,
        message: "Coupon send failed"
      });
    }

    res.json({
      success: true,
      message: "Coupon sent 🎉",
      coupon: coupon.code // ✅ safe
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



const sendSelectedCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    console.log("CODE:", code); // 👈 debug

    const user = await User.findById(userId);
    const coupon = await Coupon.findOne({ code });

    console.log("COUPON:", coupon); // 👈 debug

    if (!coupon) {
      return res.json({
        success: false,
        message: "Coupon not found"
      });
    }

    await sendCouponNotification(user, coupon);

    res.json({
      success: true,
      message: "Coupon sent 🎉"
    });

  } catch (err) {
    console.log("SEND ERROR:", err); // 👈 IMPORTANT
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
const updateCoupon = async (req, res) => {
  try {
    const id = req.params.id;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      req.body,
      { new: true } // return updated data
    );

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updatedCoupon
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


const autoCategoryCoupon = async (req, res) => {
  try {
    const { items, cartTotal } = req.body;

    const coupons = await Coupon.find({
      isActive: true,
    }).populate("categories", "category");
    

    // Category coupons only
    const categoryCoupons = coupons.filter(
      (coupon) =>
        coupon.categories && coupon.categories.length > 0
    );

    for (const coupon of categoryCoupons) {
      let matched = false;

      for (const item of items) {
        const productCategory = item.product?.category;

        const check = coupon.categories.some(
          (cat) =>
            cat.category === productCategory
        );

        if (check) {
          matched = true;
          break;
        }
      }

      if (matched) {
        
        let discount = 0;

        if (coupon.discountType === "percentage") {
          discount =
            (cartTotal * coupon.discountValue) / 100;

          if (
            coupon.maxDiscount &&
            discount > coupon.maxDiscount
          ) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }

        return res.json({
          success: true,
          couponCode: coupon.code,
          discount,
          finalAmount: cartTotal - discount,
        });
      }
    }

    return res.json({
      success: false,
      message: "No category coupon found",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports ={
    createCoupon,
    getCoupons,
    applyCoupon,
    deleteCoupon,
    toggleCoupon,
    sendFirstCoupon,
    sendSelectedCoupon,    
    updateCoupon,
    getCouponByCategory,
    autoCategoryCoupon,
};