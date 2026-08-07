const express =require("express");
const router =express.Router();

const upload =require("../middleware/upload");
const{ addBanner,getBanners,deleteBanner,activebanner,getActiveBanners} =require("../controllers/bannerController");


router.post("/",upload.single("image"),addBanner);

router.get("/",getBanners);

router.delete("/:id",deleteBanner);

router.put("/active/:id", activebanner);

router.get("/active", getActiveBanners);
module.exports=router;