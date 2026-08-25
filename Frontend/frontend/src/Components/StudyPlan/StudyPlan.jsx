import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Loader2,
    Plus,
    RefreshCw,
    Target,
    Trophy,
    PlayCircle,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../Api";

const StudyPlan = () => {
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getStudyPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please login to view your study plans.");
                return;
            }

            const response = await axios.get(`${api}/studyPlan`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setPlans(response.data.data || []);
            } else {
                setPlans([]);
            }
        } catch (error) {
            console.error("Get Study Plans Error:", error);
            setError(
                error.response?.data?.message ||
                    "Failed to fetch study plans"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getStudyPlans();
    }, []);

    const summary = useMemo(() => {
        const total = plans.length;

        const active = plans.filter(
            (plan) => plan.status === "active"
        ).length;

        const completed = plans.filter(
            (plan) => plan.status === "completed"
        ).length;

        const totalDays = plans.reduce(
            (sum, plan) => sum + (plan.days?.length || 0),
            0
        );

        const completedDays = plans.reduce(
            (sum, plan) =>
                sum +
                (plan.days?.filter(
                    (day) => day.completed
                ).length || 0),
            0
        );

        return {
            total,
            active,
            completed,
            totalDays,
            completedDays,
        };
    }, [plans]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "active":
                return {
                    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
                    dot: "bg-emerald-500",
                    label: "Active",
                };

            case "completed":
                return {
                    badge: "bg-blue-50 text-blue-600 border-blue-100",
                    dot: "bg-blue-500",
                    label: "Completed",
                };

            case "paused":
                return {
                    badge: "bg-amber-50 text-amber-600 border-amber-100",
                    dot: "bg-amber-500",
                    label: "Paused",
                };

            default:
                return {
                    badge: "bg-slate-50 text-slate-600 border-slate-100",
                    dot: "bg-slate-400",
                    label: status || "Unknown",
                };
        }
    };

    const getProgress = (plan) => {
        return Math.min(
            Math.max(Number(plan.progress) || 0, 0),
            100
        );
    };

    const getCompletedDays = (plan) => {
        return (
            plan.days?.filter(
                (day) => day.completed
            ).length || 0
        );
    };

    const getTotalDays = (plan) => {
        return plan.days?.length || Number(plan.duration) || 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8">
                        <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200" />
                        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-28 animate-pulse rounded-2xl bg-slate-200"
                            />
                        ))}
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-80 animate-pulse rounded-3xl bg-slate-200"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-10">
                <div className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center">
                    <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                            <BookOpen
                                size={28}
                                className="text-red-500"
                            />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-slate-900">
                            Unable to load study plans
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {error}
                        </p>

                        <button
                            onClick={getStudyPlans}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#149e63]"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* HERO HEADER */}
                <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative p-6 md:p-8">
                        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-50 blur-2xl" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 shadow-sm border border-emerald-100">
                                    <Sparkles
                                        size={27}
                                        className="text-[#19b673]"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#19b673]">
                                        Learning Dashboard
                                    </p>
                                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                                        My Study Plans
                                    </h1>
                                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                        Follow your personalized learning plans, track your progress and build your knowledge step by step.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    navigate("/studyPlan/generate")
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#19b673] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#149e63] hover:shadow-md"
                            >
                                <Plus size={18} />
                                Create Study Plan
                            </button>
                        </div>
                    </div>
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Total Plans
                                </p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {summary.total}
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                                <BookOpen
                                    size={21}
                                    className="text-slate-600"
                                />
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            Your personalized learning plans
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Active Plans
                                </p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {summary.active}
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                                <PlayCircle
                                    size={21}
                                    className="text-[#19b673]"
                                />
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            Plans currently in progress
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Completed
                                </p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {summary.completed}
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                                <Trophy
                                    size={21}
                                    className="text-blue-500"
                                />
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            Successfully finished plans
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Days Completed
                                </p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {summary.completedDays}
                                    <span className="ml-1 text-sm font-medium text-slate-400">
                                        / {summary.totalDays}
                                    </span>
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                                <CheckCircle2
                                    size={21}
                                    className="text-amber-500"
                                />
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            Learning days completed
                        </p>
                    </div>
                </div>

                {/* SECTION HEADER */}
                <div className="mb-5 mt-9 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Your Learning Plans
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Continue learning where you left off.
                        </p>
                    </div>
                    {plans.length > 0 && (
                        <p className="text-sm font-medium text-slate-400">
                            {plans.length}{" "}
                            {plans.length === 1 ? "plan" : "plans"}
                        </p>
                    )}
                </div>

                {/* EMPTY STATE */}
                {plans.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50">
                            <BookOpen
                                size={34}
                                className="text-[#19b673]"
                            />
                        </div>
                        <h2 className="mt-6 text-xl font-bold text-slate-900">
                            No Study Plans Yet
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Create a personalized study plan based on your subject, level, duration and learning goal.
                        </p>
                        <button
                            onClick={() =>
                                navigate("/studyPlan/generate")
                            }
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#149e63]"
                        >
                            <Plus size={18} />
                            Create Your First Plan
                        </button>
                    </div>
                ) : (
                    /* PLAN GRID */
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {plans.map((plan) => {
                            const progress = getProgress(plan);
                            const completedDays = getCompletedDays(plan);
                            const totalDays = getTotalDays(plan);
                            const status = getStatusStyle(plan.status);
                            const isCompleted =
                                plan.status === "completed" ||
                                progress === 100;

                            return (
                                <div
                                    key={plan._id}
                                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="p-5 md:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex min-w-0 gap-4">
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                                        isCompleted
                                                            ? "bg-blue-50"
                                                            : "bg-emerald-50"
                                                    }`}
                                                >
                                                    {isCompleted ? (
                                                        <Award
                                                            size={23}
                                                            className="text-blue-500"
                                                        />
                                                    ) : (
                                                        <BookOpen
                                                            size={23}
                                                            className="text-[#19b673]"
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                                                        {plan.title}
                                                    </h3>
                                                    <p className="mt-1 truncate text-sm text-slate-500">
                                                        {plan.subject}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${status.badge}`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                                />
                                                {status.label}
                                            </span>
                                        </div>

                                        {/* PLAN META */}
                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-slate-50 p-3.5">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <CalendarDays size={16} />
                                                    <span className="text-xs font-medium">
                                                        Duration
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-sm font-bold text-slate-800">
                                                    {plan.duration} Days
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 p-3.5">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock3 size={16} />
                                                    <span className="text-xs font-medium">
                                                        Daily Study
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-sm font-bold text-slate-800">
                                                    {plan.dailyHours} Hours
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 p-3.5">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Target size={16} />
                                                    <span className="text-xs font-medium">
                                                        Level
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-sm font-bold text-slate-800">
                                                    {plan.level}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 p-3.5">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-xs font-medium">
                                                        Days
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-sm font-bold text-slate-800">
                                                    {completedDays} / {totalDays}
                                                </p>
                                            </div>
                                        </div>

                                        {/* GOAL */}
                                        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                                                    <Target
                                                        size={17}
                                                        className="text-[#19b673]"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Learning Goal
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-700">
                                                        {plan.goal}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PROGRESS */}
                                        <div className="mt-5">
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        Progress
                                                    </span>
                                                    {isCompleted && (
                                                        <CheckCircle2
                                                            size={15}
                                                            className="text-[#19b673]"
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-[#19b673]">
                                                    {progress}%
                                                </span>
                                            </div>

                                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        isCompleted
                                                            ? "bg-blue-500"
                                                            : "bg-[#19b673]"
                                                    }`}
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className="mt-2 flex justify-between text-xs text-slate-400">
                                                <span>
                                                    {completedDays} days completed
                                                </span>
                                                <span>
                                                    {Math.max(
                                                        totalDays - completedDays,
                                                        0
                                                    )}{" "}
                                                    remaining
                                                </span>
                                            </div>
                                        </div>

                                        {/* ACTION */}
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/studyPlan/${plan._id}`
                                                )
                                            }
                                            className={`group/button mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                                                isCompleted
                                                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                    : "bg-[#19b673] text-white hover:bg-[#149e63]"
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <>
                                                    <Trophy size={17} />
                                                    View Completed Plan
                                                </>
                                            ) : (
                                                <>
                                                    <PlayCircle size={18} />
                                                    Continue Learning
                                                </>
                                            )}
                                            <ChevronRight
                                                size={17}
                                                className="transition group-hover/button:translate-x-0.5"
                                            />
                                        </button>
                                    </div>

                                    {isCompleted && (
                                        <div className="border-t border-blue-100 bg-blue-50/50 px-5 py-3.5 md:px-6">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                                                <CheckCircle2 size={15} />
                                                <span>
                                                    All learning days completed successfully
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* BOTTOM MOTIVATION */}
                {plans.length > 0 && (
                    <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 md:p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                                    <Sparkles
                                        size={19}
                                        className="text-[#19b673]"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-800">
                                        Keep your learning streak going!
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-emerald-700/70">
                                        Complete your daily tasks, quizzes and flashcards to make steady progress.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(
                                        "/studyPlan/generate"
                                    )
                                }
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#19b673] shadow-sm transition hover:shadow-md"
                            >
                                <Plus size={15} />
                                New Plan
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StudyPlan;