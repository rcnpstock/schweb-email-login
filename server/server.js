const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./db/db.js");
const cors = require("cors")

const app = express();

app.use(cors({
    origin: ['https://pinescriptdeveloper.com', 'https://www.pinescriptdeveloper.com'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../client/dist")));

const oauthRoutes = require("./routes/oauth.route.js");
const webhookRoutes = require("./routes/webhook.route.js");
app.use("/api/oauth", oauthRoutes);
app.use("/api/webhook", webhookRoutes);

app.get("/", (req, res) => {
    res.send("Schwab Webhook App is running");
});

app.get("/*any", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const PORT = process.env.PORT || 3000;
connectDB();
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
