
require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

const uploadsFolder = path.join(__dirname, "../uploads");

// Keep this true for the first test.
// No uploads or database updates will happen.
const DRY_RUN = false;

const isCloudinaryUrl = (value) =>
  typeof value === "string" &&
  value.includes("res.cloudinary.com");

const isLocalUpload = (value) =>
  typeof value === "string" &&
  (
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/") ||
    !value.startsWith("http")
  );

async function migrate() {
  const cache = new Map();

  let localCount = 0;
  let cloudinaryCount = 0;
  let missingCount = 0;
  let uploadedCount = 0;
  let updatedCount = 0;

  try {
    await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI
    );

    console.log("\nMongoDB connected");
    console.log("PRODUCT IMAGE MIGRATION");
    console.log("DRY RUN:", DRY_RUN);

    const products = await Product.find();

    for (const product of products) {
      let changed = false;

      console.log("\n================================");
      console.log("Product:", product.name);

      async function migrateImage(value, field) {
        if (!value || typeof value !== "string") return value;

        if (isCloudinaryUrl(value)) {
          cloudinaryCount++;
          console.log("[SKIP CLOUDINARY]", field);
          return value;
        }

        if (!isLocalUpload(value)) return value;

        localCount++;

        const filename = path.basename(
          value.split("?")[0].replace(/\\/g, "/")
        );

        const localPath = path.join(uploadsFolder, filename);

        if (!fs.existsSync(localPath)) {
          missingCount++;
          console.log("[MISSING]", field, filename);
          return value;
        }

        if (DRY_RUN) {
          console.log("[DRY RUN]", field, filename);
          return value;
        }

        let cloudUrl = cache.get(filename);

        if (!cloudUrl) {
          const result = await cloudinary.uploader.upload(
            localPath,
            {
              folder: "giftyfy/products",
              resource_type: "image",
              use_filename: false,
            }
          );

          cloudUrl = result.secure_url;
          cache.set(filename, cloudUrl);

          uploadedCount++;

          console.log("[UPLOADED]", filename);
          console.log(cloudUrl);
        }

        return cloudUrl;
      }

      // Main product images
      for (let i = 0; i < (product.image || []).length; i++) {
        const oldUrl = product.image[i];

        const newUrl = await migrateImage(
          oldUrl,
          `image[${i}]`
        );

        if (newUrl !== oldUrl) {
          product.image[i] = newUrl;
          changed = true;
        }
      }

      // Variant images
      for (
        let i = 0;
        i < (product.variants || []).length;
        i++
      ) {
        const variant = product.variants[i];

        for (
          let j = 0;
          j < (variant.images || []).length;
          j++
        ) {
          const oldUrl = variant.images[j];

          const newUrl = await migrateImage(
            oldUrl,
            `variants[${i}].images[${j}]`
          );

          if (newUrl !== oldUrl) {
            variant.images[j] = newUrl;
            changed = true;
          }
        }
      }

      // Customization images
      if (product.customization) {
        for (const field of [
          "templateImage",
          "maskImage",
        ]) {
          const oldUrl = product.customization[field];

          const newUrl = await migrateImage(
            oldUrl,
            `customization.${field}`
          );

          if (newUrl !== oldUrl) {
            product.customization[field] = newUrl;
            changed = true;
          }
        }
      }

      if (changed && !DRY_RUN) {
        await product.save();
        updatedCount++;
        console.log("[DATABASE UPDATED]", product.name);
      }
    }

    console.log("\n========== MIGRATION SUMMARY ==========");
    console.log("Local references:", localCount);
    console.log("Already Cloudinary:", cloudinaryCount);
    console.log("Missing files:", missingCount);
    console.log("Uploaded files:", uploadedCount);
    console.log("Updated products:", updatedCount);
    console.log("DRY RUN:", DRY_RUN);
    console.log("=======================================\n");

  } catch (error) {
    console.error("MIGRATION ERROR:", error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
