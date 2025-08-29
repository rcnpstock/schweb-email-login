require("dotenv").config();
const express = require("express");
const router = express.Router();
const Token = require("../models/token.model.js");
const axios = require("axios");
const logger = require("../utils/logger.js");

router.get("/login", (req, res) => {
    const { CLIENT_ID, REDIRECT_URI } = process.env;
    const baseUrl = "https://api.schwabapi.com/v1/oauth/authorize";

    const oauthUrl = `${baseUrl}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&scope=PlaceTrade+ReadAccounts`;

    logger.info("Redirecting to:", oauthUrl);
    res.redirect(oauthUrl);
});

router.get("/callback", async (req, res) => {
    const code = req.query.code;
    logger.info("OAuth callback code received:", code);

    if (!code) {
        logger.error("No code received in callback");
        return res.status(400).json({ error: "No code received" });
    }

    try {
        const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
        const credentials = Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString("base64");

        logger.info("Starting token exchange with REDIRECT_URI:", REDIRECT_URI);

        const response = await axios.post(
            "https://api.schwabapi.com/v1/oauth/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI,
            }),
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        logger.info("Token exchange response:", response.data);

        const { access_token, refresh_token, expires_in } = response.data;

        await Token.deleteMany();
        await Token.create({ access_token, refresh_token, expires_in });

        logger.info("Tokens saved to MongoDB");

        res.redirect("http://localhost:5173");
        // res.redirect("/success");
        // res.redirect("/oauth/success");
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        logger.error("Token exchange error:", errorMessage);
        res.status(500).json({
            error: "Failed to get token",
            details: errorMessage,
        });
    }
});

router.get("/success", (req, res) => {
    res.send("OAuth successful! You can now use the app.");
});

router.get("/status", async (req, res) => {
    try {
        const tokenDoc = await Token.findOne();
        if (tokenDoc) {
            logger.info("Logged in status: true");
            res.json({ loggedIn: true });
        } else {
            logger.info("Logged in status: false");
            res.json({ loggedIn: false });
        }
    } catch (err) {
        logger.error("Status check error:", err.message);
        res.json({ loggedIn: false });
    }
});

module.exports = router;
