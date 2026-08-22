import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Award,
    CheckCircle2,
    XCircle,
    FileText,
    Target,
    Clock,
    ChevronDown,
    ChevronUp,
    Sparkles,
    RotateCcw,
} from "lucide-react";

import api from "../../Api";
import Spinner from "../../Components/Common/Spinner";

const QuizResultPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    // =========================
    // Fetch Quiz Results
    // =========================
    useEffect(() => {
        const fetchQuizResults = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${api}/quiz/${id}/results`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("Quiz Results:", response.data);

                if (response.data.success) {
                    setResult(response.data.data);
                }
            } catch (error) {
                console.error("Quiz Result Error:", error);

                toast.error(
                    error.response?.data?.message ||
                    "Failed to fetch quiz results"
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchQuizResults();
        }
    }, [id]);

    // =========================
    // Loading
    // =========================
    if (loading) {
        return <Spinner />;
    }

    // =========================
    // No Result
    // =========================
    if (!result) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <XCircle size={32} className="text-red-500" />
                </div>

                <h2 className="text-xl font-bold text-slate-800">
                    Result Not Found
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                    Unable to load quiz result.
                </p>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
                >
                    <ArrowLeft size={16} />
                    Go Back
                </button>
            </div>
        );
    }

    // =========================
    // Calculations
    // =========================
    const totalQuestions = result.totalQuestions || 0;
    const correctAnswers = result.correctAnswers || 0;
    const attemptedQuestions = result.attemptedQuestions || 0;
    const score = result.score || 0;

    const wrongAnswers = attemptedQuestions - correctAnswers;

    const percentage =
        totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 100)
            : 0;

    // =========================
    // Result Message
    // =========================
    const getResultMessage = () => {
        if (percentage >= 80) {
            return "Excellent Work! 🎉";
        }

        if (percentage >= 60) {
            return "Good Job! 👍";
        }

        if (percentage >= 40) {
            return "Keep Practicing! 💪";
        }

        return "Don't Give Up! 📚";
    };

    // =========================
    // Toggle Question
    // =========================
    const toggleQuestion = (index) => {
        if (expandedQuestion === index) {
            setExpandedQuestion(null);
        } else {
            setExpandedQuestion(index);
        }
    };

    // =========================
    // Format Date
    // =========================
    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // =========================
    // Question Type Label
    // =========================
    const getQuestionTypeLabel = (type) => {
        switch (type) {
            case "mcq":
                return "Multiple Choice";

            case "true_false":
                return "True / False";

            case "short_answer":
                return "Short Answer";

            default:
                return "Question";
        }
    };

    // =========================
    // Difficulty Style
    // =========================
    const getDifficultyStyle = (difficulty) => {
        switch (difficulty) {
            case "easy":
                return "bg-emerald-50 text-emerald-700 border-emerald-100";

            case "medium":
                return "bg-amber-50 text-amber-700 border-amber-100";

            case "hard":
                return "bg-red-50 text-red-700 border-red-100";

            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    return (
        <div className="space-y-6 pb-10">

            {/* =========================
                Back Button
            ========================= */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition"
            >
                <ArrowLeft size={17} />
                Back
            </button>

            {/* =========================
                Header
            ========================= */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <div className="flex items-start gap-4">

                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            <Award
                                size={28}
                                className="text-emerald-600"
                            />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {result.title || "Quiz Result"}
                            </h1>

                            {result.document?.title && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                    <FileText size={15} />
                                    {result.document.title}
                                </div>
                            )}

                            <p className="text-sm text-slate-400 mt-2">
                                Completed on {formatDate(result.completedAt)}
                            </p>
                        </div>

                    </div>

                    <div className="text-center lg:text-right">

                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                            Final Score
                        </p>

                        <p className="text-4xl font-bold text-emerald-600 mt-1">
                            {score}%
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                            {getResultMessage()}
                        </p>

                    </div>

                </div>
            </div>

            {/* =========================
                Score Cards
            ========================= */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Score */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-xs text-slate-400">
                                Score
                            </p>

                            <p className="text-2xl font-bold text-emerald-600 mt-1">
                                {score}%
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Award
                                size={20}
                                className="text-emerald-600"
                            />
                        </div>

                    </div>
                </div>

                {/* Correct */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-xs text-slate-400">
                                Correct
                            </p>

                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {correctAnswers}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <CheckCircle2
                                size={20}
                                className="text-green-600"
                            />
                        </div>

                    </div>
                </div>

                {/* Wrong */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-xs text-slate-400">
                                Wrong
                            </p>

                            <p className="text-2xl font-bold text-red-500 mt-1">
                                {wrongAnswers}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <XCircle
                                size={20}
                                className="text-red-500"
                            />
                        </div>

                    </div>
                </div>

                {/* Questions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-xs text-slate-400">
                                Questions
                            </p>

                            <p className="text-2xl font-bold text-slate-800 mt-1">
                                {totalQuestions}
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                            <Target
                                size={20}
                                className="text-slate-500"
                            />
                        </div>

                    </div>
                </div>

            </div>

            {/* =========================
                Progress
            ========================= */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">

                <div className="flex items-center justify-between mb-3">

                    <div>
                        <h2 className="text-sm font-bold text-slate-800">
                            Performance
                        </h2>

                        <p className="text-xs text-slate-400 mt-1">
                            {correctAnswers} out of {totalQuestions} correct
                        </p>
                    </div>

                    <span className="text-sm font-bold text-emerald-600">
                        {percentage}%
                    </span>

                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">

                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                        style={{
                            width: `${Math.min(percentage, 100)}%`,
                        }}
                    />

                </div>

            </div>

            {/* =========================
                Questions Heading
            ========================= */}
            <div className="flex items-center justify-between">

                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Question Review
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        Review your answers and explanations.
                    </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={14} />
                    {attemptedQuestions}/{totalQuestions} Attempted
                </div>

            </div>

            {/* =========================
                Questions
            ========================= */}
            <div className="space-y-3">

                {Array.isArray(result.results) &&
                    result.results.map((item, index) => {

                        const isExpanded =
                            expandedQuestion === index;

                        return (
                            <div
                                key={index}
                                className={`bg-white border rounded-2xl overflow-hidden transition-all ${item.isCorrect
                                    ? "border-green-100"
                                    : "border-red-100"
                                    }`}
                            >

                                {/* Question Header */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleQuestion(index)
                                    }
                                    className="w-full text-left p-5"
                                >

                                    <div className="flex items-start gap-4">

                                        {/* Question Number */}
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${item.isCorrect
                                                ? "bg-green-50 text-green-600"
                                                : "bg-red-50 text-red-500"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Question */}
                                        <div className="flex-1 min-w-0">

                                            <div className="flex flex-wrap items-center gap-2 mb-2">

                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-600">
                                                    {getQuestionTypeLabel(
                                                        item.type
                                                    )}
                                                </span>

                                                {item.difficulty && (
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${getDifficultyStyle(
                                                            item.difficulty
                                                        )}`}
                                                    >
                                                        {item.difficulty}
                                                    </span>
                                                )}

                                                {item.isCorrect ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600">
                                                        <CheckCircle2 size={13} />
                                                        Correct
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                                        <XCircle size={13} />
                                                        Incorrect
                                                    </span>
                                                )}

                                            </div>

                                            <h3 className="text-sm sm:text-base font-semibold text-slate-800 leading-6">
                                                {item.question}
                                            </h3>

                                        </div>

                                        {/* Arrow */}
                                        <div className="shrink-0 text-slate-400">

                                            {isExpanded ? (
                                                <ChevronUp size={20} />
                                            ) : (
                                                <ChevronDown size={20} />
                                            )}

                                        </div>

                                    </div>

                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-5 pb-5">

                                        <div className="border-t border-slate-100 pt-5 space-y-4">

                                            {/* Options */}
                                            {Array.isArray(item.options) &&
                                                item.options.length > 0 && (
                                                    <div>

                                                        <p className="text-xs font-semibold text-slate-500 mb-2">
                                                            Options
                                                        </p>

                                                        <div className="space-y-2">

                                                            {item.options.map(
                                                                (
                                                                    option,
                                                                    optionIndex
                                                                ) => {

                                                                    const isCorrectOption =
                                                                        String(
                                                                            option
                                                                        ).trim().toLowerCase() ===
                                                                        String(
                                                                            item.correctAnswer
                                                                        )
                                                                            .trim()
                                                                            .toLowerCase();

                                                                    const isSelectedOption =
                                                                        String(
                                                                            option
                                                                        ).trim().toLowerCase() ===
                                                                        String(
                                                                            item.selectedAnswer
                                                                        )
                                                                            .trim()
                                                                            .toLowerCase();

                                                                    let optionClass =
                                                                        "border-slate-200 bg-white";

                                                                    if (
                                                                        isCorrectOption
                                                                    ) {
                                                                        optionClass =
                                                                            "border-green-200 bg-green-50";
                                                                    } else if (
                                                                        isSelectedOption
                                                                    ) {
                                                                        optionClass =
                                                                            "border-red-200 bg-red-50";
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                optionIndex
                                                                            }
                                                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${optionClass}`}
                                                                        >

                                                                            <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                                                {optionIndex +
                                                                                    1}
                                                                            </span>

                                                                            <span className="flex-1 text-sm text-slate-700">
                                                                                {
                                                                                    option
                                                                                }
                                                                            </span>

                                                                            {isCorrectOption && (
                                                                                <CheckCircle2
                                                                                    size={
                                                                                        17
                                                                                    }
                                                                                    className="text-green-600"
                                                                                />
                                                                            )}

                                                                            {isSelectedOption &&
                                                                                !isCorrectOption && (
                                                                                    <XCircle
                                                                                        size={
                                                                                            17
                                                                                        }
                                                                                        className="text-red-500"
                                                                                    />
                                                                                )}

                                                                        </div>
                                                                    );
                                                                }
                                                            )}

                                                        </div>

                                                    </div>
                                                )}

                                            {/* Short Answer */}
                                            {item.type ===
                                                "short_answer" && (
                                                    <div className="grid sm:grid-cols-2 gap-3">

                                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">

                                                            <p className="text-xs font-semibold text-slate-400 mb-1">
                                                                Your Answer
                                                            </p>

                                                            <p className="text-sm font-medium text-slate-700">
                                                                {item.selectedAnswer ||
                                                                    "Not answered"}
                                                            </p>

                                                        </div>

                                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100">

                                                            <p className="text-xs font-semibold text-green-600 mb-1">
                                                                Correct Answer
                                                            </p>

                                                            <p className="text-sm font-medium text-green-800">
                                                                {
                                                                    item.correctAnswer
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>
                                                )}

                                            {/* MCQ / True False Answer Summary */}
                                            {item.type !==
                                                "short_answer" && (
                                                    <div className="grid sm:grid-cols-2 gap-3">

                                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">

                                                            <p className="text-xs font-semibold text-slate-400 mb-1">
                                                                Your Answer
                                                            </p>

                                                            <p className="text-sm font-medium text-slate-700">
                                                                {item.selectedAnswer ||
                                                                    "Not answered"}
                                                            </p>

                                                        </div>

                                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100">

                                                            <p className="text-xs font-semibold text-green-600 mb-1">
                                                                Correct Answer
                                                            </p>

                                                            <p className="text-sm font-medium text-green-800">
                                                                {
                                                                    item.correctAnswer
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>
                                                )}

                                            {/* Explanation */}
                                            {item.explanation && (
                                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">

                                                    <div className="flex items-center gap-2 mb-2">

                                                        <Sparkles
                                                            size={16}
                                                            className="text-emerald-600"
                                                        />

                                                        <p className="text-xs font-bold text-emerald-700">
                                                            Explanation
                                                        </p>

                                                    </div>

                                                    <p className="text-sm leading-6 text-emerald-900">
                                                        {item.explanation}
                                                    </p>

                                                </div>
                                            )}

                                        </div>

                                    </div>
                                )}

                            </div>
                        );
                    })}

            </div>

            {/* =========================
                Bottom Actions
            ========================= */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">

                <button
                    onClick={() => navigate(-1)}
                    className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
                >
                    <ArrowLeft size={17} />
                    Back to Quizzes
                </button>

                <button
                    onClick={() => navigate(`/quiz/${id}`)}
                    className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition"
                >
                    <RotateCcw size={17} />
                    Retake Quiz
                </button>

            </div>

        </div>
    );
};

export default QuizResultPage;