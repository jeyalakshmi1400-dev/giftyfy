const DeliverySetting = require("../models/DeliverySetting");


// GET SETTINGS
exports.getDeliverySetting = async (req, res) => {
  try {
    console.log("GET API CALLED");

    let setting = await DeliverySetting.findOne();

    console.log("FOUND:", setting);

    if (!setting) {
      console.log("NO DOCUMENT FOUND. CREATING NEW...");

      setting = await DeliverySetting.create({
        zones: [],
        freeDeliveryAmount: 999,
      });

      console.log("NEW DOCUMENT:", setting);
    }

    res.json(setting);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE SETTINGS

exports.updateDeliverySetting = async (req, res) => {
  try {

    const { zones, freeDeliveryAmount } = req.body;

    let setting = await DeliverySetting.findOne();

    if (!setting) {
      setting = new DeliverySetting();
    }

    setting.zones = zones;

    setting.freeDeliveryAmount = freeDeliveryAmount;

    await setting.save();

    res.json({
      message: "Delivery Settings Updated",
      setting,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};