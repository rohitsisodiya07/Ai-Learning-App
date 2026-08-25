import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Clock3,
    Loader2,
    Target,
    Trophy,
    Play,
    RotateCcw,
    FileText,
    Sparkles,
    ChevronRight,
    Award,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api";

const StudyPlanDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const getStudyPlan = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${api}/studyPlan/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setPlan(response.data.data);
            }
        } catch (error) {
            console.error(
                "Get Study Plan Details Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to fetch study plan"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getStudyPlan();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-[600px] items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={38}
                        className="animate-spin text-[#19b673]"
                    />
                    <p className="text-sm font-medium text-slate-500">
                        Loading study plan...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[600px] items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                        <FileText
                            size={25}
                            className="text-red-500"
                        />
                    </div>
                    <h2 className="mt-5 text-lg font-bold text-slate-900">
                        Unable to load study plan
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>
                    <button
                        onClick={getStudyPlan}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#149e63]"
                    >
                        <RotateCcw size={16} />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!plan) {
        return null;
    }

    const progress = Math.min(
        Math.max(plan.progress || 0, 0),
        100
    );

    const totalDays = plan.days?.length || 0;

    const completedDays =
        plan.days?.filter(
            (day) => day.completed
        ).length || 0;

    const quizCompletedDays =
        plan.days?.filter(
            (day) => day.quizCompleted
        ).length || 0;

    const flashcardCompletedDays =
        plan.days?.filter(
            (day) => day.flashcardsCompleted
        ).length || 0;

    const startQuiz = (dayNumber) => {
        navigate(
            `/studyPlan/${plan._id}/day/${dayNumber}/quiz`
        );
    };

    const openFlashcards = (dayNumber) => {
        navigate(
            `/studyPlan/${plan._id}/day/${dayNumber}/flashcards`
        );
    };

    const viewQuizResult = (quizId) => {
        if (!quizId) return;
        navigate(
            `/studyPlan/quiz/${quizId}/results`
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-5 md:px-6 md:py-7 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* BACK BUTTON */}
                <button
                    onClick={() =>
                        navigate("/studyPlan")
                    }
                    className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#19b673]"
                >
                    <ArrowLeft size={18} />
                    Back to Study Plans
                </button>

                {/* HERO HEADER */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-5 md:p-7 lg:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <BookOpen
                                        size={28}
                                        className="text-[#19b673]"
                                    />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
                                            {plan.title}
                                        </h1>
                                        {plan.status === "completed" && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100">
                                                <Award size={13} />
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {plan.subject}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                            {plan.level}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                            {plan.duration} Days
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                            {plan.dailyHours} Hours/day
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`w-fit rounded-full px-4 py-2 text-xs font-bold capitalize border ${
                                    plan.status === "completed"
                                        ? "bg-blue-50 text-blue-600 border-blue-100"
                                        : plan.status === "paused"
                                        ? "bg-amber-50 text-amber-600 border-amber-100"
                                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                }`}
                            >
                                {plan.status}
                            </div>
                        </div>

                        {/* GOAL */}
                        <div className="mt-7 flex gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4 md:p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-[#19b673]">
                                <Target size={19} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Your Goal
                                </p>
                                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                                    {plan.goal}
                                </p>
                            </div>
                        </div>

                        {/* PROGRESS */}
                        <div className="mt-7">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy
                                        size={17}
                                        className="text-[#19b673]"
                                    />
                                    <span className="text-sm font-bold text-slate-700">
                                        Overall Progress
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-[#19b673]">
                                    {progress}%
                                </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-[#19b673] transition-all duration-700"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                {completedDays} of {totalDays} days completed
                            </p>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-2 border-t border-slate-100 md:grid-cols-4">
                        <div className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
                            <p className="text-xs font-medium text-slate-400">
                                Total Days
                            </p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {totalDays}
                            </p>
                        </div>
                        <div className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
                            <p className="text-xs font-medium text-slate-400">
                                Completed
                            </p>
                            <p className="mt-1 text-xl font-bold text-[#19b673]">
                                {completedDays}
                            </p>
                        </div>
                        <div className="border-r border-slate-100 p-4">
                            <p className="text-xs font-medium text-slate-400">
                                Quizzes Done
                            </p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {quizCompletedDays}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-medium text-slate-400">
                                Flashcards Done
                            </p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {flashcardCompletedDays}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECTION HEADER */}
                <div className="mb-4 mt-8">
                    <div className="flex items-center gap-2">
                        <Sparkles
                            size={19}
                            className="text-[#19b673]"
                        />
                        <h2 className="text-lg font-bold text-slate-900 md:text-xl">
                            Your Learning Plan
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Complete each day by studying the topic, reviewing flashcards and taking the quiz.
                    </p>
                </div>

                {/* DAYS TIMELINE */}
                <div className="space-y-4">
                    {plan.days?.map((day, index) => {
                        const dayNumber = day.dayNumber || index + 1;
                        const isDayCompleted = Boolean(day.completed);
                        const isQuizCompleted = Boolean(day.quizCompleted);
                        const isFlashcardsCompleted = Boolean(day.flashcardsCompleted);

                        const quizId =
                            typeof day.quizId === "object"
                                ? day.quizId?._id
                                : day.quizId;

                        const getDayStatus = () => {
                            if (isDayCompleted) return "Completed";
                            if (isQuizCompleted || isFlashcardsCompleted) return "In Progress";
                            return "Not Started";
                        };

                        const dayStatus = getDayStatus();

                        return (
                            <div
                                key={day._id || dayNumber}
                                className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
                                    isDayCompleted
                                        ? "border-emerald-200"
                                        : "border-slate-200"
                                }`}
                            >
                                <div className="p-5 md:p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex gap-3">
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                                                    isDayCompleted
                                                        ? "bg-emerald-100 text-[#19b673]"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {isDayCompleted ? (
                                                    <CheckCircle2 size={23} />
                                                ) : (
                                                    `0${dayNumber}`.slice(-2)
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                    Day {dayNumber}
                                                </p>
                                                <h3 className="mt-1 text-base font-bold text-slate-900 md:text-lg">
                                                    {day.topic || "Daily Learning"}
                                                </h3>
                                                {day.description && (
                                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                                                        {day.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${
                                                dayStatus === "Completed"
                                                    ? "bg-emerald-50 text-[#19b673] border-emerald-100"
                                                    : dayStatus === "In Progress"
                                                    ? "bg-orange-50 text-orange-600 border-orange-100"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            }`}
                                        >
                                            {dayStatus === "Completed" ? (
                                                <CheckCircle2 size={14} />
                                            ) : dayStatus === "In Progress" ? (
                                                <Clock3 size={14} />
                                            ) : (
                                                <Play size={13} />
                                            )}
                                            {dayStatus}
                                        </span>
                                    </div>

                                    {/* TASKS CHECKLIST */}
                                    {day.tasks?.length > 0 && (
                                        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                                Today's Tasks
                                            </p>
                                            <div className="space-y-2">
                                                {day.tasks.map((task, taskIndex) => (
                                                    <div
                                                        key={taskIndex}
                                                        className="flex items-start gap-2.5"
                                                    >
                                                        <CheckCircle2
                                                            size={15}
                                                            className="mt-0.5 shrink-0 text-slate-300"
                                                        />
                                                        <p className="text-sm text-slate-600">
                                                            {task}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* STATUS TAGS */}
                                    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div
                                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold border ${
                                                isQuizCompleted
                                                    ? "bg-emerald-50 text-[#19b673] border-emerald-100"
                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                            }`}
                                        >
                                            <Target size={15} />
                                            {isQuizCompleted ? "Quiz completed" : "Quiz pending"}
                                        </div>

                                        <div
                                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold border ${
                                                isFlashcardsCompleted
                                                    ? "bg-emerald-50 text-[#19b673] border-emerald-100"
                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                            }`}
                                        >
                                            <BookOpen size={15} />
                                            {isFlashcardsCompleted
                                                ? "Flashcards completed"
                                                : "Flashcards pending"}
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {isQuizCompleted ? (
                                            <button
                                                onClick={() => viewQuizResult(quizId)}
                                                disabled={!quizId}
                                                className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                                                    quizId
                                                        ? "border-emerald-200 bg-emerald-50/60 hover:border-[#19b673] hover:bg-emerald-50"
                                                        : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#19b673] shadow-sm">
                                                        <Trophy size={19} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            View Result
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Review your quiz performance
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight
                                                    size={18}
                                                    className="text-slate-400 group-hover:text-[#19b673]"
                                                />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => startQuiz(dayNumber)}
                                                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#19b673] hover:bg-emerald-50/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#19b673]">
                                                        <Target size={19} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            Start Quiz
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Test your knowledge
                                                        </p>
                                                    </div>
                                                </div>
                                                <Play
                                                    size={17}
                                                    className="text-slate-400 group-hover:text-[#19b673]"
                                                />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => openFlashcards(dayNumber)}
                                            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#19b673] hover:bg-emerald-50/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#19b673]">
                                                    <BookOpen size={19} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {isFlashcardsCompleted
                                                            ? "View Flashcards"
                                                            : "Study Flashcards"}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {isFlashcardsCompleted
                                                            ? "Review learned concepts"
                                                            : "Review key concepts"}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight
                                                size={18}
                                                className="text-slate-400 group-hover:text-[#19b673]"
                                            />
                                        </button>
                                    </div>

                                    {/* DAY COMPLETED BANNER */}
                                    {isDayCompleted && (
                                        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#19b673] shadow-sm">
                                                <CheckCircle2 size={19} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#168d5b]">
                                                    Day {dayNumber} completed!
                                                </p>
                                                <p className="mt-0.5 text-xs text-emerald-700/70">
                                                    Quiz and flashcards are completed. You can still view them anytime.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* COMPLETE PLAN BANNER */}
                {plan.status === "completed" && (
                    <div className="mt-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
                        <div className="flex flex-col items-center px-6 py-10 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                                <Trophy
                                    size={30}
                                    className="text-blue-600"
                                />
                            </div>
                            <h2 className="mt-5 text-xl font-bold text-slate-900">
                                Study Plan Completed!
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Great work! You completed all learning days, quizzes and flashcards in this study plan.
                            </p>
                            <button
                                onClick={() =>
                                    navigate("/studyPlan")
                                }
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#149e63]"
                            >
                                <ArrowLeft size={16} />
                                View All Study Plans
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StudyPlanDetails;