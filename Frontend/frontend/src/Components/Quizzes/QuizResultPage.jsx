import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import {
    ArrowLeft,
    Award,
    CheckCircle2,
    XCircle,
    FileText,
    Target,
    Clock,
    BookOpen,
    Loader2,
    RotateCcw,
} from "lucide-react";

import api from "../../Api";

const QuizResultPage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizResults();
    }, [quizId]);

    const fetchQuizResults = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                toast.error("Please login again");
                navigate("/");
                return;
            }

            const response = await axios.get(`${api}/quiz/${quizId}/results`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.success) {
                setResult(response.data.data);
            } else {
                toast.error(response.data?.message || "Failed to fetch quiz results");
            }
        } catch (error) {
            console.error("Fetch Quiz Results Error:", error);
            const message = error.response?.data?.message || "Failed to fetch quiz results";
            toast.error(message);

            if (error.response?.status === 400) {
                navigate(`/documents`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={38} className="animate-spin text-emerald-500" />
                    <p className="text-sm text-slate-500">Loading quiz results...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
                        <XCircle size={30} className="text-red-500" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Results Not Found</h2>
                    <p className="mt-2 text-sm text-slate-500">We couldn't load the quiz results.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const {
        title,
        document,
        score = 0,
        totalQuestions = 0,
        correctAnswers = 0,
        attemptedQuestions = 0,
        completedAt,
        results = [],
    } = result;

    // Helper to handle safe navigation back to document page
    const handleBackNavigation = () => {
        const docId = document?._id || document;
        if (docId && typeof docId === "string") {
            navigate(`/documents/${docId}`);
        } else {
            navigate(-1);
        }
    };

    const wrongAnswers = totalQuestions - correctAnswers;

    const getScoreMessage = () => {
        if (score >= 90) return "Excellent Work! 🎉";
        if (score >= 75) return "Great Job! 👏";
        if (score >= 50) return "Good Effort! 👍";
        return "Keep Practicing! 💪";
    };

    const formatDate = (date) => {
        if (!date) return "Recently";
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return "Recently";

        return parsedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const normalizeAnswer = (answer) => {
        return String(answer || "").trim().replace(/\s+/g, " ").toLowerCase();
    };

    const cleanAnswer = (answer) => {
        return String(answer || "").replace(/^\s*\d+\s*:\s*/, "").trim();
    };

    const isAnswerCorrect = (item) => {
        if (typeof item.isCorrect === "boolean") return item.isCorrect;
        const selected = normalizeAnswer(cleanAnswer(item.selectedAnswer));
        const correct = normalizeAnswer(cleanAnswer(item.correctAnswer));
        return selected === correct;
    };

    const getQuestionType = (type) => {
        switch (type) {
            case "mcq": return "Multiple Choice";
            case "true_false": return "True / False";
            case "short_answer": return "Short Answer";
            default: return "Question";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={handleBackNavigation}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
                        >
                            <ArrowLeft size={18} /> Back to Document
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock size={16} /> {formatDate(completedAt)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                {/* Title */}
                <div className="mb-7">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            <Award size={25} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Quiz Results</h1>
                            <p className="mt-1 text-sm text-slate-500">{title || "Generated Quiz"}</p>
                        </div>
                    </div>
                </div>

                {/* Score Card */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-7">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
                    <div className="p-6 sm:p-8">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">

                            {/* Score Circle */}
                            <div className="flex items-center gap-6">
                                <div className="relative w-32 h-32 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-emerald-50 border-8 border-emerald-100 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-emerald-600">{score}%</span>
                                        <span className="text-[11px] text-slate-400 font-medium">Score</span>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{getScoreMessage()}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        You answered <span className="font-semibold text-slate-700">{correctAnswers}</span> out of <span className="font-semibold text-slate-700">{totalQuestions}</span> correctly.
                                    </p>
                                    {document?.title && (
                                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                                            <FileText size={14} /> {document.title}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={17} className="text-slate-500" />
                                        <span className="text-xs text-slate-400">Questions</span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold text-slate-800">{totalQuestions}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={17} className="text-emerald-500" />
                                        <span className="text-xs text-emerald-600">Correct</span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold text-emerald-700">{correctAnswers}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                                    <div className="flex items-center gap-2">
                                        <XCircle size={17} className="text-red-500" />
                                        <span className="text-xs text-red-600">Wrong</span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold text-red-700">{wrongAnswers}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                    <div className="flex items-center gap-2">
                                        <Target size={17} className="text-blue-500" />
                                        <span className="text-xs text-blue-600">Attempted</span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold text-blue-700">{attemptedQuestions}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Question Analysis */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Question Analysis</h2>
                    <p className="mt-1 text-sm text-slate-500">Review your answers and explanations.</p>
                </div>

                <div className="space-y-5">
                    {results.map((item, index) => {
                        const correct = isAnswerCorrect(item);
                        const hasOptions = Array.isArray(item.options) && item.options.length > 0;

                        return (
                            <div key={item.questionIndex ?? index} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                                            {index + 1}
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600">
                                            {getQuestionType(item.type)}
                                        </span>
                                        {item.difficulty && (
                                            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-amber-50 text-[11px] font-semibold text-amber-700 capitalize">
                                                {item.difficulty}
                                            </span>
                                        )}
                                    </div>

                                    {correct ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
                                            <CheckCircle2 size={14} /> Correct
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-xs font-semibold text-red-700">
                                            <XCircle size={14} /> Incorrect
                                        </span>
                                    )}
                                </div>

                                <div className="p-5">
                                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-7">
                                        {item.question}
                                    </h3>

                                    {/* Options Analysis for MCQ / True-False */}
                                    {hasOptions ? (
                                        <div className="mt-5 space-y-2.5">
                                            {item.options.map((option, optionIndex) => {
                                                const isSelected = normalizeAnswer(option) === normalizeAnswer(cleanAnswer(item.selectedAnswer));
                                                const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(cleanAnswer(item.correctAnswer));

                                                let optionClass = "border-slate-200 bg-white text-slate-700";
                                                if (isCorrectOption) {
                                                    optionClass = "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium";
                                                } else if (isSelected) {
                                                    optionClass = "border-red-200 bg-red-50 text-red-800 font-medium";
                                                }

                                                return (
                                                    <div key={optionIndex} className={`flex items-center gap-3 p-3.5 rounded-xl border ${optionClass}`}>
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0">
                                                            {String.fromCharCode(65 + optionIndex)}
                                                        </div>
                                                        <span className="flex-1 text-sm">{option}</span>
                                                        {isCorrectOption && <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />}
                                                        {!isCorrectOption && isSelected && <XCircle size={17} className="text-red-500 shrink-0" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* Short Answer Analysis */
                                        <div className="mt-5 grid sm:grid-cols-2 gap-3">
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your Answer</p>
                                                <p className="mt-2 text-sm font-medium text-slate-700">{item.selectedAnswer || "Not Answered"}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Correct Answer</p>
                                                <p className="mt-2 text-sm font-medium text-emerald-800">{item.correctAnswer}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {item.explanation && (
                                        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Explanation</p>
                                            <p className="mt-1.5 text-sm text-blue-900 leading-6">{item.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                        onClick={handleBackNavigation}
                        className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
                    >
                        <ArrowLeft size={17} /> Back to Document
                    </button>
                    <button
                        onClick={() => navigate(`/quiz/${quizId}`)}
                        className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition"
                    >
                        <RotateCcw size={17} /> Retake / View Quiz
                    </button>
                </div>

            </main>
        </div>
    );
};

export default QuizResultPage;