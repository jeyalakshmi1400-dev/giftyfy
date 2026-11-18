
require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");

const uploadsFolder = path.join(__dirname, "../uploads");

// First run must be DRY RUN.
const DRY_RUN = false;

const isCloudinaryUrl = (value) =>
  typeof value === "string" &&
  value.includes("res.cloudinary.com");

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
    console.log("CATEGORY IMAGE MIGRATION");
    console.log("DRY RUN:", DRY_RUN);

    const categories = await Category.find();

    for (const category of categories) {
      if (!category.image) continue;

      console.log("\n==============================");
      console.log("Category:", category.category);
      console.log("Current image:", category.image);

      if (isCloudinaryUrl(category.image)) {
        cloudinaryCount++;
        console.log("[SKIP CLOUDINARY]");
        continue;
      }

      localCount++;

      const filename = path.basename(
        category.image.split("?")[0].replace(/\\/g, "/")
      );

      const localPath = path.join(uploadsFolder, filename);

      if (!fs.existsSync(localPath)) {
        missingCount++;
        console.log("[MISSING]", filename);
        continue;
      }

      if (DRY_RUN) {
        console.log("[DRY RUN]", filename);
        continue;
      }

      let cloudUrl = cache.get(filename);

      if (!cloudUrl) {
        const result = await cloudinary.uploader.upload(
          localPath,
          {
            folder: "giftyfy/categories",
            resource_type: "image",
            use_filename: false,
          }
        );

        cloudUrl = result.secure_url;
        cache.set(filename, cloudUrl);
        uploadedCount++;

        console.log("[UPLOADED]", filename);
      }

      category.image = cloudUrl;
      await category.save();

      updatedCount++;
      console.log("[UPDATED]", category.category);
    }

    console.log("\n========== SUMMARY ==========");
    console.log("Total categories:", categories.length);
    console.log("Local references:", localCount);
    console.log("Cloudinary references:", cloudinaryCount);
    console.log("Missing files:", missingCount);
    console.log("Uploaded images:", uploadedCount);
    console.log("Updated records:", updatedCount);
    console.log("=============================");

  } catch (error) {
    console.error("MIGRATION ERROR:", error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
