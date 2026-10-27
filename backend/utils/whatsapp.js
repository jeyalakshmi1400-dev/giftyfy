
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");

let isReady = false;

// =====================================
// FIND CHROME EXECUTABLE
// =====================================
const findChromeExecutable = () => {
  // Use an explicitly configured Chrome path if available
  const customChromePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  if (
    customChromePath &&
    fs.existsSync(customChromePath)
  ) {
    return customChromePath;
  }

  // Search possible Puppeteer cache locations
  const cacheRoots = [
    process.env.PUPPETEER_CACHE_DIR
      ? path.resolve(
          process.cwd(),
          process.env.PUPPETEER_CACHE_DIR
        )
      : null,

    path.join(
      process.cwd(),
      ".cache",
      "puppeteer"
    ),

    path.join(
      process.env.HOME || "/opt/render",
      ".cache",
      "puppeteer"
    ),

    "/opt/render/.cache/puppeteer",
  ].filter(Boolean);

  for (const cacheRoot of [...new Set(cacheRoots)]) {
    const chromeRoot = path.join(
      cacheRoot,
      "chrome"
    );

    if (!fs.existsSync(chromeRoot)) {
      continue;
    }

    try {
      const versions = fs
        .readdirSync(chromeRoot, {
          withFileTypes: true,
        })
        .filter(
          (entry) =>
            entry.isDirectory() &&
            entry.name.startsWith("linux-")
        )
        .map((entry) => entry.name)
        .sort((a, b) =>
          b.localeCompare(a, undefined, {
            numeric: true,
          })
        );

      for (const version of versions) {
        const possiblePaths = [
          path.join(
            chromeRoot,
            version,
            "chrome-linux64",
            "chrome"
          ),

          path.join(
            chromeRoot,
            version,
            "chrome-linux",
            "chrome"
          ),
        ];

        for (const chromePath of possiblePaths) {
          if (fs.existsSync(chromePath)) {
            return chromePath;
          }
        }
      }
    } catch (error) {
      console.error(
        "Error checking Chrome cache:",
        error.message
      );
    }
  }

  return undefined;
};

const chromeExecutablePath = findChromeExecutable();

if (chromeExecutablePath) {
  console.log(
    "Chrome executable found:",
    chromeExecutablePath
  );
} else {
  console.warn(
    "Chrome executable was not found in the configured cache locations."
  );
}

// =====================================
// CREATE WHATSAPP CLIENT
// =====================================
const client = new Client({
  authStrategy: new LocalAuth(),

  puppeteer: {
    ...(chromeExecutablePath
      ? { executablePath: chromeExecutablePath }
      : {}),

    headless: true,

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

// =====================================
// QR CODE EVENT
// =====================================
client.on("qr", (qr) => {
  console.log("Scan the WhatsApp QR code:");

  qrcode.generate(qr, {
    small: true,
  });
});

// =====================================
// READY EVENT
// =====================================
client.on("ready", async () => {
  isReady = true;

  console.log("WhatsApp Ready ✅");

  // Existing direct test message
  const testNumber = "919952568944@c.us";

  try {
    const isRegistered =
      await client.isRegisteredUser(testNumber);

    console.log("REGISTERED:", isRegistered);

    if (isRegistered) {
      await client.sendMessage(
        testNumber,
        "🔥 WhatsApp Connected Successfully"
      );

      console.log("DIRECT TEST SENT ✅");
    } else {
      console.log("❌ Number not on WhatsApp");
    }
  } catch (error) {
    console.error(
      "WhatsApp ready test failed:",
      error.message
    );
  }
});

// =====================================
// AUTHENTICATION EVENTS
// =====================================
client.on("authenticated", () => {
  console.log("Authenticated ✅");
});

client.on("auth_failure", (message) => {
  isReady = false;

  console.error(
    "WhatsApp authentication failed:",
    message
  );
});

client.on("disconnected", (reason) => {
  console.log(
    "WhatsApp disconnected:",
    reason
  );

  isReady = false;
});

// =====================================
// INITIALIZE CLIENT
// =====================================
client
  .initialize()
  .catch((error) => {
    isReady = false;

    console.error(
      "WhatsApp initialization failed:",
      error.message
    );

    // Keep the main Express backend running
    // even when WhatsApp cannot initialize.
  });

// =====================================
// SEND WHATSAPP MESSAGE
// =====================================
const sendWhatsAppMessage = async (
  phone,
  message
) => {
  try {
    if (!isReady) {
      console.log("⚠️ WhatsApp not ready");
      return;
    }

    const formattedNumber =
      `91${phone}@c.us`;

    console.log(
      "Sending to:",
      formattedNumber
    );

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

    await client.sendMessage(
      formattedNumber,
      message
    );

    console.log("Message Sent ✅");
  } catch (error) {
    console.error(
      "WHATSAPP ERROR:",
      error.message
    );
  }
};

module.exports = sendWhatsAppMessage;
