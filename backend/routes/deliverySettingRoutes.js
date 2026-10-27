const express=require("express");

const router=express.Router();

const {
getDeliverySetting,
updateDeliverySetting
}=require("../controllers/deliverySettingController");


router.get(
"/",
getDeliverySetting
);


router.put(
"/",
updateDeliverySetting
);


module.exports=router;