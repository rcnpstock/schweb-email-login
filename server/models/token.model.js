const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
    access_token: String,
    refresh_token: String,
    expires_in: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Token", TokenSchema);
