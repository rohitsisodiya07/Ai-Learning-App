import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Trophy,
    CheckCircle,
    XCircle,
    BookOpen,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Lightbulb
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../Api";

const QuizResultPage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    // Fetch Quiz Result
    useEffect(() => {
        const fetchQuizResult = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${api}/quiz/${quizId}/results`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    setResult(response.data.data);
                } else {
                    toast.error(response.data.message || "Failed to fetch quiz result");
                }
            } catch (error) {
                console.error("Quiz Result Error:", error);
                toast.error(error.response?.data?.message || "Failed to fetch quiz result");
            } finally {
                setLoading(false);
            }
        };

        if (quizId) fetchQuizResult();
    }, [quizId, token]);

    // Loading State
    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium text-slate-500 mt-4">Analyzing your results...</p>
                </div>
            </div>
        );
    }

    // No Result State
    if (!result) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center bg-white border border-slate-200 p-8 rounded-3xl max-w-md w-full shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <RotateCcw size={28} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Result Not Found</h2>
                    <p className="text-sm text-slate-500 mt-2">Unable to load your quiz result data.</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Derived Data
    const totalQuestions = result.totalQuestions || result.results?.length || 0;
    const correctAnswers = result.correctAnswers || 0;
    const score = typeof result.score === "number" ? result.score : 0;
    const incorrectAnswers = totalQuestions - correctAnswers;

    // Dynamic Score Theme
    let scoreTheme = { color: "text-emerald-500", bg: "bg-emerald-50", message: "Excellent Work!" };
    if (score < 50) {
        scoreTheme = { color: "text-red-500", bg: "bg-red-50", message: "Needs Improvement" };
    } else if (score < 80) {
        scoreTheme = { color: "text-amber-500", bg: "bg-amber-50", message: "Good Effort!" };
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 pt-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>

            {/* Score Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-8 text-center relative overflow-hidden">
                {/* Background glow based on score */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 ${scoreTheme.bg} blur-3xl rounded-full opacity-50 pointer-events-none`} />

                <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${scoreTheme.bg}`}>
                        <Trophy size={30} className={scoreTheme.color} />
                    </div>

                    <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-6">Your Score</p>
                    <h2 className={`text-6xl sm:text-7xl font-extrabold mt-1 tracking-tight ${scoreTheme.color}`}>
                        {score}%
                    </h2>
                    <p className="text-lg font-medium text-slate-700 mt-2">{scoreTheme.message}</p>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
                        <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl">
                            <BookOpen size={16} className="text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{totalQuestions} Total</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-xl">
                            <CheckCircle size={16} className="text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">{correctAnswers} Correct</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 rounded-xl">
                            <XCircle size={16} className="text-red-500" />
                            <span className="text-sm font-medium text-red-700">{incorrectAnswers} Incorrect</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="mb-5 flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Question Review</h2>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200">
                    {totalQuestions} Questions
                </span>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                {result.results?.map((question, index) => {
                    const isCorrect = question.isCorrect === true;
                    const selectedAnswer = question.selectedAnswer;
                    const correctAnswer = question.correctAnswer;

                    return (
                        <div
                            key={question.questionIndex ?? index}
                            className={`bg-white rounded-3xl border-2 p-5 sm:p-7 shadow-sm transition ${isCorrect ? "border-emerald-100" : "border-red-100"
                                }`}
                        >
                            {/* Question Header */}
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                    {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Question {index + 1}</span>
                                    <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">{question.question}</h3>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="mt-6 space-y-3 pl-0 sm:pl-12">
                                {question.options?.map((option, optionIndex) => {
                                    const isSelected = option === selectedAnswer;
                                    const isCorrectOption = option === correctAnswer;

                                    let optionClass = "border-slate-200 bg-white text-slate-600";
                                    let icon = null;

                                    if (isSelected && isCorrect) {
                                        optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-sm";
                                        icon = <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />;
                                    } else if (isSelected && !isCorrect) {
                                        optionClass = "border-red-500 bg-red-50 text-red-800 font-semibold shadow-sm";
                                        icon = <XCircle className="text-red-500 shrink-0" size={18} />;
                                    } else if (!isSelected && isCorrectOption) {
                                        optionClass = "border-emerald-400 border-dashed bg-emerald-50/50 text-emerald-700 font-medium";
                                        icon = <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />;
                                    }

                                    return (
                                        <div key={optionIndex} className={`border rounded-xl px-4 py-3.5 text-sm sm:text-base flex items-center gap-3 transition-all ${optionClass}`}>
                                            <div className="flex-1">{option}</div>
                                            {icon && <div>{icon}</div>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation Box */}
                            {question.explanation && (
                                <div className="mt-6 pl-0 sm:pl-12">
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Lightbulb size={16} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1">Explanation</p>
                                            <p className="text-sm text-slate-700 leading-relaxed">{question.explanation}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default QuizResultPage;