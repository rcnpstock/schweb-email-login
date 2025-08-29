import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Zap,
    ChevronDown,
} from "lucide-react";
import { base_url } from "./utils/baseUrl";
import axios from "axios";

function App() {
    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [instruction, setInstruction] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(
        localStorage.getItem("isLoggedIn") === "true"
    );
    const [loginChecked, setLoginChecked] = useState(false);
    const [orderMessage, setOrderMessage] = useState("");
    
    // Configuration state
    const [showConfig, setShowConfig] = useState(false);
    const [ngrokUrl, setNgrokUrl] = useState("");
    const [serverStatus, setServerStatus] = useState("stopped");
    const [configData, setConfigData] = useState({
        clientId: "",
        clientSecret: "",
        redirectUri: "https://local.schwabtest.com:3000/callback"
    });
    const [logs, setLogs] = useState([]);

    // Check login status on mount
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await axios.get(`${base_url}/status`);
                // const res = await axios.get(`${base_url}/oauth/status`);
                if (res.data.loggedIn) {
                    setIsLoggedIn(true);
                    localStorage.setItem("isLoggedIn", "true");
                } else {
                    setIsLoggedIn(false);
                    localStorage.removeItem("isLoggedIn");
                }
            } catch {
                setIsLoggedIn(false);
                localStorage.removeItem("isLoggedIn");
            } finally {
                setLoginChecked(true);
            }
        };
        checkLogin();
    }, []);

    // Check server status on mount
    useEffect(() => {
        checkServerStatus();
    }, []);

    // Handle /oauth/success route
    useEffect(() => {
        if (window.location.pathname === "/success") {
        // if (window.location.pathname === "/oauth/success") {
            setIsLoggedIn(true);
            localStorage.setItem("isLoggedIn", "true");
            setOrderMessage(
                "✅ Schwab account connected! You can now place orders."
            );
            // Optionally, redirect to home after a short delay
            setTimeout(() => {
                window.history.replaceState({}, document.title, "/");
            }, 2000);
        }
    }, []);

    const handleLogin = () => {
        window.location.href = `${base_url}/login`;
        // window.location.href = `${base_url}/oauth/login`;
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem("isLoggedIn");
        setOrderMessage("");
    };

    const startServer = async () => {
        try {
            setServerStatus("starting");
            setLogs([]); // Clear previous logs
            
            // Start fetching logs every 2 seconds while starting
            const logInterval = setInterval(fetchLogs, 2000);
            
            const response = await axios.post(`${base_url}/setup/start`, configData);
            
            clearInterval(logInterval);
            await fetchLogs(); // Get final logs
            
            if (response.data.success) {
                setServerStatus("running");
                setNgrokUrl(response.data.ngrokUrl);
                setOrderMessage("✅ Server started! Ready for TradingView webhooks.");
            }
        } catch (error) {
            setServerStatus("stopped");
            await fetchLogs(); // Get error logs
            setOrderMessage("❌ Failed to start server: " + (error.response?.data?.error || error.message));
        }
    };

    const stopServer = async () => {
        try {
            await axios.post(`${base_url}/setup/stop`);
            setServerStatus("stopped");
            setNgrokUrl("");
            setOrderMessage("Server stopped.");
        } catch (error) {
            setOrderMessage("Error stopping server: " + (error.response?.data?.error || error.message));
        }
    };

    const checkServerStatus = async () => {
        try {
            const response = await axios.get(`${base_url}/setup/status`);
            setServerStatus(response.data.status);
            setNgrokUrl(response.data.ngrokUrl || "");
        } catch (error) {
            setServerStatus("stopped");
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await axios.get(`${base_url}/setup/logs`);
            setLogs(response.data.logs);
            setServerStatus(response.data.status);
            setNgrokUrl(response.data.ngrokUrl || "");
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        }
    };

    const clearLogs = async () => {
        try {
            await axios.delete(`${base_url}/setup/logs`);
            setLogs([]);
        } catch (error) {
            console.error("Failed to clear logs:", error);
        }
    };

    const placeOrder = async () => {
        if (!symbol || !quantity || !instruction) return;
        setIsSubmitting(true);
        setOrderMessage("");
        try {
            await axios.post(`${base_url}/webhook/place-order`, {
                symbol: symbol.trim(),
                quantity: Number(quantity),
                instruction: instruction,
            });
            setOrderMessage("✅ Order placed successfully!");
            setSymbol("");
            setQuantity("");
            setInstruction("");
        } catch (error) {
            setOrderMessage(
                error.response?.data?.error || "Order failed. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!loginChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl">
                Checking login status...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <Zap className="w-12 h-12 text-green-400 animate-pulse" />
                            <div className="absolute inset-0 w-12 h-12 bg-green-400/20 rounded-full blur-lg"></div>
                        </div>
                    </div>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-green-400 mb-4 tracking-tight">
                        TRADING<span className="text-green-400">HUB</span>
                    </h1>
                    <p className="text-xl text-gray-300 font-light tracking-wide">
                        Execute trades with precision and style
                    </p>
                    <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto mt-6 rounded-full"></div>
                    {/* Action Buttons */}
                    <div className="mt-8 space-x-4">
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg text-lg transition-all duration-200"
                        >
                            {showConfig ? 'Hide Setup' : 'Setup TradingView Integration'}
                        </button>
                        
                        {!isLoggedIn ? (
                            <button
                                onClick={handleLogin}
                                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg text-lg transition-all duration-200 cursor-pointer"
                            >
                                Login with Schwab
                            </button>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg text-lg transition-all duration-200"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>

                {/* Configuration Panel */}
                {showConfig && (
                    <div className="max-w-4xl mx-auto mb-8">
                        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-3xl font-bold text-white mb-6">TradingView Integration Setup</h2>
                            
                            {/* Configuration Form */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        Schwab Client ID
                                    </label>
                                    <input
                                        type="text"
                                        value={configData.clientId}
                                        onChange={(e) => setConfigData({...configData, clientId: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your Schwab Client ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        Schwab Client Secret
                                    </label>
                                    <input
                                        type="password"
                                        value={configData.clientSecret}
                                        onChange={(e) => setConfigData({...configData, clientSecret: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your Schwab Client Secret"
                                    />
                                </div>
                            </div>

                            {/* Server Status */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-white">Server Status</h3>
                                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        serverStatus === 'running' ? 'bg-green-500/20 text-green-400' :
                                        serverStatus === 'starting' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        {serverStatus.toUpperCase()}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={startServer}
                                            disabled={serverStatus === 'running' || serverStatus === 'starting' || !configData.clientId || !configData.clientSecret}
                                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
                                        >
                                            {serverStatus === 'starting' ? 'Starting...' : 'Start Server & Login'}
                                        </button>
                                        <button
                                            onClick={stopServer}
                                            disabled={serverStatus !== 'running'}
                                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
                                        >
                                            Stop Server
                                        </button>
                                    </div>

                                    {/* Ngrok URL Display */}
                                    {ngrokUrl && (
                                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            <h4 className="text-green-400 font-semibold mb-2">TradingView Webhook URL:</h4>
                                            <div className="flex items-center space-x-2">
                                                <code className="flex-1 bg-gray-800 px-3 py-2 rounded text-green-300 text-sm break-all">
                                                    {ngrokUrl}/webhook/tradingview
                                                </code>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`${ngrokUrl}/webhook/tradingview`)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-all duration-200"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="text-gray-400 text-sm mt-2">
                                                Use this URL in your TradingView webhook alerts
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TradingView Integration Guide */}
                            {ngrokUrl && (
                                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <h4 className="text-blue-400 font-semibold mb-3">TradingView Setup Instructions:</h4>
                                    <div className="space-y-2 text-sm text-gray-300">
                                        <p>1. Copy the webhook URL above</p>
                                        <p>2. In TradingView, create an alert and set the webhook URL</p>
                                        <p>3. In the message field, use this JSON format:</p>
                                        <div className="bg-gray-800 p-3 rounded mt-2 font-mono text-xs">
                                            {`{
  "ticker": "{{ticker}}",
  "action": "buy",
  "quantity": 1,
  "strategy": "{{strategy.order.comment}}"
}`}
                                        </div>
                                        <p className="mt-2">
                                            <strong>Actions supported:</strong> "buy", "sell", "long", "short"<br/>
                                            <strong>Optional fields:</strong> quantity (defaults to 1), strategy
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Setup Logs */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-white font-semibold">Setup Logs</h4>
                                    <div className="space-x-2">
                                        <button
                                            onClick={fetchLogs}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-all duration-200"
                                        >
                                            Refresh
                                        </button>
                                        <button
                                            onClick={clearLogs}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-all duration-200"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                                    {logs.length === 0 ? (
                                        <div className="text-gray-500 italic">No logs yet. Click "Start Server & Login" to see detailed progress.</div>
                                    ) : (
                                        logs.map((log, index) => (
                                            <div key={index} className={`mb-1 ${
                                                log.level === 'error' ? 'text-red-400' :
                                                log.level === 'warn' ? 'text-yellow-400' :
                                                'text-green-300'
                                            }`}>
                                                <span className="text-gray-500 text-xs mr-2">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </span>
                                                {log.message}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Show order form only if logged in */}
                {isLoggedIn ? (
                    <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/50 to-purple-500/50 rounded-2xl blur-lg opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>

                            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl group-hover:border-purple-500/30 transition-all duration-500">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <TrendingDown className="w-8 h-8 text-purple-400" />
                                            <div className="absolute inset-0 w-8 h-8 bg-purple-400/20 rounded-full blur-md"></div>
                                        </div>
                                        <h2 className="text-3xl font-bold text-white tracking-tight">
                                            Place Order
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative space-y-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <TrendingUp className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={symbol}
                                                onChange={(e) =>
                                                    setSymbol(e.target.value)
                                                }
                                                placeholder="Enter symbol (e.g. AAPL)"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <DollarSign className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={quantity}
                                                onWheel={(e) => e.target.blur()}
                                                onChange={(e) =>
                                                    setQuantity(e.target.value)
                                                }
                                                placeholder="Enter quantity"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white text-lg font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                                <ChevronDown className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <select
                                                value={instruction}
                                                onChange={(e) =>
                                                    setInstruction(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full pl-12 pr-12 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled>
                                                    Select Action
                                                </option>
                                                <option value="BUY">BUY</option>
                                                <option value="SELL">
                                                    SELL
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={placeOrder}
                                        disabled={
                                            isSubmitting ||
                                            !symbol ||
                                            !quantity ||
                                            !instruction
                                        }
                                        className="w-full relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        <span className="relative z-10 text-lg tracking-wide">
                                            {isSubmitting
                                                ? "PROCESSING..."
                                                : "EXECUTE ORDER"}
                                        </span>
                                    </button>
                                    {orderMessage && (
                                        <div className="mt-4 text-center text-lg text-green-400 font-semibold">
                                            {orderMessage}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-300 text-xl font-medium mt-12">
                        Please login with Schwab to place orders.
                    </div>
                )}

                <div className="text-center mt-16">
                    <p className="text-gray-500 text-sm tracking-wider">
                        POWERED BY ADVANCED TRADING ALGORITHMS
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
