const mongoose = require("mongoose");

const giftSettingSchema = new mongoose.Schema(
{
  giftWrapEnabled:{
    type:Boolean,
    default:true
  },

  giftWrapCharge:{
    type:Number,
    default:30
  },

  maxMessageLength:{
    type:Number,
    default:200
  }

},
{
 timestamps:true
}
);

module.exports = mongoose.model(
  "GiftSetting",
  giftSettingSchema
);