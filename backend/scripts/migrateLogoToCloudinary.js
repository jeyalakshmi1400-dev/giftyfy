
require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Logo = require("../models/Logo");
const cloudinary = require("../config/cloudinary");

const uploadsFolder = path.join(__dirname, "../uploads");
const DRY_RUN = false;

async function migrate() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI
    );

    console.log("MongoDB connected");
    console.log("LOGO MIGRATION");
    console.log("DRY RUN:", DRY_RUN);

    const logo = await Logo.findOne();

    if (!logo) {
      console.log("No logo found in database");
      return;
    }

    console.log("Current logo:", logo.image);

    if (logo.image.includes("res.cloudinary.com")) {
      console.log("Logo already migrated to Cloudinary");
      return;
    }

    const filename = path.basename(
      logo.image.split("?")[0].replace(/\\/g, "/")
    );

    const localPath = path.join(uploadsFolder, filename);

    if (!fs.existsSync(localPath)) {
      console.log("LOCAL IMAGE NOT FOUND:", localPath);
      return;
    }

    if (DRY_RUN) {
      console.log("[DRY RUN] File found:", filename);
      console.log("No database changes made.");
      return;
    }

    const result = await cloudinary.uploader.upload(localPath, {
      folder: "giftyfy/logo",
      resource_type: "image",
      use_filename: false,
    });

    logo.image = result.secure_url;
    await logo.save();

    console.log("Logo uploaded and database updated");
    console.log("Cloudinary URL:", logo.image);
    console.log("Original local file preserved");

  } catch (error) {
    console.error("LOGO MIGRATION ERROR:", error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
