const express = require("express");
const multer=require("multer");
const {uploadLogo,getLogo}=require( "../controllers/logoController.js");


const router =express.Router();

const storage =multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/");

    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+"-"+ file.originalname);
    }
});

const upload = multer({storage});

router.post("/logo",upload.single("image"),uploadLogo);
router.get("/logo",getLogo);

module.exports = router;