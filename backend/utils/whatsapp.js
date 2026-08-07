const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let isReady = false;

// ✅ Create Client
const client = new Client({
  authStrategy: new LocalAuth(),

  puppeteer: {
    headless: true,
    args: ["--no-sandbox"],
  },
});

// ✅ QR Event
client.on("qr", (qr) => {

  console.log("📱 Scan QR Code Below:\n");

  qrcode.generate(qr, {
    small: true,
  });
});

// ✅ Ready Event
client.on("ready", async () => {

  isReady = true;

  console.log("WhatsApp Ready ✅");

  // 🔥 DIRECT TEST
  const testNumber =
    "919952568944@c.us";

  const isRegistered =
    await client.isRegisteredUser(
      testNumber
    );

  console.log(
    "REGISTERED:",
    isRegistered
  );

  if (isRegistered) {

    await client.sendMessage(
      testNumber,
      "🔥 WhatsApp Connected Successfully"
    );

    console.log(
      "DIRECT TEST SENT ✅"
    );

  } else {

    console.log(
      "❌ Number not on WhatsApp"
    );
  }
});

// ✅ Auth Events
client.on("authenticated", () => {
  console.log("Authenticated ✅");
});

client.on("auth_failure", (msg) => {
  console.log(
    "Auth Failed ❌",
    msg
  );
});

client.on("disconnected", (reason) => {
  console.log(
    "Disconnected ❌",
    reason
  );

  isReady = false;
});

// ✅ Initialize
client.initialize();

// ✅ Send Function
const sendWhatsAppMessage = async (
  phone,
  message
) => {

  try {

    if (!isReady) {

      console.log(
        "⚠️ WhatsApp not ready"
      );

      return;
    }

    const formattedNumber =
      `91${phone}@c.us`;

    console.log(
      "Sending to:",
      formattedNumber
    );

    // ✅ Check Number
    const isRegistered =
      await client.isRegisteredUser(
        formattedNumber
      );

    if (!isRegistered) {

      console.log(
        "❌ User not on WhatsApp"
      );

      return;
    }

    // ✅ Send Message
    await client.sendMessage(
      formattedNumber,
      message
    );

    console.log(
      "Message Sent ✅"
    );

  } catch (err) {

    console.log(
      "WHATSAPP ERROR:",
      err
    );
  }
};

module.exports =
  sendWhatsAppMessage;