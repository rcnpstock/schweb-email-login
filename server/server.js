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

// Add static file serving with fallback
console.log("Adding static file serving...");
if (IS_PRODUCTION) {
  // Ensure public directory exists
  const publicPath = path.join(__dirname, "public");
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
    console.log("Created public directory");
    
    // Create a fallback index.html if it doesn't exist
    const indexPath = path.join(publicPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schwab TradingView Integration</title>
    <script>
      // Redirect to the actual app URL if this is a fallback
      if (window.location.pathname === '/' && !window.appLoaded) {
        // Try to load the actual React app
        window.location.reload();
      }
    </script>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; }
      .container { max-width: 800px; margin: 50px auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
      h1 { color: #333; }
      .status { padding: 15px; background: #e8f5e9; border-radius: 8px; margin: 20px 0; }
      .btn { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
      .btn:hover { background: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Schwab TradingView Integration</h1>
        <div class="status">✅ Server is running! Setting up your app...</div>
        <p>If the page doesn't load automatically, please use these links:</p>
        <a href="/login" class="btn">Login with Schwab</a>
        <a href="/health" class="btn">Check Health</a>
        <p style="margin-top: 30px;"><strong>Webhook URL:</strong><br>
        <code style="background: #f5f5f5; padding: 10px; display: block; margin-top: 10px; border-radius: 5px;">
          https://claude-schweb.onrender.com/webhook/tradingview
        </code></p>
    </div>
</body>
</html>`;
      fs.writeFileSync(indexPath, fallbackHTML);
      console.log("Created fallback index.html");
    }
  }
  
  app.use(express.static(publicPath));
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
    const indexPath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback HTML if file doesn't exist
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schwab TradingView Integration</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; }
      .container { max-width: 800px; margin: 50px auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
      h1 { color: #333; }
      .status { padding: 15px; background: #e8f5e9; border-radius: 8px; margin: 20px 0; }
      .btn { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
      .btn:hover { background: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Schwab TradingView Integration</h1>
        <div class="status">✅ Server is running successfully!</div>
        <a href="/login" class="btn">Login with Schwab</a>
        <a href="/status" class="btn">Check Status</a>
        <a href="/health" class="btn">Health Check</a>
        <p style="margin-top: 30px;"><strong>Webhook URL:</strong><br>
        <code style="background: #f5f5f5; padding: 10px; display: block; margin-top: 10px; border-radius: 5px;">
          https://claude-schweb.onrender.com/webhook/tradingview
        </code></p>
    </div>
</body>
</html>`);
    }
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
