import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import {
    ArrowRight,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Flame,
    Target,
    Trophy,
    RefreshCw,
    Sparkles,
    AlertTriangle,
    Layers3,
    FileQuestion,
    Download,
} from "lucide-react";

import api from "../../Api";

const StudyDashboard = () => {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    // Fetch dashboard
    const fetchStudyDashboard = useCallback(
        async (isRefresh = false) => {
            if (!token) {
                navigate("/");
                return;
            }

            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response = await axios.get(
                    `${api}/studyPlan/dashboard`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        timeout: 15000,
                    }
                );

                if (response.data?.success) {
                    setDashboard(response.data.data || {});
                } else {
                    throw new Error(
                        response.data?.message ||
                        "Failed to load study dashboard"
                    );
                }
            } catch (err) {
                console.error(
                    "Study Dashboard Error:",
                    err.response?.data || err.message
                );

                const message =
                    err.response?.data?.message ||
                    (err.code === "ECONNABORTED"
                        ? "Server took too long to respond."
                        : err.message === "Network Error"
                            ? "Unable to connect to the server."
                            : "Failed to load study dashboard.");

                setError(message);

                if (isRefresh) {
                    toast.error(message);
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [navigate, token]
    );

    // Export PDF
    const handleExportDashboard = async () => {
        if (!token) {
            navigate("/");
            return;
        }

        try {
            setExporting(true);
            toast.loading("Preparing dashboard PDF...", {
                id: "export-dashboard",
            });

            const response = await axios.get(
                `${api}/studyPlan/dashboard/export`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: "blob",
                    timeout: 30000,
                }
            );

            const blob = new Blob([response.data], {
                type: "application/pdf",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `study-dashboard-${new Date().toISOString().split("T")[0]}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Dashboard exported successfully!", {
                id: "export-dashboard",
            });
        } catch (error) {
            console.error(
                "Export Dashboard Error:",
                error.response?.data || error.message
            );
            toast.error("Failed to export dashboard. Please try again.", {
                id: "export-dashboard",
            });
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        fetchStudyDashboard();
    }, [fetchStudyDashboard]);

    // Data parsing
    const statistics = dashboard?.statistics || {};

    const recentStudyPlans = Array.isArray(
        dashboard?.recentStudyPlans
    )
        ? dashboard.recentStudyPlans
        : [];

    const recentQuizzes = Array.isArray(
        dashboard?.recentQuizzes
    )
        ? dashboard.recentQuizzes
        : [];

    const currentStudyPlan = useMemo(() => {
        if (dashboard?.currentStudyPlan) {
            return dashboard.currentStudyPlan;
        }

        const activePlan = recentStudyPlans.find(
            (plan) => plan?.status === "active"
        );

        if (activePlan) {
            return activePlan;
        }

        return recentStudyPlans[0] || null;
    }, [
        dashboard?.currentStudyPlan,
        recentStudyPlans,
    ]);

    // Statistics numbers
    const totalQuizzes = Number(statistics.totalQuizzes) || 0;
    const completedQuizzes = Number(statistics.completedQuizzes) || 0;
    const totalFlashcards = Number(statistics.totalFlashcards) || 0;
    const totalStudyPlans = Number(statistics.totalStudyPlans) || 0;
    const activeStudyPlans = Number(statistics.activeStudyPlans) || 0;
    const completedStudyPlans = Number(statistics.completedStudyPlans) || 0;

    const quizCompletionRate = Math.min(
        Math.max(Number(statistics.quizCompletionRate) || 0, 0),
        100
    );

    const averageQuizScore = Math.min(
        Math.max(Number(statistics.averageQuizScore) || 0, 0),
        100
    );

    const studyPlanProgress = Math.min(
        Math.max(Number(statistics.studyPlanProgress) || 0, 0),
        100
    );

    const currentStreak = Number(statistics.currentStreak) || 0;
    const longestStreak = Number(statistics.longestStreak) || 0;
    const totalStudyDays = Number(statistics.totalStudyDays) || 0;

    // Current plan details
    const currentPlanProgress = Math.min(
        Math.max(Number(currentStudyPlan?.progress) || 0, 0),
        100
    );

    const completedDays = Number(currentStudyPlan?.completedDays) || 0;
    const totalDays = Number(currentStudyPlan?.totalDays) || Number(currentStudyPlan?.duration) || 0;
    const completedQuizzesInPlan = Number(currentStudyPlan?.completedQuizzes) || 0;
    const completedFlashcardsInPlan = Number(currentStudyPlan?.completedFlashcards) || 0;

    // Navigation handlers
    const handleContinueStudyPlan = () => {
        if (!currentStudyPlan?._id) {
            toast.error("Study plan not found.");
            return;
        }
        navigate(`/studyPlan/${currentStudyPlan._id}`);
    };

    const handleCreateStudyPlan = () => {
        navigate("/studyPlan/generate");
    };

    const handleStudyPlanClick = (plan) => {
        if (!plan?._id) {
            toast.error("Study plan not found.");
            return;
        }
        navigate(`/studyPlan/${plan._id}`);
    };

    const handleQuizClick = (quiz) => {
        if (!quiz?._id) {
            toast.error("Quiz not found.");
            return;
        }

        if (quiz.completedAt) {
            navigate(`/quiz/${quiz._id}/results`);
        } else {
            navigate(`/quiz/${quiz._id}`);
        }
    };

    // Helpers
    const getPlanStatusStyle = (status) => {
        switch (status) {
            case "completed":
                return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "active":
                return "bg-[#19b673]/10 text-[#19b673] border-[#19b673]/20";
            case "paused":
                return "bg-amber-50 text-amber-700 border-amber-100";
            default:
                return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };

    const formatDate = (date) => {
        if (!date) return "Not available";
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return date;
        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getQuizStatus = (quiz) => {
        if (quiz?.completedAt) {
            return {
                statusText: "Completed",
                badge: "bg-emerald-50 text-emerald-700 border border-emerald-100",
                icon: <CheckCircle2 size={14} className="mr-1" />,
            };
        }
        return {
            statusText: "Pending",
            badge: "bg-orange-50 text-orange-700 border border-orange-100",
            icon: <Clock3 size={14} className="mr-1" />,
        };
    };

    // Circular progress
    const CircularProgress = ({ percentage }) => {
        const radius = 18;
        const circumference = 2 * Math.PI * radius;
        const safePercentage = Math.min(Math.max(Number(percentage) || 0, 0), 100);
        const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

        return (
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                    <circle
                        cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                        className="text-[#19b673] transition-all duration-1000 ease-out"
                    />
                </svg>
                <span className="absolute text-[11px] font-bold text-slate-700">{safePercentage}%</span>
            </div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-[#19b673]/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#19b673] animate-spin" />
                    </div>
                    <p className="mt-5 text-sm font-semibold text-slate-700">Loading your dashboard...</p>
                    <p className="mt-1 text-xs text-slate-400">Preparing your learning progress</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !dashboard) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-5">Unable to load dashboard</h2>
                    <p className="text-sm text-slate-500 mt-2 leading-6">{error}</p>
                    <button
                        type="button"
                        onClick={() => fetchStudyDashboard()}
                        className="mt-6 px-6 py-3 rounded-xl bg-[#19b673] text-white font-semibold hover:bg-[#159d63] transition shadow-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

                {/* Error Banner */}
                {error && dashboard && (
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
                        <div className="flex items-center gap-3 text-red-700">
                            <AlertTriangle size={18} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchStudyDashboard(true)}
                            className="text-sm font-bold text-red-700 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-sm md:p-8 mb-8">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur border border-white/25">
                                <Sparkles size={14} className="text-yellow-200" />
                                Learning Overview
                            </div>
                            <h1 className="text-3xl font-bold md:text-4xl">Welcome back! 👋</h1>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-white/90 md:text-base">
                                Track your progress, continue your active study plans, review your quizzes, and stay consistent with your learning.
                            </p>
                        </div>

                        <div className="flex flex-wrap sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => handleExportDashboard()}
                                disabled={exporting}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition disabled:opacity-60 text-sm shadow-sm"
                            >
                                <Download size={16} className={exporting ? "animate-bounce" : ""} />
                                {exporting ? "Exporting PDF..." : "Export PDF"}
                            </button>

                            <button
                                type="button"
                                onClick={() => fetchStudyDashboard(true)}
                                disabled={refreshing}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold transition disabled:opacity-60 backdrop-blur text-sm"
                            >
                                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </button>

                            <button
                                type="button"
                                onClick={currentStudyPlan ? handleContinueStudyPlan : handleCreateStudyPlan}
                                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#19b673] font-bold shadow-sm hover:bg-slate-50 transition-all text-sm"
                            >
                                {currentStudyPlan ? "Continue Learning" : "New Study Plan"}
                                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz Completion</p>
                                <h2 className="text-3xl font-black text-slate-800 mt-2">{quizCompletionRate}%</h2>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#19b673] group-hover:bg-[#19b673] group-hover:text-white transition-colors">
                                <FileQuestion size={20} />
                            </div>
                        </div>
                        <div className="mt-5">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#19b673] rounded-full transition-all duration-1000" style={{ width: `${quizCompletionRate}%` }} />
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-2">{completedQuizzes} of {totalQuizzes} completed</p>
                        </div>
                    </div>

                    <div className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</p>
                                <h2 className="text-3xl font-black text-slate-800 mt-2">{averageQuizScore}%</h2>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Target size={20} />
                            </div>
                        </div>
                        <div className="mt-5">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${averageQuizScore}%` }} />
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-2">Overall quiz accuracy</p>
                        </div>
                    </div>

                    <div className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Streak</p>
                                <h2 className="text-3xl font-black text-slate-800 mt-2 flex items-center gap-1">
                                    {currentStreak} <span className="text-xl">🔥</span>
                                </h2>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Flame size={20} />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-6">
                            Longest streak: <span className="font-bold text-slate-700">{longestStreak} days</span>
                        </p>
                    </div>

                    <div className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Days</p>
                                <h2 className="text-3xl font-black text-slate-800 mt-2">{totalStudyDays}</h2>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <CalendarDays size={20} />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-6">
                            Active plans: <span className="font-bold text-slate-700">{activeStudyPlans}</span>
                        </p>
                    </div>
                </div>

                {/* Current Study Plan */}
                {currentStudyPlan ? (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#19b673]">
                                                <BookOpen size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Study Plan</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${getPlanStatusStyle(currentStudyPlan.status)}`}>
                                                        {currentStudyPlan.status || "active"}
                                                    </span>
                                                </div>
                                                <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                                                    {currentStudyPlan.title || currentStudyPlan.subject || "Study Plan"}
                                                </h2>
                                            </div>
                                        </div>

                                        <p className="text-sm font-medium text-slate-500 mb-4">
                                            {currentStudyPlan.subject || "Subject"} • <span className="text-slate-700 font-semibold">{currentStudyPlan.level || "Level"}</span>
                                        </p>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Duration</p>
                                                <p className="text-sm font-bold text-slate-800 mt-1">{currentStudyPlan.duration || 0} Days</p>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Daily Hours</p>
                                                <p className="text-sm font-bold text-slate-800 mt-1">{currentStudyPlan.dailyHours || 0} hrs</p>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Quizzes</p>
                                                <p className="text-sm font-bold text-slate-800 mt-1">{completedQuizzesInPlan} / {totalDays}</p>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Flashcards</p>
                                                <p className="text-sm font-bold text-slate-800 mt-1">{completedFlashcardsInPlan} / {totalDays}</p>
                                            </div>
                                        </div>

                                        {currentStudyPlan.goal && (
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Goal</p>
                                                <p className="text-sm font-medium text-slate-700">{currentStudyPlan.goal}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overall Progress</p>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">{completedDays} of {totalDays} days completed</p>
                                            </div>
                                            <span className="text-2xl font-black text-[#19b673]">{currentPlanProgress}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#19b673] rounded-full transition-all duration-1000" style={{ width: `${currentPlanProgress}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-[380px] shrink-0">
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 h-full flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
                                                    <CalendarDays size={14} className="text-[#19b673]" />
                                                    {currentStudyPlan.today ? `Day ${currentStudyPlan.today.dayNumber}` : "Today"}
                                                </span>
                                                {currentStudyPlan.today?.completed && (
                                                    <span className="text-xs font-bold text-[#19b673] flex items-center gap-1">
                                                        <CheckCircle2 size={14} /> Completed
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-slate-900 text-lg leading-snug">
                                                {currentStudyPlan.today?.topic || "No tasks scheduled for today"}
                                            </h3>

                                            <p className="text-xs font-medium text-slate-500 mt-2 line-clamp-3">
                                                {currentStudyPlan.today?.description || "Take a break or review previous topics."}
                                            </p>

                                            {Array.isArray(currentStudyPlan.today?.tasks) && currentStudyPlan.today.tasks.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-xs font-bold text-slate-600 mb-2">Today's Tasks</p>
                                                    <div className="space-y-2">
                                                        {currentStudyPlan.today.tasks.slice(0, 3).map((task, index) => (
                                                            <div key={index} className="flex gap-2 text-xs text-slate-600">
                                                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#19b673] shrink-0" />
                                                                <span>{task}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {currentStudyPlan.today && (
                                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200/80">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                        <span className={`w-2 h-2 rounded-full ${currentStudyPlan.today.quizCompleted ? "bg-[#19b673]" : "bg-slate-300"}`} />
                                                        <span className={currentStudyPlan.today.quizCompleted ? "text-slate-700" : "text-slate-400"}>Quiz</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                        <span className={`w-2 h-2 rounded-full ${currentStudyPlan.today.flashcardsCompleted ? "bg-[#19b673]" : "bg-slate-300"}`} />
                                                        <span className={currentStudyPlan.today.flashcardsCompleted ? "text-slate-700" : "text-slate-400"}>Flashcards</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleContinueStudyPlan}
                                            className="mt-6 w-full group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#19b673] text-white font-bold shadow-sm hover:shadow-md hover:bg-[#159d63] transition-all"
                                        >
                                            Continue Learning
                                            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm mb-8 p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#19b673]">
                            <BookOpen size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Start Your Learning Journey</h2>
                        <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
                            Create your first AI-powered personalized study plan and track your day-to-day progress.
                        </p>
                        <button
                            type="button"
                            onClick={handleCreateStudyPlan}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#19b673] text-white font-bold hover:bg-[#159d63] transition shadow-sm"
                        >
                            Create Study Plan <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* Recent Quizzes & Study Plans Grid */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                    {/* Recent Quizzes */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Target size={20} className="text-purple-500" /> Recent Quizzes
                                </h2>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">Review your latest tests & performance</p>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{totalQuizzes} Total</span>
                        </div>

                        {recentQuizzes.length > 0 ? (
                            <div className="grid gap-3 flex-1">
                                {recentQuizzes.slice(0, 5).map((quiz) => {
                                    const status = getQuizStatus(quiz);
                                    const scoreNum = Math.min(Math.max(Number(quiz.score) || 0, 0), 100);

                                    return (
                                        <div
                                            key={quiz._id}
                                            onClick={() => handleQuizClick(quiz)}
                                            className="group bg-white border border-slate-200 p-4 rounded-2xl hover:border-purple-300 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <CircularProgress percentage={quiz.completedAt ? scoreNum : 0} />
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-purple-600 transition-colors">
                                                        {quiz.title || "Untitled Quiz"}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-medium text-slate-500">
                                                        <span>Day {quiz.dayNumber || "-"}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span>{quiz.totalQuestions || 0} Qs</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span>{formatDate(quiz.completedAt || quiz.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`hidden sm:flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.badge}`}>
                                                    {status.icon} {status.statusText}
                                                </span>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                                    <FileQuestion size={24} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">No quizzes yet</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs mx-auto">
                                    Quizzes will appear here once you generate them within your study plan.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Study Plans */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Layers3 size={20} className="text-blue-500" /> Your Study Plans
                                </h2>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">Access and manage all your learning paths</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/studyPlan")}
                                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                                View All <ChevronRight size={14} />
                            </button>
                        </div>

                        {recentStudyPlans.length > 0 ? (
                            <div className="grid gap-3 flex-1">
                                {recentStudyPlans.slice(0, 5).map((plan) => {
                                    const progress = Math.min(Math.max(Number(plan.progress) || 0, 0), 100);

                                    return (
                                        <div
                                            key={plan._id}
                                            onClick={() => handleStudyPlanClick(plan)}
                                            className="group bg-white border border-slate-200 p-4 rounded-2xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-center"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2.5">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                                                        {plan.title || plan.subject || "Study Plan"}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-500">
                                                        <span>{plan.subject || "Subject"}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span>{plan.duration || 0} Days</span>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPlanStatusStyle(plan.status)}`}>
                                                    {plan.status || "active"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-600 w-8 text-right">{progress}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">No study plans</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs mx-auto">
                                    Create your first personalized study plan to start learning.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCreateStudyPlan}
                                    className="mt-4 px-4 py-2 rounded-lg bg-[#19b673] text-white text-xs font-bold"
                                >
                                    Create Plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Summary */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Study Plan Progress</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">{studyPlanProgress}%</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Study Plans</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">{totalStudyPlans}</p>
                            <p className="text-xs text-slate-500 mt-1">{completedStudyPlans} completed</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Flashcards</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">{totalFlashcards}</p>
                            <p className="text-xs text-slate-500 mt-1">Available cards</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Best Streak</p>
                            <p className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-1">
                                {longestStreak} <span className="text-base">🔥</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Days</p>
                        </div>
                    </div>
                </div>

                {/* Footer Banner */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Keep the momentum going!</h3>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">
                                You've studied for <span className="font-bold text-slate-800">{totalStudyDays} days</span> so far. Consistency is the key to mastery.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={currentStudyPlan ? handleContinueStudyPlan : handleCreateStudyPlan}
                        className="w-full md:w-auto group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        {currentStudyPlan ? "Resume Study" : "Start Now"}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default StudyDashboard;