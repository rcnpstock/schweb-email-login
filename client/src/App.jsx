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

    // Check login status on mount
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await axios.get(`${base_url}/oauth/status`);
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

    // Handle /oauth/success route
    useEffect(() => {
        if (window.location.pathname === "/oauth/success") {
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
        window.location.href = `${base_url}/oauth/login`;
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem("isLoggedIn");
        setOrderMessage("");
    };

    const placeOrder = async () => {
        if (!symbol || !quantity || !instruction) return;
        setIsSubmitting(true);
        setOrderMessage("");
        try {
            await axios.post(
                `${base_url}/webhook/place-order`,
                {
                    symbol: symbol.trim(),
                    quantity: Number(quantity),
                    instruction: instruction,
                },
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );
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
                    {/* Login/Logout Button */}
                    {!isLoggedIn ? (
                        <button
                            onClick={handleLogin}
                            className="mt-8 px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg text-lg transition-all duration-200 cursor-pointer"
                        >
                            Login with Schwab
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="mt-8 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg text-lg transition-all duration-200"
                        >
                            Logout
                        </button>
                    )}
                </div>

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
