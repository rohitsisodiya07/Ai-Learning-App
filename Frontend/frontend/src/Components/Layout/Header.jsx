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

    // Get Profile
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

    // Get Notifications
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

    // Initial Load
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

    // Mark Single Notification as Read
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

    // Mark All as Read
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

    // Notification Icon Helper
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

    // Format Time Helper
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

    // Profile Image Helper
    const getProfileImage = () => {
        if (!user?.profileImage) return null;
        if (user.profileImage.startsWith("http")) return user.profileImage;
        return `${api}${user.profileImage}`;
    };

    const profileImage = getProfileImage();

    const openProfile = () => {
        navigate("/profile");
    };

    return (
        <header className="w-full h-[80px] bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between shrink-0">

            {/* Left: Sidebar Toggle */}
            <div>
                <button
                    onClick={toggleSidebar}
                    className="md:hidden flex items-center justify-center w-11 h-11 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                    <Menu size={26} />
                </button>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center h-full">

                {/* Notification Wrapper */}
                <div ref={notificationRef} className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications((prev) => !prev);
                            if (!showNotifications) getNotifications();
                        }}
                        className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition mr-3"
                    >
                        <Bell size={24} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-[58px] w-[380px] max-w-[calc(100vw-32px)] bg-white border border-gray-200 rounded-2xl shadow-2xl z-[100] overflow-hidden">

                            {/* Dropdown Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div>
                                    <h3 className="font-bold text-gray-900">Notifications</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="flex items-center gap-1.5 text-xs font-medium text-[#19b673] hover:bg-emerald-50 px-2.5 py-2 rounded-lg transition"
                                        >
                                            <CheckCheck size={15} /> Mark all
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[420px] overflow-y-auto">
                                {loadingNotifications ? (
                                    <div className="py-12 text-center">
                                        <div className="w-7 h-7 border-2 border-gray-200 border-t-[#19b673] rounded-full animate-spin mx-auto"></div>
                                        <p className="text-sm text-gray-500 mt-3">Loading notifications...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="py-12 px-6 text-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                            <Bell size={22} className="text-gray-400" />
                                        </div>
                                        <h4 className="font-semibold text-gray-800 mt-4">No notifications</h4>
                                        <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <button
                                            key={notification._id}
                                            onClick={() => markAsRead(notification)}
                                            className={`w-full text-left px-5 py-4 border-b border-gray-100 transition hover:bg-gray-50 ${!notification.isRead ? "bg-emerald-50/60" : "bg-white"
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${!notification.isRead ? "bg-emerald-100 text-[#19b673]" : "bg-gray-100 text-gray-500"
                                                    }`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`text-sm ${!notification.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <span className="w-2 h-2 shrink-0 bg-[#19b673] rounded-full mt-1.5"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 leading-5">{notification.message}</p>
                                                    <p className="text-[11px] text-gray-400 mt-2">{formatTime(notification.createdAt)}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-9 w-[1px] bg-gray-200 mx-2"></div>

                {/* User Profile Button */}
                <button
                    onClick={openProfile}
                    className="flex items-center gap-3 pl-4 text-left hover:bg-gray-50 rounded-xl px-2 py-2 transition cursor-pointer"
                    title="Open Profile"
                >
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt="Profile"
                            className="w-11 h-11 rounded-xl object-cover border border-gray-200"
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
                        className="w-11 h-11 bg-[#19b673] rounded-xl items-center justify-center text-white"
                    >
                        <User size={22} />
                    </div>

                    <div className="hidden sm:block">
                        <p className="font-bold text-gray-900 text-[15px]">{user?.userName || "User"}</p>
                        <p className="text-gray-500 text-[13px]">{user?.email || "user@example.com"}</p>
                    </div>
                </button>

            </div>
        </header>
    );
};

export default Header;