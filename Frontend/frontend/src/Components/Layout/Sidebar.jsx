import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutGrid,
    FileText,
    BookOpen,
    User,
    Sparkles,
    X,
    LogOut,
} from "lucide-react";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const navigate = useNavigate();

    // Sidebar ke saare menu items yahan defined hain
    const links = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutGrid },
        { name: "Documents", path: "/documents", icon: FileText },
        { name: "Flashcards", path: "/flashcards", icon: BookOpen },
        { name: "Profile", path: "/profile", icon: User },
    ];

    // Logout function: LocalStorage clear karke login page par bhej dega
    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <>
            {/* 1. Mobile Screen Overlay (Jab sidebar khula ho toh piche background dhundhla ho jaye) */}
            {isSidebarOpen && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
                />
            )}

            {/* 2. Main Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 z-50 flex h-screen w-[280px] flex-col bg-white border-r border-gray-200 shadow-xl transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0 md:shadow-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Logo Section */}
                <div className="flex h-[80px] shrink-0 items-center justify-between border-b border-gray-100 px-5">
                    <div className="flex items-center min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b673] text-white shadow-sm">
                            <Sparkles size={21} strokeWidth={2.5} />
                        </div>

                        <div className="ml-3 min-w-0">
                            <h1 className="truncate text-[15px] font-extrabold tracking-tight text-gray-900">
                                AI Learning
                            </h1>
                            <p className="text-[11px] font-medium text-gray-400">
                                Assistant
                            </p>
                        </div>
                    </div>

                    {/* Mobile Screen par Close (X) Button */}
                    <button
                        onClick={toggleSidebar}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 md:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links Section */}
                <nav className="flex-1 overflow-y-auto px-3 py-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
                    <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        Menu
                    </p>

                    <div className="space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;

                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => {
                                        // Agar mobile screen hai, toh link par click karte hi sidebar band ho jaye
                                        if (window.innerWidth < 768) {
                                            toggleSidebar();
                                        }
                                    }}
                                    className={({ isActive }) => `
                    group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition-all duration-200
                    ${isActive
                                            ? "bg-[#19b673] text-white shadow-sm shadow-[#19b673]/20"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }
                  `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {/* Link Icon */}
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${isActive
                                                        ? "bg-white/15"
                                                        : "bg-gray-50 group-hover:bg-white"
                                                    }`}
                                            >
                                                <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                                            </div>

                                            {/* Link Name */}
                                            <span>{link.name}</span>
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout Button Section at the bottom */}
                <div className="shrink-0 border-t border-gray-100 p-3">
                    <button
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-semibold text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 transition group-hover:bg-red-100">
                            <LogOut size={19} strokeWidth={2} />
                        </div>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;