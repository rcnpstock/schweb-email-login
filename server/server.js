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

// Serve static files
if (IS_PRODUCTION) {
  app.use(express.static(path.join(__dirname, "public")));
} else {
  app.use(express.static(path.join(__dirname, "../client/dist")));
}

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Schwab Webhook App is running" });
});

// Root route handler
app.get("/", (req, res) => {
  if (IS_PRODUCTION) {
    res.sendFile(path.join(__dirname, "public/index.html"));
  } else {
    res.send("Schwab Webhook App is running - Development Mode");
  }
});

// Catch-all handler for SPA routing (MUST BE LAST)
app.get("*", (req, res) => {
  if (IS_PRODUCTION) {
    res.sendFile(path.join(__dirname, "public/index.html"));
  } else {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  }
});

// Temporarily start server without database to test route loading
console.log("Starting server without database connection for testing...");

if (IS_PRODUCTION) {
  // Production: Use HTTP (Render provides HTTPS proxy)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (Production)`);
    console.log("Server started successfully without database");
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

// TODO: Re-enable database connection once route loading is confirmed working
// connectDB()
//   .then(() => {
//     startTokenRefresh();
//   })
//   .catch((err) => {
//     console.error("MongoDB connection failed:", err.message);
//   });

// // server.js (snippet)
// const httpsOptions = {
//     key: fs.readFileSync('./localhost-key.pem'),
//     cert: fs.readFileSync('./localhost.pem'),
//   };
//   https.createServer(httpsOptions, app).listen(3000, '0.0.0.0', () => {
//     console.log('Server running on https://0.0.0.0:3000');
//   });
