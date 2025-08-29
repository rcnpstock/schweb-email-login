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
console.log("✅ All routes loaded successfully");

// Add static file serving (safe method)
console.log("Adding static file serving...");

// 🪄 MAGIC: Ensure client files exist in production
if (IS_PRODUCTION) {
  const publicPath = path.join(__dirname, "public");
  const indexPath = path.join(publicPath, "index.html");
  
  // Create public directory if it doesn't exist
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
    console.log("📁 Created public directory");
  }
  
  // Create fallback index.html if missing
  if (!fs.existsSync(indexPath)) {
    const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Schwab TradingView Integration</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 10px; background: #e8f5e8; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Schwab TradingView Integration</h1>
        <div class="status">✅ Server is running successfully!</div>
        <h2>API Endpoints:</h2>
        <ul>
            <li><strong>Webhook:</strong> <code>POST /webhook/tradingview</code></li>
            <li><strong>Health Check:</strong> <code>GET /health</code></li>
            <li><strong>OAuth Setup:</strong> <code>GET /auth</code></li>
        </ul>
        <p>Your TradingView webhook URL: <strong>https://claude-schweb.onrender.com/webhook/tradingview</strong></p>
    </div>
</body>
</html>`;
    fs.writeFileSync(indexPath, fallbackHTML);
    console.log("🪄 Created fallback index.html");
  }
  
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

// Root route handler - DEMO VERSION
app.get("/", (req, res) => {
  const demoHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Schwab TradingView Integration - LIVE!</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 15px;
        }
        .status { 
            padding: 15px; 
            background: rgba(76, 175, 80, 0.2); 
            border: 2px solid #4CAF50;
            border-radius: 8px; 
            margin: 20px 0; 
            font-size: 18px;
        }
        .endpoint { 
            background: rgba(33, 150, 243, 0.2); 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0;
            border: 1px solid #2196F3;
        }
        .btn {
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 5px;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover { background: #45a049; }
        .webhook-url { 
            background: #1e1e1e; 
            color: #00ff00; 
            padding: 15px; 
            border-radius: 5px; 
            font-family: monospace; 
            word-break: break-all;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Schwab TradingView Integration</h1>
        <div class="status">✅ Server is running successfully! Time: ${new Date().toLocaleString()}</div>
        
        <h2>🔗 Quick Actions:</h2>
        <a href="/login" class="btn">🔐 Login to Schwab</a>
        <a href="/status" class="btn">📊 Check Login Status</a>
        <a href="/health" class="btn">💊 Health Check</a>
        
        <h2>📡 TradingView Webhook URL:</h2>
        <div class="webhook-url">
            https://claude-schweb.onrender.com/webhook/tradingview
        </div>
        
        <h2>🔧 API Endpoints:</h2>
        <div class="endpoint"><strong>POST</strong> /webhook/tradingview - Receive TradingView signals</div>
        <div class="endpoint"><strong>GET</strong> /login - Start Schwab OAuth</div>
        <div class="endpoint"><strong>GET</strong> /status - Check login status</div>
        <div class="endpoint"><strong>GET</strong> /health - Server health check</div>
        
        <h2>📝 Test JSON for TradingView:</h2>
        <div class="webhook-url">
{
  "ticker": "AAPL",
  "action": "buy",
  "quantity": 10,
  "strategy": "my_strategy"
}
        </div>
        
        <p><strong>Status:</strong> Ready to receive TradingView signals and place Schwab orders! 📈</p>
    </div>
</body>
</html>`;
  
  res.send(demoHTML);
});
console.log("✅ Root route added");

// Skip catch-all route - use static file serving only for now
console.log("✅ SPA routing skipped (using static file serving)");

console.log("✅ All routes and middleware configured successfully");

// Phase 3: Re-enable database connection and services
console.log("Starting server with full database connection...");

connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    startTokenRefresh();
    console.log("✅ Token refresh service started");
    
    if (IS_PRODUCTION) {
      // Production: Use HTTP (Render provides HTTPS proxy)
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🎉 Server running on http://0.0.0.0:${PORT} (Production)`);
        console.log("🚀 Full Schwab TradingView integration ready!");
      });
    } else {
      // Development: Use HTTPS
      const options = {
        key: fs.readFileSync("./localhost-key.pem"),
        cert: fs.readFileSync("./localhost.pem"),
      };
      https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
        console.log(`🎉 Server running on https://0.0.0.0:${PORT} (Development)`);
      });
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️ Starting server without database...");
    
    // Fallback: start without database
    if (IS_PRODUCTION) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`⚠️ Server running on http://0.0.0.0:${PORT} (Production - No DB)`);
      });
    }
  });

// // server.js (snippet)
// const httpsOptions = {
//     key: fs.readFileSync('./localhost-key.pem'),
//     cert: fs.readFileSync('./localhost.pem'),
//   };
//   https.createServer(httpsOptions, app).listen(3000, '0.0.0.0', () => {
//     console.log('Server running on https://0.0.0.0:3000');
//   });
