const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/generate-description", async (req, res) => {
  try {
    console.log("🔥 AI ROUTE HIT");

    const { productName } = req.body;

    if (!productName) {
      return res.status(400).json({ error: "Product name required" });
    }

const prompt = `
Generate a product description in CLEAN HTML format.

Rules:
- Use <h3> for title
- Use <p> for short paragraphs
- Use <ul><li> for features
- Keep it clean and e-commerce style (like Amazon / Flipkart)
- No markdown (** or ###)
- Make it attractive and structured

Product Name: ${productName}
`;

   const response = await axios.post(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    }
  }
);
    const text = response.data.choices[0].message.content;

    return res.json({
      description: text
    });

  } catch (err) {
    console.log("🔥 AI ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      error: "AI generation failed",
      details: err.message
    });
  }
});

module.exports = router;