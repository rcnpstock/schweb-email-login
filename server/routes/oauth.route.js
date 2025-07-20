require("dotenv").config();
const express = require("express");
const router = express.Router();
const Token = require("../models/token.model.js");
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent");

router.get("/login", async (req, res) => {
    const { CLIENT_ID, REDIRECT_URI } = process.env;
    const baseUrl = "https://api.schwabapi.com/v1/oauth/authorize";

    const oauthUrl = `${baseUrl}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&scope=PlaceTrade%20ReadAccounts`;

    // https://api.schwabapi.com/v1/oauth/authorize?client_id={APP_KEY}&redirect_uri={CALLBACK_URL}

    console.log("Proxying request to:", oauthUrl);

    try {
        // Proxy Agent with US-based IP
        const proxy = new HttpsProxyAgent("http://129.213.69.94:80");

        // Fetch Schwab Auth Page
        const response = await axios.get(oauthUrl, {
            httpsAgent: proxy,
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        // Send Schwab response to user
        res.send(response.data);
    } catch (err) {
        console.error("Proxy login error:", err.message);
        res.status(500).send("Error accessing Schwab OAuth");
    }
});

// router.get("/login", (req, res) => {
//     const { CLIENT_ID, REDIRECT_URI } = process.env;
//     const baseUrl = "https://api.schwab.com/oauth2/authorize";

//     const oauthUrl = `${baseUrl}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
//         REDIRECT_URI
//     )}&scope=PlaceTrade%20ReadAccounts`;

//     console.log("Redirecting to:", oauthUrl);

//     res.redirect(oauthUrl);
// });

router.get("/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) return res.status(400).send("No code received");

    try {
        const response = await axios.post(
            "https://api.schwab.com/oauth2/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.REDIRECT_URI,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;

        // Optional: remove old tokens if needed
        await Token.deleteMany();

        // Save to MongoDB
        await Token.create({ access_token, refresh_token, expires_in });

        // Redirect to frontend after successful login
        res.redirect("https://pinescriptdeveloper.com/oauth/success");
        // res.redirect("http://localhost:5173/oauth/success");
    } catch (error) {
        console.error(
            "Token exchange error:",
            error.response?.data || error.message
        );
        res.status(500).send("Failed to get token.");
    }
});

// Add a status endpoint for frontend to check login state
router.get("/status", async (req, res) => {
    try {
        const tokenDoc = await Token.findOne();
        if (tokenDoc) {
            res.json({ loggedIn: true });
        } else {
            res.json({ loggedIn: false });
        }
    } catch (err) {
        res.json({ loggedIn: false });
    }
});

module.exports = router;
