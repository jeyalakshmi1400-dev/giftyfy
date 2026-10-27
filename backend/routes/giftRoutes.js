const express = require("express");
const router = express.Router();

const {
 getGiftSetting,
 updateGiftSetting
}=require("../controllers/giftController");


router.get(
 "/",
 getGiftSetting
);


router.put(
 "/",
 updateGiftSetting
);


module.exports = router;