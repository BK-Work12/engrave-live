import { useState } from "react";
import { usePage, router } from "@inertiajs/react";
import PrimaryButton from "./PrimaryButton";

// Import all feature components
import SeamlessPatternCreator from "../pages/SeamlessPatternCreator";
import AIDesignGenerator from "../pages/AIDesignGenerator";
import OutlineGenerator from "../pages/OutlineGenerator";
import SVGTracingTool from "../pages/SVGTracingTool";
import Generator from "../pages/Generator";
import PatternUpload from "../pages/PatternUpload";
import PatternMarketplace from "../pages/PatternMarketplace";
import HowItWorks from "../pages/HowItWorks";
import StyleExamples from "../pages/StyleExamples";
import FAQ from "../pages/FAQ";
import Pricing from "../pages/Pricing";

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedFeature, setSelectedFeature] = useState("dashboard");
    const { props } = usePage();
    const { user } = props.auth;

    const handleLogout = () => {
        router.post('/logout');
    };

    const menuItems = [
        {
            category: "Creation Tools",
            items: [
                { id: "seamless-patterns", name: "Seamless Patterns", icon: "🎨", component: SeamlessPatternCreator },
                { id: "ai-design", name: "AI Design Generator", icon: "✨", component: AIDesignGenerator },
                { id: "outline-gen", name: "Outline Generator", icon: "📝", component: OutlineGenerator },
                { id: "svg-tracing", name: "SVG Tracing Tool", icon: "🔀", component: SVGTracingTool },
                { id: "pattern-gen", name: "Pattern Generator", icon: "⚙️", component: Generator },
            ]
        },
        {
            category: "Pattern Management",
            items: [
                { id: "pattern-upload", name: "Pattern Upload", icon: "📤", component: PatternUpload },
                { id: "my-patterns", name: "My Patterns", icon: "📚", component: PatternMarketplace },
            ]
        },
        {
            category: "Learn & Support",
            items: [
                { id: "how-it-works", name: "How It Works", icon: "❓", component: HowItWorks },
                { id: "style-examples", name: "Style Examples", icon: "🖼️", component: StyleExamples },
                { id: "faq", name: "FAQ", icon: "💬", component: FAQ },
                { id: "pricing", name: "Pricing", icon: "💳", component: Pricing },
            ]
        }
    ];

    const allItems = menuItems.flatMap(m => m.items);
    const selectedItem = allItems.find(item => item.id === selectedFeature);
    const SelectedComponent = selectedItem?.component;

    const getFeatureTitle = () => {
        if (selectedFeature === "dashboard") return "Dashboard";
        return selectedItem?.name || "Dashboard";
    };

    const DashboardOverview = () => (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-[#1a2052] to-[#0f1537] rounded-xl p-8 border border-[#2a3052]">
                <h1 className="text-4xl font-bold text-white mb-3">Welcome back, {user?.name}! 👋</h1>
                <p className="text-[#9CA3AF] text-lg">
                    You have access to all creative tools. Select any feature from the sidebar to get started.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-6 hover:border-blue-600/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-medium mb-2">Available Tools</p>
                            <p className="text-4xl font-bold text-blue-400">{allItems.length}</p>
                        </div>
                        <div className="text-5xl opacity-20">🛠️</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-700/30 rounded-lg p-6 hover:border-purple-600/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-medium mb-2">Unlimited Generations</p>
                            <p className="text-4xl font-bold text-purple-400">∞</p>
                        </div>
                        <div className="text-5xl opacity-20">🚀</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/10 border border-pink-700/30 rounded-lg p-6 hover:border-pink-600/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-medium mb-2">AI-Powered</p>
                            <p className="text-4xl font-bold text-pink-400">100%</p>
                        </div>
                        <div className="text-5xl opacity-20">⚡</div>
                    </div>
                </div>
            </div>

            {/* Featured Tools Section */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">All Tools</h2>
                <p className="text-[#9CA3AF] mb-6">Click on any tool to start creating</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allItems.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => setSelectedFeature(feature.id)}
                            className="group relative overflow-hidden rounded-lg p-6 bg-[#1a2052] border border-[#2a3052] hover:border-blue-500/50 transition-all duration-300 text-left hover:shadow-lg hover:shadow-blue-500/10"
                        >
                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#0f1537] mb-4 group-hover:bg-blue-500/20 transition">
                                    <span className="text-2xl">{feature.icon}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition">
                                    {feature.name}
                                </h3>
                                <p className="text-sm text-[#9CA3AF] group-hover:text-[#D6D6D6] transition">
                                    Click to open
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Getting Started Section */}
            <div className="bg-[#1a2052] rounded-lg border border-[#2a3052] p-8">
                <h3 className="text-xl font-bold text-white mb-4">🚀 Getting Started</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex gap-4">
                        <div className="text-3xl">1️⃣</div>
                        <div>
                            <p className="font-semibold text-white">Select a Tool</p>
                            <p className="text-sm text-[#9CA3AF]">Choose from creation tools in the sidebar</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-3xl">2️⃣</div>
                        <div>
                            <p className="font-semibold text-white">Upload Files</p>
                            <p className="text-sm text-[#9CA3AF]">Upload your images or designs</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-3xl">3️⃣</div>
                        <div>
                            <p className="font-semibold text-white">Generate & Export</p>
                            <p className="text-sm text-[#9CA3AF]">Create and download your results</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#0a0e27]">
            {/* Sidebar */}
            <div
                className={`${
                    sidebarOpen ? "w-72" : "w-24"
                } bg-gradient-to-b from-[#0f1537] to-[#0a0e27] border-r border-[#2a3052] transition-all duration-300 ease-in-out overflow-y-auto flex flex-col`}
            >
                {/* Logo Section */}
                <div className="p-5 border-b border-[#2a3052] flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={() => setSelectedFeature("dashboard")}
                        className="logo cursor-pointer flex-shrink-0 hover:opacity-80 transition"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={sidebarOpen ? 36 : 28}
                            height={sidebarOpen ? 36 : 28}
                            viewBox="0 0 40 39"
                            fill="none"
                        >
                            <path
                                d="M20 1.75H14.1667C12.6196 1.75 11.1358 2.36458 10.0419 3.45854C8.94793 4.55251 8.33334 6.03624 8.33334 7.58333C8.33334 9.13043 8.94793 10.6142 10.0419 11.7081C11.1358 12.8021 12.6196 13.4167 14.1667 13.4167M20 1.75V13.4167M20 1.75H25.8333C26.5994 1.75 27.3579 1.90088 28.0657 2.19404C28.7734 2.48719 29.4165 2.91687 29.9581 3.45854C30.4998 4.00022 30.9295 4.64328 31.2226 5.35101C31.5158 6.05875 31.6667 6.81729 31.6667 7.58333C31.6667 8.34938 31.5158 9.10792 31.2226 9.81565C30.9295 10.5234 30.4998 11.1664 29.9581 11.7081C29.4165 12.2498 28.7734 12.6795 28.0657 12.9726C27.3579 13.2658 26.5994 13.4167 25.8333 13.4167M20 13.4167H14.1667M20 13.4167H25.8333M20 13.4167V25.0833M14.1667 13.4167C12.6196 13.4167 11.1358 14.0312 10.0419 15.1252C8.94793 16.2192 8.33334 17.7029 8.33334 19.25C8.33334 20.7971 8.94793 22.2808 10.0419 23.3748C11.1358 24.4688 12.6196 25.0833 14.1667 25.0833M25.8333 13.4167C25.0673 13.4167 24.3088 13.5675 23.601 13.8607C22.8933 14.1539 22.2502 14.5835 21.7086 15.1252C21.1669 15.6669 20.7372 16.3099 20.444 17.0177C20.1509 17.7254 20 18.484 20 19.25C20 20.016 20.1509 20.7746 20.444 21.4823C20.7372 22.1901 21.1669 22.8331 21.7086 23.3748C22.2502 23.9165 22.8933 24.3461 23.601 24.6393C24.3088 24.9324 25.0673 25.0833 25.8333 25.0833C26.5994 25.0833 27.3579 24.9324 28.0657 24.6393C28.7734 24.3461 29.4165 23.9165 29.9581 23.3748C30.4998 22.8331 30.9295 22.1901 31.2226 21.4823C31.5158 20.7746 31.6667 20.016 31.6667 19.25C31.6667 18.484 31.5158 17.7254 31.2226 17.0177C30.9295 16.3099 30.4998 15.6669 29.9581 15.1252C29.4165 14.5835 28.7734 14.1539 28.0657 13.8607C27.3579 13.5675 26.5994 13.4167 25.8333 13.4167ZM14.1667 25.0833C12.6196 25.0833 11.1358 25.6979 10.0419 26.7919C8.94793 27.8858 8.33334 29.3696 8.33334 30.9167C8.33334 32.4638 8.94793 33.9475 10.0419 35.0415C11.1358 36.1354 12.6196 36.75 14.1667 36.75C15.7138 36.75 17.1975 36.1354 18.2915 35.0415C19.3854 33.9475 20 32.4638 20 30.9167V25.0833M14.1667 25.0833H20"
                                stroke="#FEFEFE"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 hover:bg-[#1a2052] rounded-lg transition"
                            title="Collapse sidebar"
                        >
                            <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto px-3 py-6">
                    {menuItems.map((menu, idx) => (
                        <div key={idx} className={idx > 0 ? "mt-2" : ""}>
                            {sidebarOpen && (
                                <div className="flex items-center gap-2 px-3 py-2 mb-3">
                                    <div className="flex-1 h-px bg-gradient-to-r from-[#2a3052] to-transparent"></div>
                                    <h3 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider truncate">
                                        {menu.category === "Creation Tools" && "✨ Create"}
                                        {menu.category === "Pattern Management" && "📦 Manage"}
                                        {menu.category === "Learn & Support" && "📚 Learn"}
                                    </h3>
                                </div>
                            )}
                            <div className={sidebarOpen ? "space-y-2" : "space-y-1"}>
                                {menu.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedFeature(item.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                            selectedFeature === item.id
                                                ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20"
                                                : "text-[#9CA3AF] hover:text-white hover:bg-[#1a2052] border border-transparent"
                                        }`}
                                        title={item.name}
                                    >
                                        <span className={`text-xl flex-shrink-0 transition-transform ${selectedFeature === item.id ? "scale-110" : ""}`}>
                                            {item.icon}
                                        </span>
                                        {sidebarOpen && (
                                            <span className="text-sm font-medium truncate">{item.name}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile Section */}
                {sidebarOpen && (
                    <div className="border-t border-[#2a3052] p-4 mt-auto bg-gradient-to-b from-transparent to-[#1a2052]/30">
                        <div className="flex items-center gap-3 px-2 py-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                <p className="text-xs text-[#9CA3AF] truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Expand Button */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-full p-4 hover:bg-[#1a2052] transition border-t border-[#2a3052]"
                        title="Expand sidebar"
                    >
                        <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="bg-[#0f1537] border-b border-[#1a2052] px-8 py-4 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-[#1a2052] rounded transition lg:hidden"
                        >
                            <svg className="w-6 h-6 text-[#D6D6D6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        {selectedFeature !== "dashboard" && (
                            <div className="hidden sm:block">
                                <p className="text-sm text-[#9CA3AF]">Dashboard</p>
                                <p className="text-lg font-semibold text-white">{getFeatureTitle()}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[#9CA3AF] hidden sm:inline">Welcome, <span className="font-semibold text-white">{user?.name}</span></span>
                        <PrimaryButton text="Logout" className="w-auto px-6" onClick={handleLogout} />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-[#0a0e27]">
                    <div className="p-8">
                        {selectedFeature === "dashboard" ? (
                            <DashboardOverview />
                        ) : SelectedComponent ? (
                            <SelectedComponent />
                        ) : (
                            <DashboardOverview />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
