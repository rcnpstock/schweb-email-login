const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("🐞 DEBUG: Starting server with gradual route addition...");

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

console.log("✅ Basic middleware configured");

// Test 1: Add webhook routes only
try {
  console.log("🔍 TEST 1: Adding webhook routes...");
  const webhookRoutes = require("./routes/webhook.route.js");
  app.use("/webhook", webhookRoutes);
  console.log("✅ Webhook routes added successfully");
} catch (error) {
  console.error("❌ ERROR in webhook routes:", error.message);
  process.exit(1);
}

// Test 2: Add oauth routes
try {
  console.log("🔍 TEST 2: Adding oauth routes...");
  const oauthRoutes = require("./routes/oauth.route.js");
  app.use(oauthRoutes);
  console.log("✅ OAuth routes added successfully");
} catch (error) {
  console.error("❌ ERROR in oauth routes:", error.message);
  process.exit(1);
}

// Test 3: Add setup routes
try {
  console.log("🔍 TEST 3: Adding setup routes...");
  const setupRoutes = require("./routes/setup.route.js");
  app.use("/setup", setupRoutes);
  console.log("✅ Setup routes added successfully");
} catch (error) {
  console.error("❌ ERROR in setup routes:", error.message);
  process.exit(1);
}

// Test 4: Add cloud setup routes
try {
  console.log("🔍 TEST 4: Adding cloud setup routes...");
  const cloudSetupRoutes = require("./routes/cloud-setup.route.js");
  app.use("/cloud", cloudSetupRoutes);
  console.log("✅ Cloud setup routes added successfully");
} catch (error) {
  console.error("❌ ERROR in cloud setup routes:", error.message);
  process.exit(1);
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", debug: "All routes loaded successfully" });
});

console.log("🚀 Starting server...");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎉 DEBUG server running successfully on http://0.0.0.0:${PORT}`);
  console.log("All route modules loaded without path-to-regexp errors!");
});