const nodemailer = require("nodemailer");
const Coupon = require("../models/Coupon");

const sendWhatsAppMessage =
  process.env.ENABLE_WHATSAPP === "true"
    ? require("./whatsapp")
    : async () => {
        console.log("WhatsApp disabled; skipping coupon message");
      };
// 🔥 GENERATE CODE
const generateCouponCode = () => {
  return "NEW" + Math.floor(1000 + Math.random() * 9000);
};

// 🔥 MAIN FUNCTION
const sendCouponNotification = async (user, coupon) => {
  try {

    console.log("👉 Sending WhatsApp to:", user.phone);

    if (!coupon) {
      console.log("❌ Coupon missing");
      return;
    }

const message = `Hi ${user.name} 👋

✅ Your coupon has been applied successfully!

🎟️ Coupon Details
━━━━━━━━━━━━━━━━━━
Coupon Code : ${coupon.code}

Discount : ${
  coupon.discountType === "percentage"
    ? `${coupon.discountValue}% OFF`
    : `₹${coupon.discountValue} OFF`
}

🎉 This coupon has been applied to your checkout.

🛍️ Complete your order to enjoy your discount.

Thank you for shopping with Giftyfy ❤️`;

    // ✅ EMAIL
    const transporter =
      nodemailer.createTransport({
        service: "gmail",

        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🎁 Your Coupon",
      text: message,
    });

    // ✅ WHATSAPP
    await sendWhatsAppMessage(
      user.phone,
      message
    );

    return coupon;

  } catch (error) {

    console.log(
      "UTIL ERROR:",
      error.message
    );

    throw error;
  }
};

module.exports = {
  sendCouponNotification,
  generateCouponCode,
};