const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const connectDB = require("./db/db.js");

dotenv.config();

const app = express();
app.use(bodyParser.json());

const oauthRoutes = require("./routes/oauth.route.js");
const webhookRoutes = require("./routes/webhook.route.js");
app.use("/oauth", oauthRoutes);
app.use("/webhook", webhookRoutes);

app.get("/", (req, res) => {
    res.send("Schwab Webhook App is running");
});

const PORT = process.env.PORT || 3000;
connectDB();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});