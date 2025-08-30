import { useState, useEffect } from "react";
import { Copy, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import axios from "axios";

// Determine base URL based on environment
const base_url = window.location.hostname === 'localhost' 
    ? 'https://local.schwabtest.com:3000'
    : 'https://claude-schweb.onrender.com';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginChecked, setLoginChecked] = useState(false);
    const [copied, setCopied] = useState({ webhook: false, json: false });
    
    // Sample JSON for TradingView - properly formatted
    const sampleJson = `{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "quantity": "{{strategy.order.contracts}}",
  "strategy": "{{strategy.order.id}}"
}`;

    // Check login status on mount
    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const res = await axios.get(`${base_url}/status`);
            if (res.data.loggedIn) {
                setIsLoggedIn(true);
            }
        } catch (error) {
            console.error("Error checking login status:", error);
        } finally {
            setLoginChecked(true);
        }
    };

    const handleLogin = () => {
        window.location.href = `${base_url}/login`;
    };

    const handleCopy = (type) => {
        const textToCopy = type === 'webhook' 
            ? `${base_url}/webhook/tradingview`
            : sampleJson;
        
        navigator.clipboard.writeText(textToCopy);
        setCopied({ ...copied, [type]: true });
        
        setTimeout(() => {
            setCopied(prev => ({ ...prev, [type]: false }));
        }, 2000);
    };

    const handleLogout = async () => {
        try {
            // Just clear local state - backend doesn't have logout endpoint yet
            setIsLoggedIn(false);
            localStorage.removeItem("isLoggedIn");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Loading state
    if (!loginChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    // Login Page - Show this when not logged in
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            Schwab TradingView Integration
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Connect your Schwab account to automate TradingView alerts
                        </p>
                        
                        <button
                            onClick={handleLogin}
                            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-lg"
                        >
                            Login with Schwab
                        </button>
                        
                        <p className="text-xs text-gray-500 mt-6">
                            You'll be redirected to Schwab to authorize the connection
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard Page - Show this when logged in
    return (
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
                            className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
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
                                <pre className="whitespace-pre-wrap">{sampleJson}</pre>
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
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-gray-600">Connected to Schwab</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-gray-600">Webhook Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;