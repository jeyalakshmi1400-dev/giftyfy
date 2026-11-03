const express =require("express");
const router =express.Router();

const upload = require("../middleware/bannerUpload");
const{ addBanner,getBanners,deleteBanner,activebanner,getActiveBanners} =require("../controllers/bannerController");


router.post("/", (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      console.error(
        "Banner Middleware Error:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );

      return res.status(500).json({
        message: error.message || "Banner upload failed",
      });
    }

    next();
  });
}, addBanner);

router.get("/",getBanners);

router.delete("/:id",deleteBanner);

router.put("/active/:id", activebanner);

router.get("/active", getActiveBanners);
module.exports=router;