
const nodemailer = require("nodemailer");
const Coupon = require("../models/Coupon");

// WhatsApp is loaded only when explicitly enabled
let sendWhatsAppMessage = null;

if (process.env.ENABLE_WHATSAPP === "true") {
  sendWhatsAppMessage = require("./whatsapp");
}

// GENERATE COUPON CODE
const generateCouponCode = () => {
  return "NEW" + Math.floor(1000 + Math.random() * 9000);
};

// MAIN FUNCTION
const sendCouponNotification = async (user, coupon) => {
  try {
    if (!coupon) {
      console.log("Coupon missing");
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

    // EMAIL
    const transporter = nodemailer.createTransport({
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

    console.log("Coupon email sent successfully");

    // WHATSAPP - OPTIONAL
    if (sendWhatsAppMessage && user.phone) {
      await sendWhatsAppMessage(user.phone, message);
    } else {
      console.log("WhatsApp disabled; skipping coupon message");
    }

    return coupon;

  } catch (error) {
    console.log("UTIL ERROR:", error.message);
    throw error;
  }
};

module.exports = {
  sendCouponNotification,
  generateCouponCode,
};
