import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Bell,
    User,
    Menu,
    CheckCheck,
    FileText,
    Brain,
    Layers,
    Trophy,
    UserRound,
    LockKeyhole,
    Info,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../Api";

const Header = ({ toggleSidebar }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const notificationRef = useRef(null);
    const token = localStorage.getItem("token");

    // =========================================================
    // GET PROFILE
    // =========================================================
    const getProfile = async () => {
        try {
            if (!token) return;
            const response = await axios.get(`${api}/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const profileData = response.data.data;
                setUser(profileData);
                localStorage.setItem("user", JSON.stringify(profileData));
            }
        } catch (error) {
            console.error("Profile Error:", error.response?.data?.message || error.message);
            const localUser = localStorage.getItem("user");
            if (localUser) {
                try {
                    setUser(JSON.parse(localUser));
                } catch (err) {
                    console.error("Local user parse error:", err);
                }
            }
        }
    };

    // =========================================================
    // GET NOTIFICATIONS
    // =========================================================
    const getNotifications = async () => {
        try {
            if (!token) return;
            setLoadingNotifications(true);
            const response = await axios.get(`${api}/notification`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNotifications(response.data.data || []);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Notification Error:", error.response?.data?.message || error.message);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // =========================================================
    // INITIAL LOAD & POLLING
    // =========================================================
    useEffect(() => {
        if (!token) return;
        getProfile();
        getNotifications();
    }, [token]);

    // Auto Check New Notifications Every 5 Seconds
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => {
            getNotifications();
        }, 5000);

        return () => clearInterval(interval);
    }, [token]);

    // Close Notification on Outside Click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // =========================================================
    // NOTIFICATION ACTIONS
    // =========================================================
    const markAsRead = async (notification) => {
        if (notification.isRead) return;
        try {
            await axios.patch(`${api}/notification/${notification._id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications((prev) =>
                prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Mark Notification Error:", error.response?.data?.message || error.message);
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await axios.patch(`${api}/notification/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Mark All Read Error:", error.response?.data?.message || error.message);
        }
    };

    // =========================================================
    // HELPERS
    // =========================================================
    const getNotificationIcon = (type) => {
        switch (type) {
            case "document": return <FileText size={17} />;
            case "summary": return <Brain size={17} />;
            case "flashcard": return <Layers size={17} />;
            case "quiz": return <Trophy size={17} />;
            case "profile": return <UserRound size={17} />;
            case "password": return <LockKeyhole size={17} />;
            default: return <Info size={17} />;
        }
    };

    const formatTime = (date) => {
        if (!date) return "";
        const notificationDate = new Date(date);
        const now = new Date();
        const diff = Math.floor((now - notificationDate) / 1000);

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} day ago`;

        return notificationDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const getProfileImage = () => {
        if (!user?.profileImage) return null;
        if (user.profileImage.startsWith("http")) return user.profileImage;
        return `${api}${user.profileImage}`;
    };

    const profileImage = getProfileImage();

    const openProfile = () => {
        navigate("/profile");
    };

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <header className="sticky top-0 z-40 w-full h-[80px] bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">

            {/* Left: Sidebar Toggle (Mobile) */}
            <div>
                <button
                    onClick={toggleSidebar}
                    className="md:hidden flex items-center justify-center w-10 h-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <Menu size={24} strokeWidth={2.5} />
                </button>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center h-full">

                {/* =========================================
                    NOTIFICATION WRAPPER
                ========================================= */}
                <div ref={notificationRef} className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications((prev) => !prev);
                            if (!showNotifications) getNotifications();
                        }}
                        className="relative flex items-center justify-center w-10 h-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors mr-3"
                    >
                        <Bell size={22} strokeWidth={2} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown Panel */}
                    {showNotifications && (
                        <div className="absolute right-0 top-[52px] w-[380px] max-w-[calc(100vw-32px)] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-[100] overflow-hidden transform origin-top-right transition-all">

                            {/* Dropdown Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                <div>
                                    <h3 className="text-[15px] font-bold text-slate-900">Notifications</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="group flex items-center gap-1.5 text-xs font-bold text-[#19b673] hover:bg-[#19b673]/10 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <CheckCheck size={15} className="group-hover:scale-110 transition-transform" />
                                            Mark all
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
                                {loadingNotifications ? (
                                    <div className="py-12 text-center">
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#19b673] rounded-full animate-spin mx-auto"></div>
                                        <p className="text-sm font-medium text-slate-500 mt-3">Loading notifications...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="py-12 px-6 text-center">
                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                            <Bell size={24} className="text-slate-400" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 mt-4">No notifications</h4>
                                        <p className="text-xs font-medium text-slate-500 mt-1">You don't have any notifications right now.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((notification) => (
                                            <button
                                                key={notification._id}
                                                onClick={() => markAsRead(notification)}
                                                className={`w-full text-left px-5 py-4 transition-colors hover:bg-slate-50 relative overflow-hidden group ${!notification.isRead ? "bg-[#19b673]/5" : "bg-white"
                                                    }`}
                                            >
                                                {!notification.isRead && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#19b673]" />
                                                )}

                                                <div className="flex gap-4">
                                                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${!notification.isRead ? "bg-white shadow-sm text-[#19b673]" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm"
                                                        }`}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className={`text-sm pr-2 ${!notification.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                                                                {notification.title}
                                                            </h4>
                                                            {!notification.isRead && (
                                                                <span className="w-2 h-2 shrink-0 bg-[#19b673] rounded-full mt-1.5 shadow-sm"></span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[13px] mt-1 leading-5 line-clamp-2 ${!notification.isRead ? "text-slate-600" : "text-slate-500"}`}>
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[11px] font-semibold text-slate-400 mt-2 uppercase tracking-wider">
                                                            {formatTime(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Subtle Divider */}
                <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

                {/* =========================================
                    USER PROFILE BUTTON
                ========================================= */}
                <button
                    onClick={openProfile}
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-2xl hover:bg-slate-100 transition-colors ml-1"
                    title="Open Profile"
                >
                    <div className="hidden sm:block text-right">
                        <p className="font-bold text-slate-900 text-[14px] leading-tight">
                            {user?.userName || "User"}
                        </p>
                        <p className="text-slate-500 font-medium text-[12px]">
                            {user?.email || "user@example.com"}
                        </p>
                    </div>

                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt="Profile"
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = "flex";
                                }
                            }}
                        />
                    ) : null}

                    <div
                        style={{ display: profileImage ? "none" : "flex" }}
                        className="w-10 h-10 rounded-xl items-center justify-center text-white shadow-sm bg-gradient-to-br from-[#19b673] to-[#128a56]"
                    >
                        <User size={20} strokeWidth={2.5} />
                    </div>
                </button>

            </div>
        </header>
    );
};

export default Header;