import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

// Use environment variables (SET THESE IN RAILWAY)
const PIXEL_ID = process.env.PIXEL_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Hash function
function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Health check
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const payment = req.body?.payload?.payment?.entity;

    if (!payment) {
      console.log("Invalid payload:", req.body);
      return res.status(400).send("Invalid payload");
    }

    // Extract user + payment data
    const email = (payment.email || "").toLowerCase().trim();
    const phone = (payment.contact || "").replace(/\D/g, "");
    const amount = (payment.amount || 0) / 100;

    // Multi-page + campaign tracking (via Razorpay notes)
    const source_url =
      payment.notes?.source_url || "https://yourwebsite.com";
    const fbp = payment.notes?.fbp || undefined;
    const fbc = payment.notes?.fbc || undefined;

    const product_name = payment.notes?.product_name || "Product";
    const product_id = payment.notes?.product_id || "default-id";

    const event_id = payment.id || crypto.randomUUID();

    // Meta payload
    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id,
          action_source: "website",
          event_source_url: source_url,

          user_data: {
            em: email ? [sha256(email)] : [],
            ph: phone ? [sha256(phone)] : [],
            fbp: fbp,
            fbc: fbc
          },

          custom_data: {
            currency: "INR",
            value: amount,
            content_name: product_name,
            content_ids: [product_id]
          }
        }
      ],
      access_token: ACCESS_TOKEN
    };

    console.log("Sending to Meta:", payload);

    // Send to Meta
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    console.log("META RESPONSE:", result);

    res.send("Event sent to Meta ✅");

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).send("Server error");
  }
});

// Railway port setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
