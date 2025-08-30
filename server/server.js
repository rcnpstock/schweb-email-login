const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./db/db.js");
const {
  startTokenRefresh,
  refreshTokens,
} = require("./services/tokenRefresh.js");
const cors = require("cors");
const oauthRoutes = require("./routes/oauth.route.js");
const webhookRoutes = require("./routes/webhook.route.js");
const setupRoutes = require("./routes/setup.route.js");
const cloudSetupRoutes = require("./routes/cloud-setup.route.js");
const configRoutes = require("./routes/config.route.js");
const https = require("https");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://pinescriptdeveloper.com",
      "https://www.pinescriptdeveloper.com",
      "https://local.schwabtest.com:3000",
      /^https:\/\/.*\.onrender\.com$/,  // Allow any Render domain
      /^https:\/\/.*\.render\.com$/,    // Allow any Render domain
    ],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Load routes in the same order as the working debug server
console.log("Loading webhook routes...");
app.use("/webhook", webhookRoutes);

console.log("Loading oauth routes...");
app.use(oauthRoutes);

console.log("Loading setup routes...");
app.use("/setup", setupRoutes);

console.log("Loading cloud setup routes...");
app.use("/cloud", cloudSetupRoutes);

console.log("Loading config routes...");
app.use(configRoutes);
console.log("✅ All routes loaded successfully");

// Add static file serving (safe method)
console.log("Adding static file serving...");
if (IS_PRODUCTION) {
  app.use(express.static("public"));
  console.log("✅ Production static files configured");
} else {
  app.use(express.static("../client/dist"));
  console.log("✅ Development static files configured");
}

// Health check route (simple route first)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Schwab Webhook App is running" });
});
console.log("✅ Health check route added");

// Root route handler
app.get("/", (req, res) => {
  if (IS_PRODUCTION) {
    res.sendFile("index.html", { root: "public" });
  } else {
    res.json({ status: "ok", message: "Schwab Webhook App is running - Development" });
  }
});
console.log("✅ Root route added");

// Skip catch-all route - use static file serving only for now
console.log("✅ SPA routing skipped (using static file serving)");

console.log("✅ All routes and middleware configured successfully");

// Connect to database and start server
console.log("Connecting to database...");

connectDB()
  .then(() => {
    console.log("Database connected successfully");
    startTokenRefresh();
    
    if (IS_PRODUCTION) {
      // Production: Use HTTP (Render provides HTTPS proxy)
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT} (Production)`);
      });
    } else {
      // Development: Use HTTPS
      const options = {
        key: fs.readFileSync("./localhost-key.pem"),
        cert: fs.readFileSync("./localhost.pem"),
      };
      https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on https://0.0.0.0:${PORT} (Development)`);
      });
    }
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

// // server.js (snippet)
// const httpsOptions = {
//     key: fs.readFileSync('./localhost-key.pem'),
//     cert: fs.readFileSync('./localhost.pem'),
//   };
//   https.createServer(httpsOptions, app).listen(3000, '0.0.0.0', () => {
//     console.log('Server running on https://0.0.0.0:3000');
//   });
