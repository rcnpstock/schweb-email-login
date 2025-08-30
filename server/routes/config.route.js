const express = require("express");
const router = express.Router();
const Config = require("../models/config.model");
const logger = require("../utils/logger");

// Save configuration
router.post("/api/config", async (req, res) => {
    try {
        const { clientId, clientSecret, redirectUri, webhookSettings } = req.body;
        
        // Update or create config (only one config per user for now)
        const config = await Config.findOneAndUpdate(
            { userId: "default" },
            { 
                clientId, 
                clientSecret, 
                redirectUri: redirectUri || "https://schweb-email-login.onrender.com/callback",
                webhookSettings: webhookSettings || {}
            },
            { upsert: true, new: true }
        );
        
        // Also update environment variables for current session
        process.env.CLIENT_ID = clientId;
        process.env.CLIENT_SECRET = clientSecret;
        process.env.REDIRECT_URI = redirectUri || "https://schweb-email-login.onrender.com/callback";
        
        logger.info("Configuration saved successfully");
        res.json({ success: true, message: "Configuration saved successfully" });
    } catch (error) {
        logger.error("Error saving configuration:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get configuration
router.get("/api/config", async (req, res) => {
    try {
        const config = await Config.findOne({ userId: "default" });
        if (config) {
            res.json({
                success: true,
                config: {
                    clientId: config.clientId,
                    redirectUri: config.redirectUri,
                    webhookSettings: config.webhookSettings
                    // Don't send clientSecret to frontend
                }
            });
        } else {
            res.json({ success: false, message: "No configuration found" });
        }
    } catch (error) {
        logger.error("Error fetching configuration:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check if configuration exists
router.get("/api/config/status", async (req, res) => {
    try {
        const config = await Config.findOne({ userId: "default" });
        res.json({ 
            configured: !!config,
            hasCredentials: !!(config && config.clientId && config.clientSecret)
        });
    } catch (error) {
        res.json({ configured: false, hasCredentials: false });
    }
});

module.exports = router;