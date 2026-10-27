const express = require("express");
const router = express.Router();

const pincodes = require("../data/pincodes.json");


router.get("/:pincode", (req,res)=>{

    const pin = req.params.pincode;

    const result = pincodes.find(
        item => String(item.pincode) === String(pin)
    );


    if(result){
        return res.json({
            available:true,
            data:result
        });
    }


    res.json({
        available:false
    });

});


module.exports = router;