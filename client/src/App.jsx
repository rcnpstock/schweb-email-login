import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Copy, CheckCircle, AlertCircle, LogOut, Settings, Key, Shield } from "lucide-react";
import axios from "axios";

// Determine base URL based on environment
const base_url = window.location.hostname === 'localhost' 
    ? 'https://local.schwabtest.com:3000'
    : window.location.origin;

// Setup Page Component
function SetupPage() {
    const [setupData, setSetupData] = useState({
        clientId: '',
        clientSecret: '',
        redirectUri: `https://schweb-email-login.onrender.com/callback`
    });

    const handleSetupSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${base_url}/api/config`, setupData);
            if (response.data.success) {
                alert("Configuration saved successfully!");
                // Redirect to home page
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error saving configuration:", error);
            alert("Failed to save configuration. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center px-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                        <Settings className="text-white" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        API Configuration
                    </h1>
                    <p className="text-purple-200">
                        Connect your Schwab Developer credentials
                    </p>
                </div>
                
                <form onSubmit={handleSetupSubmit} className="space-y-6">
                    {/* Client ID Field */}
                    <div>
                        <label className="flex items-center text-sm font-medium text-purple-200 mb-2">
                            <Key className="mr-2" size={16} />
                            Client ID
                        </label>
                        <input
                            type="text"
                            value={setupData.clientId}
                            onChange={(e) => setSetupData({...setupData, clientId: e.target.value})}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-300 transition-all duration-300"
                            placeholder="Enter your Schwab Client ID"
                            required
                        />
                    </div>
                    
                    {/* Client Secret Field */}
                    <div>
                        <label className="flex items-center text-sm font-medium text-purple-200 mb-2">
                            <Shield className="mr-2" size={16} />
                            Client Secret
                        </label>
                        <input
                            type="password"
                            value={setupData.clientSecret}
                            onChange={(e) => setSetupData({...setupData, clientSecret: e.target.value})}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-300 transition-all duration-300"
                            placeholder="Enter your Schwab Client Secret"
                            required
                        />
                    </div>
                    
                    {/* Redirect URI Field */}
                    <div>
                        <label className="flex items-center text-sm font-medium text-purple-200 mb-2">
                            <AlertCircle className="mr-2" size={16} />
                            Redirect URI
                        </label>
                        <input
                            type="url"
                            value={setupData.redirectUri}
                            onChange={(e) => setSetupData({...setupData, redirectUri: e.target.value})}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-300 transition-all duration-300"
                            placeholder="OAuth Redirect URI"
                            required
                        />
                    </div>
                    
                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-bold text-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                    >
                        Save & Configure
                    </button>
                </form>
                
                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-purple-300 text-sm">
                        🔒 Secure • Get credentials from Schwab Developer Portal
                    </p>
                </div>
            </div>
        </div>
    );
}

// Login Page Component
function LoginPage() {
    const handleLogin = () => {
        window.location.href = `${base_url}/login`;
    };

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
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-lg shadow-lg transform hover:scale-105"
                    >
                        Login with Schwab
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-6">
                        You'll be redirected to Schwab to authorize the connection
                    </p>
                    
                    <a
                        href="/setup"
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline block"
                    >
                        Need to configure API credentials?
                    </a>
                </div>
            </div>
        </div>
    );
}

// Dashboard Component
function Dashboard() {
    const [copied, setCopied] = useState({ webhook: false, json: false });
    
    // Sample JSON for TradingView - properly formatted
    const sampleJson = `{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "quantity": "{{strategy.order.contracts}}",
  "strategy": "{{strategy.order.id}}"
}`;

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
            localStorage.removeItem("isLoggedIn");
            window.location.href = '/';
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const handleDeleteAllTokens = async () => {
        try {
            const response = await axios.delete(`${base_url}/tokens`);
            if (response.data.success) {
                localStorage.removeItem("isLoggedIn");
                alert("All refresh tokens have been deleted successfully!");
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error deleting tokens:", error);
            alert("Failed to delete tokens. Please try again.");
        }
    };

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
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteAllTokens}
                                className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                            >
                                Delete All Tokens
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
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
                                className="mt-4 w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg transform hover:scale-105"
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
                                className="mt-4 w-full flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg transform hover:scale-105"
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

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/" element={<LoginPage />} />
            </Routes>
        </Router>
    );
}

export default App;