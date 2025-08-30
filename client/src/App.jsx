import { useState, useEffect } from "react";
import { Copy, CheckCircle, Settings, Key, Link, AlertCircle } from "lucide-react";
import axios from "axios";

// Determine base URL based on environment
const base_url = window.location.hostname === 'localhost' 
    ? 'https://local.schwabtest.com:3000'
    : 'https://claude-schweb.onrender.com';

function App() {
    const [currentPage, setCurrentPage] = useState("setup"); // setup, dashboard
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginChecked, setLoginChecked] = useState(false);
    const [copied, setCopied] = useState({ webhook: false, json: false });
    
    // Configuration state
    const [config, setConfig] = useState({
        clientId: "",
        clientSecret: "",
        redirectUri: "https://claude-schweb.onrender.com/callback"
    });
    const [configSaved, setConfigSaved] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Sample JSON for TradingView
    const sampleJson = {
        ticker: "{{ticker}}",
        action: "{{strategy.order.action}}",
        quantity: "{{strategy.order.contracts}}",
        strategy: "{{strategy.order.id}}"
    };

    // Check login status and configuration on mount
    useEffect(() => {
        checkLoginStatus();
        checkConfiguration();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const res = await axios.get(`${base_url}/status`);
            if (res.data.loggedIn) {
                setIsLoggedIn(true);
                setCurrentPage("dashboard");
            }
        } catch (error) {
            console.error("Error checking login status:", error);
        } finally {
            setLoginChecked(true);
        }
    };

    const checkConfiguration = async () => {
        try {
            const res = await axios.get(`${base_url}/api/config/status`);
            if (res.data.configured) {
                setConfigSaved(true);
                // Fetch the actual config
                const configRes = await axios.get(`${base_url}/api/config`);
                if (configRes.data.success) {
                    setConfig(prev => ({
                        ...prev,
                        clientId: configRes.data.config.clientId || "",
                        redirectUri: configRes.data.config.redirectUri || prev.redirectUri
                    }));
                }
            }
        } catch (error) {
            console.error("Error checking configuration:", error);
        }
    };

    const handleConfigSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const res = await axios.post(`${base_url}/api/config`, config);
            if (res.data.success) {
                setConfigSaved(true);
                alert("Configuration saved successfully! You can now login to Schwab.");
            }
        } catch (error) {
            alert("Error saving configuration: " + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogin = () => {
        // Redirect to OAuth login
        window.location.href = `${base_url}/login`;
    };

    const handleCopy = (type) => {
        const textToCopy = type === 'webhook' 
            ? `${base_url}/webhook/tradingview`
            : JSON.stringify(sampleJson, null, 2);
        
        navigator.clipboard.writeText(textToCopy);
        setCopied({ ...copied, [type]: true });
        
        setTimeout(() => {
            setCopied({ ...copied, [type]: false });
        }, 2000);
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${base_url}/logout`);
            setIsLoggedIn(false);
            setCurrentPage("setup");
            localStorage.removeItem("isLoggedIn");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Setup Page
    const SetupPage = () => (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Schwab TradingView Integration
                        </h1>
                        <p className="text-gray-600">Configure your Schwab API credentials</p>
                    </div>

                    {!configSaved ? (
                        <form onSubmit={handleConfigSubmit} className="space-y-6">
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                    <Key className="w-4 h-4 mr-2" />
                                    Client ID
                                </label>
                                <input
                                    type="text"
                                    value={config.clientId}
                                    onChange={(e) => setConfig({...config, clientId: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your Schwab Client ID"
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                    <Key className="w-4 h-4 mr-2" />
                                    Client Secret
                                </label>
                                <input
                                    type="password"
                                    value={config.clientSecret}
                                    onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your Schwab Client Secret"
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                    <Link className="w-4 h-4 mr-2" />
                                    Redirect URI
                                </label>
                                <input
                                    type="text"
                                    value={config.redirectUri}
                                    onChange={(e) => setConfig({...config, redirectUri: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://claude-schweb.onrender.com/callback"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This should match your Schwab app settings
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving..." : "Save Configuration"}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                    <p className="text-green-800">Configuration saved successfully!</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleLogin}
                                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    Login with Schwab
                                </button>
                                
                                <button
                                    onClick={() => setConfigSaved(false)}
                                    className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Update Configuration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Dashboard Page
    const DashboardPage = () => (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Integration Dashboard
                            </h1>
                            <p className="text-gray-600">Your webhook is ready to use!</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Webhook URL Box */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Webhook URL
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm break-all">
                                {base_url}/webhook/tradingview
                            </div>
                            <button
                                onClick={() => handleCopy('webhook')}
                                className="mt-4 w-full flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {copied.webhook ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Webhook URL
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                Add this URL to your TradingView alert
                            </p>
                        </div>

                        {/* JSON Template Box */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                TradingView Alert Message
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 font-mono text-xs">
                                <pre>{JSON.stringify(sampleJson, null, 2)}</pre>
                            </div>
                            <button
                                onClick={() => handleCopy('json')}
                                className="mt-4 w-full flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {copied.json ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy JSON Template
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                Paste this in the alert message field
                            </p>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 bg-blue-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            <AlertCircle className="inline w-5 h-5 mr-2 text-blue-600" />
                            Quick Setup Instructions
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                            <li>Copy the webhook URL above</li>
                            <li>In TradingView, create or edit an alert</li>
                            <li>Check "Webhook URL" and paste the URL</li>
                            <li>Copy the JSON template and paste it in the Message field</li>
                            <li>Save your alert and you're ready to trade!</li>
                        </ol>
                    </div>

                    {/* Status Indicators */}
                    <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-gray-600">Connected to Schwab</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-gray-600">Webhook Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Loading state
    if (!loginChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    // Render appropriate page
    return currentPage === "dashboard" && isLoggedIn ? <DashboardPage /> : <SetupPage />;
}

export default App;