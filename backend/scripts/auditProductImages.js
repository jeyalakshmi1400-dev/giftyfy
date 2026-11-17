
require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Product = require("../models/Product");

const uploadsFolder = path.join(__dirname, "../uploads");

const isCloudinaryUrl = (value) =>
  typeof value === "string" &&
  value.includes("res.cloudinary.com");

const isLocalUpload = (value) =>
  typeof value === "string" &&
  (value.startsWith("/uploads/") ||
    value.startsWith("uploads/") ||
    !value.startsWith("http"));

async function audit() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    console.log("\nMongoDB connected");
    console.log("READ-ONLY PRODUCT IMAGE AUDIT\n");

    const products = await Product.find().lean();

    let localCount = 0;
    let cloudinaryCount = 0;
    let missingCount = 0;

    for (const product of products) {
      console.log("\n================================");
      console.log("Product:", product.name);
      console.log("Product ID:", product._id);

      const images = [];

      (product.image || []).forEach((url) => {
        images.push({ field: "image", url });
      });

      (product.variants || []).forEach((variant, index) => {
        (variant.images || []).forEach((url) => {
          images.push({
            field: `variants[${index}].images`,
            url,
          });
        });
      });

      if (product.customization?.templateImage) {
        images.push({
          field: "customization.templateImage",
          url: product.customization.templateImage,
        });
      }

      if (product.customization?.maskImage) {
        images.push({
          field: "customization.maskImage",
          url: product.customization.maskImage,
        });
      }

      for (const item of images) {
        const value = item.url;

        if (isCloudinaryUrl(value)) {
          cloudinaryCount++;
          console.log("[CLOUDINARY]", item.field, value);
        } else if (isLocalUpload(value)) {
          localCount++;

          const filename = path.basename(
            value.split("?")[0]
          );

          const localPath = path.join(
            uploadsFolder,
            filename
          );

          const exists = fs.existsSync(localPath);

          if (!exists) missingCount++;

          console.log(
            exists ? "[LOCAL FOUND]" : "[LOCAL MISSING]",
            item.field,
            value
          );
        } else {
          console.log("[OTHER]", item.field, value);
        }
      }
    }

    console.log("\n========== AUDIT SUMMARY ==========");
    console.log("Products:", products.length);
    console.log("Local image references:", localCount);
    console.log("Cloudinary references:", cloudinaryCount);
    console.log("Missing local files:", missingCount);
    console.log("===================================\n");

  } catch (error) {
    console.error("AUDIT ERROR:", error);
  } finally {
    await mongoose.disconnect();
  }
}

audit();
