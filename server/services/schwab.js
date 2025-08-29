const axios = require("axios");
const Token = require("../models/token.model.js");
const logger = require("../utils/logger.js");

const getAccessToken = async () => {
    const tokenDoc = await Token.findOne().sort({ createdAt: -1 });
    if (!tokenDoc) throw new Error("Access token not found");
    const token = tokenDoc.access_token;
    console.log("Fetched access token:", token);
    logger.info("Fetched access token:", token);
    return token;
};

const getPrimaryAccountId = async (accessToken) => {
    try {
        console.log(
            "Fetching accounts with token:",
            accessToken.substring(0, 10) + "..."
        );
        const response = await axios.get(
            "https://api.schwabapi.com/trader/v1/accounts/accountNumbers",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log("Account response:", response.data);
        logger.info("Account response:", response.data);

        const accounts = response.data;
        if (!accounts || accounts.length === 0)
            throw new Error("No accounts found");

        const account = accounts[0];
        if (!account.hashValue) throw new Error("No valid hashValue found");
        return account.hashValue;
    } catch (error) {
        console.error(
            "Account fetch error:",
            error.response?.status,
            error.response?.data || error.message
        );
        logger.error(
            "Account fetch error:",
            error.response?.status,
            error.response?.data || error.message
        );
        throw new Error(
            "Failed to fetch account: " +
                (error.response?.data?.error || error.message)
        );
    }
};

const placeOrder = async ({ symbol, quantity, instruction }) => {
    try {
        const accessToken = await getAccessToken();
        const accountId = await getPrimaryAccountId(accessToken);

        const orderBody = {
            orderType: "MARKET",
            session: "NORMAL",
            duration: "DAY",
            orderStrategyType: "SINGLE",
            orderLegCollection: [
                {
                    instruction: instruction.toUpperCase(),
                    quantity: parseInt(quantity),
                    instrument: {
                        symbol: symbol.toUpperCase(),
                        assetType: "EQUITY",
                    },
                    positionEffect: "OPENING", // Add this for buying
                },
            ],
            childOrderStrategies: [],
        };

        const response = await axios.post(
            `https://api.schwabapi.com/trader/v1/accounts/${accountId}/orders`,
            orderBody,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    accept: "*/*",
                },
            }
        );

        console.log("Order placed successfully:", response.data);
        logger.info("Order placed successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error(
            "Order placement error:",
            error.response?.status,
            error.response?.data || error.message
        );
        logger.error(
            "Order placement error:",
            error.response?.status,
            error.response?.data || error.message
        );
        throw new Error(
            "Failed to place order: " +
                (error.response?.data?.error || error.message)
        );
    }
};

module.exports = { placeOrder };
