const axios = require("axios");
const Token = require("../models/token.model.js");

const getAccessToken = async () => {
    const tokenDoc = await Token.findOne().sort({ createdAt: -1 });
    if (!tokenDoc) throw new Error("Access token not found");
    return tokenDoc.access_token;
};

const getPrimaryAccountId = async (accessToken) => {
    const res = await axios.get("https://api.schwabapi.com/trading/accounts", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const accounts = res.data.accounts;
    if (!accounts || accounts.length === 0)
        throw new Error("No accounts found");

    return accounts[0].accountId; // assuming first is primary
};

const placeOrder = async ({ symbol, quantity, instruction }) => {
    const accessToken = await getAccessToken();
    const accountId = await getPrimaryAccountId(accessToken);

    const orderBody = {
        orderType: "MARKET",
        session: "NORMAL",
        duration: "DAY",
        orderStrategyType: "SINGLE",
        orderLegCollection: [
            {
                instruction: instruction.toUpperCase(), // "BUY" or "SELL"
                quantity,
                instrument: {
                    symbol: symbol.toUpperCase(),
                    assetType: "EQUITY",
                },
            },
        ],
    };

    const response = await axios.post(
        `https://api.schwabapi.com/trading/accounts/${accountId}/orders`,
        orderBody,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

module.exports = { placeOrder };
