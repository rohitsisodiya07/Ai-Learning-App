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
    CalendarDays,
    Target,
} from "lucide-react";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const navigate = useNavigate();

    // Safely retrieve user profile info if stored in localStorage
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    const userName = storedUser?.userName || "User";
    const userEmail = storedUser?.email || "user@ailearning.com";
    const userInitial = userName.charAt(0).toUpperCase();

    const links = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutGrid,
        },
        {
            name: "Documents",
            path: "/documents",
            icon: FileText,
        },
        {
            name: "Study Dashboard",
            path: "/studyDashboard",
            icon: Target,
        },
        {
            name: "Study Plans",
            path: "/studyPlan",
            icon: CalendarDays,
        },
        {
            name: "Flashcards",
            path: "/flashcards",
            icon: BookOpen,
        },
        {
            name: "Profile",
            path: "/profile",
            icon: User,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleLinkClick = () => {
        if (isSidebarOpen && typeof toggleSidebar === "function") {
            toggleSidebar();
        }
    };

    return (
        <>
            {/* =========================================
                MOBILE OVERLAY
            ========================================= */}
            {isSidebarOpen && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity md:hidden"
                />
            )}

            {/* =========================================
                SIDEBAR CONTAINER
            ========================================= */}
            <aside
                className={`fixed top-0 left-0 z-50 flex h-screen w-[280px] flex-col bg-white border-r border-slate-200 shadow-2xl transition-transform duration-300 ease-out md:static md:z-auto md:translate-x-0 md:shadow-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* =========================================
                    LOGO SECTION
                ========================================= */}
                <div className="flex h-[80px] shrink-0 items-center justify-between border-b border-slate-100 px-6">
                    <div className="flex items-center min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#19b673] to-[#128a56] text-white shadow-md shadow-[#19b673]/20">
                            <Sparkles size={20} strokeWidth={2.5} />
                        </div>

                        <div className="ml-3 min-w-0">
                            <h1 className="truncate text-[16px] font-extrabold tracking-tight text-slate-900">
                                AI Learning
                            </h1>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Assistant
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={toggleSidebar}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 md:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* =========================================
                    NAVIGATION LINKS
                ========================================= */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </p>

                    <div className="space-y-1.5">
                        {links.map((link) => {
                            const Icon = link.icon;

                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={handleLinkClick}
                                    className={({ isActive }) => `
                                        group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-200
                                        ${isActive
                                            ? "bg-[#19b673] text-white shadow-md shadow-[#19b673]/20"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }
                                    `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${isActive
                                                        ? "bg-white/20 text-white"
                                                        : "bg-slate-100/80 text-slate-400 group-hover:bg-white group-hover:text-[#19b673] group-hover:shadow-sm"
                                                    }`}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={
                                                        isActive
                                                            ? ""
                                                            : "group-hover:scale-110 transition-transform duration-200"
                                                    }
                                                />
                                            </div>

                                            <span>{link.name}</span>
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>

                {/* =========================================
                    USER PROFILE PREVIEW (SaaS Style)
                ========================================= */}
                <div className="shrink-0 border-t border-slate-100 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#19b673]/10 font-bold text-[#19b673]">
                            {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-800">
                                {userName}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                                {userEmail}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-slate-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 text-slate-400 transition-all duration-200 group-hover:bg-red-100 group-hover:text-red-600">
                            <LogOut
                                size={18}
                                strokeWidth={2}
                                className="group-hover:translate-x-0.5 transition-transform duration-200"
                            />
                        </div>

                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;