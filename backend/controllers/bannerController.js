const  Banner = require("../models/Banner");

exports.addBanner=async(req,res)=>{
    try{
        const banner =new Banner({
            image:req.file.filename,
        });
        await banner.save();

        res.status(201).json({
            message:"Banner Uploadd Successfully",
            banner,
        });

    }
    catch(error){
        res.status(500).json({message:error.message});
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