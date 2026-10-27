const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");



// 🔥 COMMON CALCULATION FUNCTION
const calculateSummary = (items) => {
  let subtotal = 0;
  let discount = 0;

  items.forEach((item) => {
    const qty = item.quantity || 1;

    const original = item.originalPrice || 0;
    const final = item.price || 0;

    subtotal += original * qty;

    discount += (original - final) * qty;
  });


  const total =
    items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

  return {
    subtotal,
    discount,
    gst: 0,
    total,
  };
};

// 🔥 ADD TO CART
const addToCart = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      name,
      image,
      price,
      originalPrice,
      discountType,
      discountValue,
      gst,
      size,
      frameSize,
      variant,
      message,
        customName, // ✅ ADD THIS
      isCustomized,
    } = req.body;

    // ✅ uploaded extra images
    const uploadedImages =
      req.files?.map((file) => file.filename) || [];

    console.log("REQ BODY:", req.body);

    let cart = await Cart.findOne({
      user: req.user.id,
    });

    // ✅ ITEM CHECK
const itemCheck = (item) => {
  const isMatch =
    item.product.toString() === productId &&
    (item.size || "") === (size || frameSize || "") &&
    (item.variant || "") === (variant || "") &&
    (item.message || "") === (message || "") &&
    (item.customName || "") === (customName || "");

  console.log("MATCH:", isMatch);

  return isMatch;
};

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,

        items: [
          {
            product: productId,
            quantity: Number(quantity),

            name,
            image,
            price,
            originalPrice,

            discountType,
            discountValue,
            gst,

            size: size || frameSize,
            variant,

            // ✅ customization
            message,
            customName,

            extraImages: uploadedImages,

            isCustomized:
              isCustomized === "true" ||
              isCustomized === true,
          },
          
        ],
      });
    } else {
      const itemIndex = cart.items.findIndex(itemCheck);
      

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity +=
          Number(quantity);

          await cart.save();

      } else {
        cart.items.push({
  product: productId,
  quantity: Number(quantity),

  name,
  image,
  price,
  originalPrice,

  discountType,
  discountValue,
  gst,

  size: size || frameSize,
  variant,

  // ✅ customization
  message,
  customName,

  extraImages: uploadedImages,

  isCustomized:
    isCustomized === "true" ||
    isCustomized === true,
});
      }

      await cart.save();
      console.log("Cart Items After Save:");
cart.items.forEach((item) => {
  console.log(item.name, item.quantity);
});
      
    }

    const summary = calculateSummary(
      cart.items
    );

    res.json({
      items: cart.items,
      summary,
    });
  } catch (err) {
    console.error(
      "ADD TO CART ERROR:",
      err
    );

    res
      .status(500)
      .json({ message: "Server Error" });
  }
};

// 🔥 GET CART
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.id,
    }).populate({
      path: "items.product",
      select: "name locations category",
    });

    if (!cart) {
      return res.json({
        items: [],
        summary: {
          subtotal: 0,
          discount: 0,
          gst: 0,
          total: 0,
        },
      });
    }

    // 👇 இதை இங்கே add பண்ணுங்க
    console.log("CART ITEMS:");
    console.log(JSON.stringify(cart.items, null, 2));

    const summary = calculateSummary(cart.items);

    res.json({
      items: cart.items,
      summary,
    });
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔥 REMOVE ITEM
const removeFromCart = async (
  req,
  res
) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.json({
        items: [],
        summary: {
          subtotal: 0,
          discount: 0,
          gst: 0,
          total: 0,
        },
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item._id.toString() !==
        req.params.id
    );

    await cart.save();

    const summary = calculateSummary(
      cart.items
    );

    res.json({
      items: cart.items,
      summary,
    });
  } catch (err) {
    console.error(
      "REMOVE CART ERROR:",
      err
    );

    res
      .status(500)
      .json({ message: "Server Error" });
  }
};

const moveUndeliverableProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productIds } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    for (const productId of productIds) {
      // Find the cart item
      const cartItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (!cartItem) continue;

      // Check if already exists in wishlist
      const already = await Wishlist.findOne({
        userId: userId,
        productId: productId,
      });

      if (!already) {
        await Wishlist.create({
          userId: userId,
          productId: productId,

          name: cartItem.name,
          image: cartItem.image,

          price: cartItem.price,
          originalPrice: cartItem.originalPrice,

          discountType: cartItem.discountType,
          discountValue: cartItem.discountValue,

          size: cartItem.size,
          variant: cartItem.variant,

          stockStatus: "In Stock",
        });
      }

      // Remove from cart
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
    }

    await cart.save();

    res.json({
      success: true,
      message: "Products moved to wishlist successfully",
    });
  } catch (err) {
    console.error("MOVE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  moveUndeliverableProducts
};