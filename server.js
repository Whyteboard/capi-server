import express from "express";
import crypto from "crypto";

const app = express();

// ✅ IMPORTANT: accept raw body (prevents crash)
app.use(express.text({ type: "*/*" }));

const PIXEL_ID = process.env.PIXEL_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

app.get("/", (req, res) => {
  res.send("Server running ✅");
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("Webhook received");

    let body;

    // ✅ SAFE PARSE
    try {
      body = JSON.parse(req.body);
    } catch (e) {
      console.log("JSON parse failed");
      return res.status(400).send("Invalid JSON");
    }

    const payment = body?.payload?.payment?.entity;

    if (!payment) {
      console.log("No payment object:", body);
      return res.status(400).send("Invalid payload");
    }

    const email = (payment.email || "").toLowerCase().trim();
    const phone = (payment.contact || "").replace(/\D/g, "");
    const amount = (payment.amount || 0) / 100;

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            em: email ? [sha256(email)] : [],
            ph: phone ? [sha256(phone)] : []
          },
          custom_data: {
            currency: "INR",
            value: amount
          }
        }
      ],
      access_token: ACCESS_TOKEN
    };

    console.log("Sending to Meta...");

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    console.log("META RESPONSE:", result);

    res.status(200).send("OK");

  } catch (err) {
    console.error("CRASH:", err);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Running on", PORT);
});
