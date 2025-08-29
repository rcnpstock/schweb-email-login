const express = require("express");
const router = express.Router();
const ngrok = require("ngrok");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const logger = require("../utils/logger.js");
const Token = require("../models/token.model.js");

const execAsync = promisify(exec);

let ngrokUrl = "";
let serverStatus = "stopped";
let setupLogs = [];

const addLog = (message, level = 'info') => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message
    };
    setupLogs.push(logEntry);
    // Keep only last 50 logs
    if (setupLogs.length > 50) {
        setupLogs = setupLogs.slice(-50);
    }
    logger[level](message);
};

router.post("/start", async (req, res) => {
    try {
        const { clientId, clientSecret, redirectUri } = req.body;
        
        addLog("🚀 Setup process started");
        addLog(`📋 Received credentials - Client ID: ${clientId.substring(0, 10)}...`);
        
        if (!clientId || !clientSecret) {
            addLog("❌ Missing required credentials", "error");
            return res.status(400).json({ error: "Client ID and Client Secret are required" });
        }

        addLog("✅ Credentials validated");
        serverStatus = "starting";

        // Clear any existing expired tokens to force fresh OAuth
        try {
            addLog("🗑️ Clearing existing tokens...");
            await Token.deleteMany({});
            addLog("✅ Existing tokens cleared - fresh OAuth required");
        } catch (tokenError) {
            addLog(`⚠️ Failed to clear tokens: ${tokenError.message}`, "warn");
        }

        // Update environment variables
        try {
            addLog("📝 Updating environment variables...");
            const envPath = path.join(__dirname, "../.env");
            let envContent = "";
            
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, "utf8");
                addLog("📄 Existing .env file found");
            } else {
                addLog("📄 Creating new .env file");
            }

            // Update or add environment variables
            const updateEnvVar = (content, key, value) => {
                const regex = new RegExp(`^${key}=.*$`, "m");
                if (regex.test(content)) {
                    return content.replace(regex, `${key}=${value}`);
                } else {
                    return content + `\n${key}=${value}`;
                }
            };

            envContent = updateEnvVar(envContent, "CLIENT_ID", clientId);
            envContent = updateEnvVar(envContent, "CLIENT_SECRET", clientSecret);
            envContent = updateEnvVar(envContent, "REDIRECT_URI", redirectUri);

            fs.writeFileSync(envPath, envContent.trim() + "\n");
            addLog("✅ Environment variables updated");
            
            // Update process.env for current session
            process.env.CLIENT_ID = clientId;
            process.env.CLIENT_SECRET = clientSecret;
            process.env.REDIRECT_URI = redirectUri;
            addLog("✅ Process environment updated");
        } catch (envError) {
            addLog(`❌ Failed to update environment: ${envError.message}`, "error");
            throw envError;
        }

        // Start ngrok tunnel using CLI method (most reliable)
        try {
            addLog("🔌 Starting ngrok tunnel...");
            
            // Kill any existing ngrok processes
            addLog("🧹 Cleaning up existing ngrok processes...");
            await execAsync('pkill -f ngrok || true').catch(() => {});
            
            // Wait for cleanup
            addLog("⏳ Waiting for cleanup...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            addLog("🚀 Launching ngrok CLI with authtoken...");
            
            // Start ngrok CLI in background
            let ngrokProcess;
            let ngrokError = null;
            
            ngrokProcess = exec('ngrok http 3000 --log stdout --authtoken 2ii9l90nohBqNhQxHtHxzb6WOAP_6XoeyEyGiu8eRUnskfej5', (error, stdout, stderr) => {
                if (error) {
                    ngrokError = error;
                    addLog(`⚠️ Ngrok process error: ${error.message}`, "warn");
                    addLog(`⚠️ Ngrok stderr: ${stderr}`, "warn");
                    addLog(`⚠️ Ngrok stdout: ${stdout}`, "warn");
                }
                if (stderr) {
                    addLog(`⚠️ Ngrok stderr: ${stderr}`, "warn");
                }
                if (stdout) {
                    addLog(`📋 Ngrok output: ${stdout.substring(0, 200)}...`, "info");
                }
            });
            
            addLog("⏳ Waiting for ngrok to initialize...");
            // Wait for ngrok to start up
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            addLog("📡 Checking ngrok API for tunnel URL...");
            
            // Try multiple times to get the tunnel URL
            let tunnels = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts && !tunnels) {
                try {
                    attempts++;
                    addLog(`🔍 Attempt ${attempts}/${maxAttempts} to get tunnel info...`);
                    
                    const { stdout, stderr } = await execAsync('curl -s http://localhost:4040/api/tunnels');
                    
                    if (stderr) {
                        addLog(`⚠️ Curl stderr: ${stderr}`, "warn");
                    }
                    
                    if (!stdout || stdout.trim() === '') {
                        addLog("⚠️ Empty response from ngrok API", "warn");
                        if (attempts < maxAttempts) {
                            addLog("⏳ Waiting 3 seconds before retry...", "info");
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            continue;
                        }
                    }
                    
                    addLog(`📥 Ngrok API response: ${stdout.substring(0, 200)}...`);
                    tunnels = JSON.parse(stdout);
                    
                    if (!tunnels.tunnels || tunnels.tunnels.length === 0) {
                        addLog("⚠️ No tunnels in API response", "warn");
                        if (attempts < maxAttempts) {
                            addLog("⏳ Waiting 3 seconds before retry...", "info");
                            tunnels = null; // Reset for retry
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            continue;
                        }
                    }
                    
                } catch (apiError) {
                    addLog(`⚠️ API call error: ${apiError.message}`, "warn");
                    if (attempts < maxAttempts) {
                        addLog("⏳ Waiting 3 seconds before retry...", "info");
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                }
            }
            
            if (!tunnels || !tunnels.tunnels || tunnels.tunnels.length === 0) {
                addLog("❌ Failed to get tunnel URL after all attempts", "error");
                addLog("🔍 Checking if ngrok process is still running...", "info");
                
                try {
                    const { stdout: psOutput } = await execAsync('ps aux | grep ngrok | grep -v grep');
                    if (psOutput.trim()) {
                        addLog(`📋 Ngrok processes found: ${psOutput}`, "info");
                    } else {
                        addLog("❌ No ngrok processes running", "error");
                    }
                } catch (psError) {
                    addLog(`⚠️ Could not check processes: ${psError.message}`, "warn");
                }
                
                throw new Error("No tunnels found after multiple attempts - ngrok may have failed to start");
            }
            
            ngrokUrl = tunnels.tunnels[0].public_url;
            addLog(`✅ Ngrok tunnel established: ${ngrokUrl}`);
            
        } catch (ngrokError) {
            addLog(`❌ Failed to start ngrok: ${ngrokError.message}`, "error");
            addLog(`📊 Error details: ${JSON.stringify(ngrokError)}`, "error");
            serverStatus = "stopped";
            return res.status(500).json({ 
                error: "Failed to start ngrok tunnel: " + ngrokError.message, 
                details: "Make sure your server is running on port 3000 and ngrok is properly installed"
            });
        }

        serverStatus = "running";
        addLog(`🎉 Setup completed successfully!`);
        addLog(`🔗 Webhook URL ready: ${ngrokUrl}/webhook/tradingview`);
        
        res.json({
            success: true,
            ngrokUrl: ngrokUrl,
            message: "Server started successfully. You can now login to Schwab."
        });
        
    } catch (error) {
        addLog(`💥 Setup failed: ${error.message}`, "error");
        addLog(`📊 Full error: ${error.stack}`, "error");
        serverStatus = "stopped";
        res.status(500).json({ error: "Failed to start setup: " + error.message });
    }
});

router.post("/stop", async (req, res) => {
    try {
        logger.info("Stopping server setup...");
        
        // Stop ngrok tunnel
        if (ngrokUrl) {
            try {
                await execAsync('pkill -f ngrok || true');
                logger.info("Ngrok processes terminated");
            } catch (cliError) {
                logger.warn("Error stopping ngrok:", cliError.message);
            }
            
            ngrokUrl = "";
        }
        
        serverStatus = "stopped";
        
        res.json({
            success: true,
            message: "Server stopped successfully"
        });
        
    } catch (error) {
        logger.error("Setup stop error:", error);
        res.status(500).json({ error: "Failed to stop setup: " + error.message });
    }
});

router.get("/status", (req, res) => {
    res.json({
        status: serverStatus,
        ngrokUrl: ngrokUrl
    });
});

router.get("/logs", (req, res) => {
    res.json({
        logs: setupLogs,
        status: serverStatus,
        ngrokUrl: ngrokUrl
    });
});

router.delete("/logs", (req, res) => {
    setupLogs = [];
    res.json({ message: "Logs cleared" });
});

module.exports = router;