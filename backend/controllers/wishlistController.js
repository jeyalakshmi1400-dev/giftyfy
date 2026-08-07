const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const Cart = require("../models/Cart");




// ➕ ADD TO WISHLIST
exports.addToWishlist = async (req, res) => {
  try {
    const { userId, productId, size, variant } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ CHECK DUPLICATE
    const exists = await Wishlist.findOne({
      userId,
      productId,
      size,
      variant,
    });

    if (exists) {
      return res.json({ message: "Already in wishlist" });
    }

    const product = await Product.findById(productId);
 

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ==============================
// 🧠 STEP 1: BASE PRICE & STOCK
// ==============================

let basePrice = product.price || 0;
let quantity = product.quantity || 0;

let selectedVariant = null;
let selectedSize = null;

// User selected variant
if (variant && product.variants?.length > 0) {
  selectedVariant = product.variants.find(
    (v) => v.color?.toLowerCase() === variant.toLowerCase()
  );
}

// User selected size
if (selectedVariant && size) {
  selectedSize = selectedVariant.sizes?.find(
    (s) => s.size?.toLowerCase() === size.toLowerCase()
  );
}

// No variant selected → First Variant
if (!selectedVariant && product.variants?.length > 0) {
  selectedVariant = product.variants[0];
}

// No size selected → First Size
if (!selectedSize && selectedVariant?.sizes?.length > 0) {
  selectedSize = selectedVariant.sizes[0];
}

// Apply first size price
if (selectedSize) {
  basePrice = selectedSize.price;
  quantity = selectedSize.quantity;
}
// ==============================
// 🖼 IMAGE LOGIC
// ==============================

let image = "";

// Normal product image
if (product.image && product.image.length > 0) {
  image = product.image[0];
}

// Selected color image
if (selectedVariant && selectedVariant.images?.length > 0) {
  image = selectedVariant.images[0];
}

// Color select செய்யலனா → முதல் variant image
if (!image && product.variants?.length > 0) {
  const firstVariant = product.variants[0];

  if (firstVariant.images?.length > 0) {
    image = firstVariant.images[0];
  }
}
    // ==============================
    // 💰 STEP 2: DISCOUNT APPLY
    // ==============================

    let originalPrice = basePrice;
    let price = basePrice;

    if ((product.discountType || "").toLowerCase() === "percentage") {
      price =
        basePrice -
        (basePrice * (product.discountValue || 0)) / 100;
    } else if ((product.discountType || "").toLowerCase() === "flat") {
      price = basePrice - (product.discountValue || 0);
    }

    // ==============================
    // 💾 SAVE
    // ==============================

    const newItem = new Wishlist({
      userId,
      productId,
      name: product.name,
      image,

      price,
      originalPrice,
      discountType: product.discountType || "",
      discountValue: product.discountValue || 0,

      size,
      variant,
      sizeQuantity: quantity,

      stockStatus: quantity > 0 ? "In Stock" : "Out of Stock",
      category: product.category,
    });

    await newItem.save();

    res.json({ message: "Added to wishlist", newItem });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};


// 📥 GET WISHLIST
exports.getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ userId: req.params.userId });

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);

        let stock = 0;

        if (product?.sizes?.length) {
          const sizeData = product.sizes.find(
            (s) => s.size === item.size
          );
          stock = sizeData?.quantity || 0;
        } else {
          stock = product?.quantity || 0;
        }

        return {
          ...item._doc,
          stockStatus: stock > 0 ? "In Stock" : "Out of Stock",
        };
      })
    );

    res.json(updatedItems);

  } catch (err) {
    res.status(500).json(err);
  }
};



// ❌ REMOVE FROM WISHLIST
exports.removeWishlistItem = async (req, res) => {
  try {
    await Wishlist.findByIdAndDelete(req.params.id);
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    res.status(500).json(err);
  }
};



// 🔁 MOVE TO CART (SMART LOGIC)
exports.moveToCart = async (req, res) => {
  try {
    console.log("🔥 MOVE API HIT");

    const { wishlistId } = req.body;

    const item = await Wishlist.findById(wishlistId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    console.log("👉 MOVING ITEM:", item);

    // ✅ FORCE CREATE (no condition)
    await Cart.create({
      userId: item.userId,
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price || 0,
      quantity: 1,
      size: item.size || "",
      variant: item.variant || "",
    });

    console.log("✅ ADDED TO CART");

    // ✅ DELETE AFTER SUCCESS
    await Wishlist.findByIdAndDelete(wishlistId);

    res.json({ message: "Moved to cart" });

  } catch (err) {
    console.log("❌ MOVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.moveToCart = async (req, res) => {
  try {
    console.log("🔥 MOVE API HIT");

    const { wishlistId } = req.body;

    const item = await Wishlist.findById(wishlistId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    console.log("👉 MOVING ITEM:", item);

    // ✅ CREATE CART DATA
    const cartData = {
      userId: item.userId,
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price || 0,
      
      quantity: 1,
    };

    // ✅ ONLY FOR DRESS
    if (item.category === "Dress") {
      cartData.size = item.size || "M";
      cartData.variant = item.variant || "Default";
    }

    // ✅ ADD TO CART
    const newCart = await Cart.create(cartData);

    console.log("✅ ADDED TO CART:", newCart);

    // ❌ REMOVE THIS LINE (IMPORTANT)
    // await Wishlist.findByIdAndDelete(wishlistId);

    res.json({ message: "Added to cart only (wishlist kept)" });

  } catch (err) {
    console.log("❌ MOVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};