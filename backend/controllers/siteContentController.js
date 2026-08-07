const SiteContent = require("../models/SiteContent");


exports.getSiteContent = async(req,res)=>{
    try{
        const content = await SiteContent.findOne();

        res.json(content);

    }catch(error){
        res.status(500).json({
            message:error.message,

        });
    }
};


exports.updateSiteContent = async(req,res)=>{
    try{
        let content = await SiteContent.findOne();

        if(content){
            content = await SiteContent.findByIdAndUpdate(
                content._id,
                req.body,
                {new:true}
            );
        }
        else{
            
            content = await SiteContent.create(req.body);
        }
        res.json({
            success:true,
            content,
        });
    }catch(error){
        res.status(500).json({
            message:error.message,
        });
    }
};