import { useState, useEffect } from "react";
import { Copy, CheckCircle, AlertCircle, LogOut, Settings, Key, Shield, Sparkles } from "lucide-react";
import axios from "axios";

// Determine base URL based on environment
const base_url = window.location.hostname === 'localhost' 
    ? 'https://local.schwabtest.com:3000'
    : window.location.origin;

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginChecked, setLoginChecked] = useState(false);
    const [copied, setCopied] = useState({ webhook: false, json: false });
    const [showSetup, setShowSetup] = useState(false);
    const [setupData, setSetupData] = useState({
        clientId: '',
        clientSecret: '',
        redirectUri: `${window.location.origin}/callback`
    });
    
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
            // Check login status
            const res = await axios.get(`${base_url}/status`);
            if (res.data.loggedIn) {
                setIsLoggedIn(true);
                return;
            }
        } catch (error) {
            console.error("Error checking login status:", error);
        }

        // Check if configuration exists
        try {
            const configRes = await axios.get(`${base_url}/api/config/status`);
            if (!configRes.data.configured || !configRes.data.hasCredentials) {
                setShowSetup(true);
            }
        } catch (error) {
            console.error("Configuration check error:", error);
            // If config endpoint fails, assume setup is needed
            setShowSetup(true);
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

    const handleDeleteAllTokens = async () => {
        try {
            const response = await axios.delete(`${base_url}/tokens`);
            if (response.data.success) {
                // After deleting tokens, user is effectively logged out
                setIsLoggedIn(false);
                localStorage.removeItem("isLoggedIn");
                alert("All refresh tokens have been deleted successfully!");
            }
        } catch (error) {
            console.error("Error deleting tokens:", error);
            alert("Failed to delete tokens. Please try again.");
        }
    };

    const handleSetupSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${base_url}/api/config`, setupData);
            if (response.data.success) {
                alert("Configuration saved successfully!");
                setShowSetup(false);
                // Refresh the page to check login status again
                window.location.reload();
            }
        } catch (error) {
            console.error("Error saving configuration:", error);
            alert("Failed to save configuration. Please try again.");
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

    // Setup Page - Show this when configuration is needed
    if (showSetup) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
                </div>
                
                {/* Stars/sparkles */}
                <div className="absolute inset-0 overflow-hidden">
                    <Sparkles className="absolute top-20 left-20 text-white opacity-30 animate-pulse" size={16} />
                    <Sparkles className="absolute top-40 right-32 text-purple-300 opacity-40 animate-pulse" size={12} style={{animationDelay: '1s'}} />
                    <Sparkles className="absolute bottom-32 left-1/4 text-cyan-300 opacity-35 animate-pulse" size={14} style={{animationDelay: '3s'}} />
                    <Sparkles className="absolute top-1/3 right-1/4 text-pink-300 opacity-30 animate-pulse" size={18} style={{animationDelay: '2s'}} />
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 max-w-lg w-full transform hover:scale-105 transition-all duration-500">
                        {/* Header with icon */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 shadow-lg">
                                <Settings className="text-white animate-spin" size={32} style={{animation: 'spin 3s linear infinite'}} />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
                                API Configuration
                            </h1>
                            <p className="text-purple-100 text-lg">
                                Connect your Schwab Developer credentials
                            </p>
                            <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mt-4"></div>
                        </div>
                        
                        <form onSubmit={handleSetupSubmit} className="space-y-6">
                            {/* Client ID Field */}
                            <div className="group">
                                <label className="flex items-center text-sm font-semibold text-purple-200 mb-3">
                                    <Key className="mr-2" size={16} />
                                    Client ID
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={setupData.clientId}
                                        onChange={(e) => setSetupData({...setupData, clientId: e.target.value})}
                                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-300 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                                        placeholder="Enter your Schwab Client ID"
                                        required
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                </div>
                            </div>
                            
                            {/* Client Secret Field */}
                            <div className="group">
                                <label className="flex items-center text-sm font-semibold text-purple-200 mb-3">
                                    <Shield className="mr-2" size={16} />
                                    Client Secret
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={setupData.clientSecret}
                                        onChange={(e) => setSetupData({...setupData, clientSecret: e.target.value})}
                                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-300 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                                        placeholder="Enter your Schwab Client Secret"
                                        required
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                </div>
                            </div>
                            
                            {/* Redirect URI Field */}
                            <div className="group">
                                <label className="flex items-center text-sm font-semibold text-purple-200 mb-3">
                                    <AlertCircle className="mr-2" size={16} />
                                    Redirect URI
                                </label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={setupData.redirectUri}
                                        onChange={(e) => setSetupData({...setupData, redirectUri: e.target.value})}
                                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-300 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                                        placeholder="OAuth Redirect URI"
                                        required
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                </div>
                            </div>
                            
                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-105 hover:rotate-1 relative overflow-hidden group"
                                >
                                    <span className="relative z-10 flex items-center justify-center">
                                        <Settings className="mr-2 group-hover:animate-spin" size={20} />
                                        Save & Configure
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </button>
                            </div>
                        </form>
                        
                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <div className="inline-flex items-center justify-center space-x-2 text-purple-200 text-sm">
                                <Shield size={14} />
                                <span>Secure • Encrypted • Developer Portal</span>
                                <Shield size={14} />
                            </div>
                            <p className="text-purple-300 text-xs mt-2">
                                Get your credentials from the Schwab Developer Portal
                            </p>
                        </div>
                    </div>
                </div>
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
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-lg shadow-lg transform hover:scale-105"
                        >
                            Login with Schwab
                        </button>
                        
                        <p className="text-xs text-gray-500 mt-6">
                            You'll be redirected to Schwab to authorize the connection
                        </p>
                        
                        <button
                            onClick={() => setShowSetup(true)}
                            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Need to configure API credentials?
                        </button>
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
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteAllTokens}
                                className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                            >
                                delete all token
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