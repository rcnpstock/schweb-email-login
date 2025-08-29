const express = require("express");
const router = express.Router();
const { placeOrder } = require("../services/schwab.js");
const logger = require("../utils/logger.js");

router.post("/place-order", async (req, res) => {
    try {
        const { symbol, quantity, instruction } = req.body;

        if (!symbol || !quantity || !instruction) {
            return res.status(400).json({ error: "Missing fields in body" });
        }

        const result = await placeOrder({ symbol, quantity, instruction });

        res.status(200).json({
            message: "Order placed successfully",
            result,
        });
    } catch (err) {
        console.error("❌ Webhook error:", err.message);
        res.status(500).json({ error: "Order failed", details: err.message });
    }
});

// TradingView webhook endpoint
router.post("/tradingview", async (req, res) => {
    try {
        logger.info("TradingView webhook received:", JSON.stringify(req.body, null, 2));
        
        const { ticker, action, quantity, strategy } = req.body;

        // Validate required fields
        if (!ticker || !action) {
            logger.error("Missing required fields: ticker or action");
            return res.status(400).json({ 
                error: "Missing required fields", 
                required: ["ticker", "action"],
                received: req.body
            });
        }

        // Map TradingView actions to Schwab instructions
        let instruction;
        if (action.toLowerCase() === "buy" || action.toLowerCase() === "long") {
            instruction = "BUY";
        } else if (action.toLowerCase() === "sell" || action.toLowerCase() === "short") {
            instruction = "SELL";
        } else {
            logger.error("Invalid action:", action);
            return res.status(400).json({ 
                error: "Invalid action. Must be 'buy', 'sell', 'long', or 'short'",
                received: action
            });
        }

        // Use provided quantity or default to 1
        const orderQuantity = quantity || 1;

        logger.info(`Processing TradingView order: ${instruction} ${orderQuantity} shares of ${ticker}`);

        // Place the order
        const result = await placeOrder({ 
            symbol: ticker, 
            quantity: orderQuantity, 
            instruction: instruction 
        });

        logger.info("TradingView order placed successfully:", result);

        res.status(200).json({
            message: "TradingView webhook processed successfully",
            order: {
                symbol: ticker,
                quantity: orderQuantity,
                instruction: instruction,
                strategy: strategy || "N/A"
            },
            result
        });

    } catch (err) {
        logger.error("❌ TradingView webhook error:", err.message);
        res.status(500).json({ 
            error: "TradingView webhook failed", 
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
