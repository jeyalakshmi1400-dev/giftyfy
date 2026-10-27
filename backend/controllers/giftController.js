const GiftSetting = require("../models/GiftSetting");


// Get Gift Setting
exports.getGiftSetting = async(req,res)=>{
  try{

    let setting = await GiftSetting.findOne();

    if(!setting){
      setting = await GiftSetting.create({
        giftWrapCharge:30,
        maxMessageLength:200
      });
    }

    res.json(setting);

  }catch(err){
    res.status(500).json({
      message:err.message
    });
  }
};


// Update Gift Setting (Admin)
exports.updateGiftSetting = async(req,res)=>{
  try{

    const setting = await GiftSetting.findOneAndUpdate(
      {},
      req.body,
      {
        new:true,
        upsert:true
      }
    );

    res.json(setting);

  }catch(err){
    res.status(500).json({
      message:err.message
    });
  }
};