const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger.js");
const Token = require("../models/token.model.js");

let setupLogs = [];
let serverStatus = "ready";

const addLog = (message, level = 'info') => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message
    };
    setupLogs.push(logEntry);
    // Keep only last 50 logs
    if (setupLogs.length > 50) {
        setupLogs = setupLogs.slice(-50);
    }
    logger[level](message);
};

router.post("/configure", async (req, res) => {
    try {
        const { clientId, clientSecret, redirectUri, serverUrl } = req.body;
        
        addLog("🚀 Cloud setup started");
        addLog(`📋 Received credentials - Client ID: ${clientId.substring(0, 10)}...`);
        
        if (!clientId || !clientSecret || !serverUrl) {
            addLog("❌ Missing required credentials", "error");
            return res.status(400).json({ error: "Client ID, Client Secret, and Server URL are required" });
        }

        addLog("✅ Credentials validated");
        serverStatus = "configuring";

        // Clear any existing expired tokens to force fresh OAuth
        try {
            addLog("🗑️ Clearing existing tokens...");
            await Token.deleteMany({});
            addLog("✅ Existing tokens cleared - fresh OAuth required");
        } catch (tokenError) {
            addLog(`⚠️ Failed to clear tokens: ${tokenError.message}`, "warn");
        }

        // Update environment variables for production
        try {
            addLog("📝 Updating environment variables...");
            
            // Update process.env for current session
            process.env.CLIENT_ID = clientId;
            process.env.CLIENT_SECRET = clientSecret;
            process.env.REDIRECT_URI = redirectUri || `${serverUrl}/callback`;
            
            addLog("✅ Environment variables updated");
            addLog(`🔗 OAuth redirect URI set to: ${process.env.REDIRECT_URI}`);
        } catch (envError) {
            addLog(`❌ Failed to update environment: ${envError.message}`, "error");
            throw envError;
        }

        serverStatus = "configured";
        addLog(`🎉 Setup completed successfully!`);
        addLog(`🔗 Webhook URL ready: ${serverUrl}/webhook/tradingview`);
        addLog(`🔑 OAuth login URL: ${serverUrl}/login`);
        
        res.json({
            success: true,
            serverUrl: serverUrl,
            webhookUrl: `${serverUrl}/webhook/tradingview`,
            loginUrl: `${serverUrl}/login`,
            message: "Cloud setup completed. You can now login to Schwab."
        });
        
    } catch (error) {
        addLog(`💥 Setup failed: ${error.message}`, "error");
        addLog(`📊 Full error: ${error.stack}`, "error");
        serverStatus = "error";
        res.status(500).json({ error: "Failed to configure setup: " + error.message });
    }
});

router.get("/status", (req, res) => {
    res.json({
        status: serverStatus,
        serverUrl: process.env.RENDER_EXTERNAL_URL || "Not deployed yet"
    });
});

router.get("/logs", (req, res) => {
    res.json({
        logs: setupLogs,
        status: serverStatus
    });
});

router.delete("/logs", (req, res) => {
    setupLogs = [];
    res.json({ message: "Logs cleared" });
});

module.exports = router;