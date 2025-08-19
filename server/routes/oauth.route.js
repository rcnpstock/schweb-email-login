require("dotenv").config();
const express = require("express");
const router = express.Router();
const Token = require("../models/token.model.js");
const axios = require("axios");

router.get("/login", (req, res) => {
    const { CLIENT_ID, REDIRECT_URI } = process.env;
    const baseUrl = "https://api.schwabapi.com/v1/oauth/authorize";

    const oauthUrl = `${baseUrl}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&scope=PlaceTrade+ReadAccounts`;

    console.log("Redirecting to:", oauthUrl);

    res.redirect(oauthUrl);
});

router.get("/callback", async (req, res) => {
    const code = req.query.code;
    console.log("OAuth callback code:", code);

    if (!code) return res.status(400).send("No code received");

    try {
        const credentials = Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString("base64");

        const response = await axios.post(
            "https://api.schwabapi.com/v1/oauth/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.REDIRECT_URI,
            }),
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        console.log("response from /callback", response);

        const { access_token, refresh_token, expires_in } = response.data;

        // Optional: remove old tokens if needed
        await Token.deleteMany();

        // Save to MongoDB
        await Token.create({ access_token, refresh_token, expires_in });

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
