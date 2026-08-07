const Logo = require("../models/Logo.js");

const uploadLogo = async (req, res) => {
  try {

    // ✅ CHECK EXISTING LOGO
    let existingLogo = await Logo.findOne();

    if (existingLogo) {

      // ✅ UPDATE OLD LOGO
      existingLogo.image = req.file.filename;

      await existingLogo.save();

      return res.json({
        message: "Logo Updated",
        logo: existingLogo,
      });
    }

    // ✅ CREATE NEW LOGO
    const logo = await Logo.create({
      image: req.file.filename,
    });

    res.json({
      message: "Logo Uploaded",
      logo,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

 const getLogo = async (req, res) => {
  try {

    const logo = await Logo.findOne();

    res.json(logo);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports={uploadLogo,getLogo};