const fs = require("fs");
const path = require("path");

const tokenPath = path.join(__dirname, "tokens.json");

function saveTokens(tokens) {
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
}

function getTokens() {
    if (!fs.existsSync(tokenPath)) return null;
    const data = fs.readFileSync(tokenPath);
    return JSON.parse(data);
}

module.exports = { saveTokens, getTokens };
