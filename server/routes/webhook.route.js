const express = require("express");
const router = express.Router();
const { placeOrder } = require("../services/schwab.js");

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

module.exports = router;
