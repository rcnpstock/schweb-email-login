const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("Starting minimal server...");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      /^https:\/\/.*\.onrender\.com$/,
    ],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Simple health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Minimal Schwab Webhook App is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Simple webhook endpoint
app.post("/webhook/test", (req, res) => {
  console.log("Test webhook received:", req.body);
  res.json({ success: true, received: req.body });
});

console.log("Routes configured, starting server...");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Minimal server running on http://0.0.0.0:${PORT}`);
});