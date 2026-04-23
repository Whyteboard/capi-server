const express = require("express");

const app = express();

// VERY IMPORTANT — Railway health check
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Webhook test
app.post("/webhook", (req, res) => {
  console.log("Webhook hit");
  res.status(200).send("Webhook received");
});

// MUST use Railway PORT
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
