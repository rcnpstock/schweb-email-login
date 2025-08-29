const axios = require("axios");
const Token = require("../models/token.model.js");
const logger = require("./../utils/logger.js");

const refreshTokens = async () => {
    try {
        const tokenDoc = await Token.findOne().sort({ createdAt: -1 });
        if (!tokenDoc) throw new Error("No refresh token found");

        const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
        console.log("Env vars for refresh:", {
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI,
        });
        const credentials = Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString("base64");

        console.log("Using refresh token:", tokenDoc.refresh_token); // Debug

        const response = await axios.post(
            "https://api.schwabapi.com/v1/oauth/token",
            new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: tokenDoc.refresh_token,
                redirect_uri: REDIRECT_URI,
            }),
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;
        await Token.deleteMany();
        await Token.create({ access_token, refresh_token, expires_in });

        console.log("Tokens refreshed successfully:", {
            access_token,
            expires_in,
        });
        logger.info("Tokens refreshed successfully:", {
            access_token,
            expires_in,
        });
        return { access_token, refresh_token, expires_in };
    } catch (error) {
        console.error(
            "Token refresh error:",
            error.response?.data || error.message
        );
        logger.error(
            "Token refresh error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

const startTokenRefresh = () => {
    // Initial refresh on start
    refreshTokens().catch(err => console.error("Initial token refresh failed:", err));

    setInterval(async () => {
        try {
            await refreshTokens();
        } catch (err) {
            console.error("Scheduled refresh failed:", err.message);
        }
    }, 29 * 60 * 1000); // 29 minutes
};

module.exports = { refreshTokens, startTokenRefresh };