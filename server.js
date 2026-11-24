
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend files from public folder
app.use(express.static("public"));

// Connect Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

// AI Customer Support API
app.post("/api/support", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid customer message."
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
You are an intelligent customer support assistant.

Analyze the following customer message:

"${message}"

Return:
- Category: Technical, Billing, or General
- Sentiment: Positive, Neutral, or Negative
- Priority: Low, Medium, or Urgent
- Summary: A short explanation of the issue
- Reply: A professional and helpful response to the customer

Do not claim that refunds or account changes have already been completed.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: { type: "STRING" },
            sentiment: { type: "STRING" },
            priority: { type: "STRING" },
            summary: { type: "STRING" },
            reply: { type: "STRING" }
          },
          required: [
            "category",
            "sentiment",
            "priority",
            "summary",
            "reply"
          ]
        }
      }
    });

    const response = JSON.parse(result.response.text());

    res.json({
      success: true,
      result: response
    });

  } catch (error) {
    console.error("Gemini error:", error.message);

    res.status(500).json({
      success: false,
      error: "AI processing failed. Check your API configuration."
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SmartDesk AI running on port ${PORT}`);
});

