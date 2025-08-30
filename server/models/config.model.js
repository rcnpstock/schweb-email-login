const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true,
    },
    clientSecret: {
        type: String,
        required: true,
    },
    redirectUri: {
        type: String,
        required: true,
        default: "https://claude-schweb.onrender.com/callback"
    },
    webhookSettings: {
        defaultAction: {
            type: String,
            enum: ["buy", "sell"],
            default: "buy"
        },
        defaultQuantity: {
            type: Number,
            default: 1
        },
        defaultOrderType: {
            type: String,
            enum: ["MARKET", "LIMIT"],
            default: "MARKET"
        }
    },
    userId: {
        type: String,
        unique: true,
        default: "default"
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Config", configSchema);