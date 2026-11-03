const  Banner = require("../models/Banner");

exports.addBanner = async (req, res) => {
  try {
    console.log("Banner upload request received");
    console.log("Uploaded file:", req.file);

    if (!req.file) {
      return res.status(400).json({
        message: "Banner image not received",
      });
    }

    const banner = new Banner({
      image: req.file.path,
    });

    await banner.save();

    res.status(201).json({
      message: "Banner Uploaded Successfully",
      banner,
    });
  } catch (error) {
    console.error("Banner Upload Error:", error);

    res.status(500).json({
      message: error.message || "Banner upload failed",
    });
  }
};

exports.getBanners =async(req,res)=>{
    try{
        const banners= await Banner.find();
        res.json(banners);
    
    } catch(error){
        res.status(500).json({message:error.message});
    }
};

//delete

exports.deleteBanner =async(req,res)=>{
    try{
        await Banner.findByIdAndDelete(req.params.id); 4

        res.json({
            message:"Banner deleted successfully",
        });
    
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

exports.activebanner = async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  banner.isActive = !banner.isActive;

  await banner.save();

  res.json({ message: "Banner status updated" });
}
// ONLY ACTIVE BANNERS (USER SIDE)
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};