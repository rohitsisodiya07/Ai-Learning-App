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
    GraduationCap,
    Brain,
    Trophy,
    HelpCircle,
} from "lucide-react";

import api from "../../Api";

const QuizResultPage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!quizId) {
            toast.error("Quiz ID is missing");
            navigate("/dashboard");
            return;
        }

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
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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

            if (error.response?.status === 404) {
                navigate("/dashboard");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={38} className="animate-spin text-[#19b673]" />
                    <p className="text-sm font-medium text-slate-500">Loading quiz results...</p>
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
                        className="mt-5 px-5 py-2.5 rounded-xl bg-[#19b673] hover:bg-[#159d63] text-white text-sm font-semibold transition shadow-sm"
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
        sourceType,
        score,
        totalQuestions,
        correctAnswers,
        attemptedQuestions,
        completedAt,
        results = [],
        planId,
        dayNumber,
    } = result;

    const safeResults = Array.isArray(results) ? results : [];
    const total = Number(totalQuestions) || safeResults.length || 0;
    const correct = Number((correctAnswers ?? score) ?? 0);
    const attempted = Number((attemptedQuestions ?? safeResults.filter(item => item?.selectedAnswer).length) || 0);
    const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Accurate Calculations
    const wrongAnswers = Math.max(0, attempted - correct);
    const unanswered = Math.max(0, total - attempted);

    const isStudyPlanQuiz = sourceType === "study_plan";
    const isWeakTopicQuiz = sourceType === "weak_topic";

    const handleBackNavigation = () => {
        if (isStudyPlanQuiz) {
            if (planId) {
                navigate(`/studyPlan/${planId}`);
            } else {
                navigate("/studyPlan");
            }
            return;
        }

        if (isWeakTopicQuiz) {
            navigate("/dashboard");
            return;
        }

        const docId = document?._id || document;
        if (docId) {
            navigate(`/documents/${docId}`);
        } else {
            navigate(-1);
        }
    };

    const getPageLabel = () => {
        if (isStudyPlanQuiz) return "Back to Study Plan";
        if (isWeakTopicQuiz) return "Back to Dashboard";
        return "Back to Document";
    };

    const getQuizTypeLabel = () => {
        if (isStudyPlanQuiz) return "Study Plan Quiz";
        if (isWeakTopicQuiz) return "Weak Topic Practice";
        return "Document Quiz";
    };

    const getQuizIcon = () => {
        if (isStudyPlanQuiz) return <GraduationCap size={25} className="text-[#19b673]" />;
        if (isWeakTopicQuiz) return <Brain size={25} className="text-[#19b673]" />;
        return <Award size={25} className="text-[#19b673]" />;
    };

    const getScoreMessage = () => {
        if (scorePercentage >= 90) return "Excellent Work! 🎉";
        if (scorePercentage >= 75) return "Great Job! 👏";
        if (scorePercentage >= 50) return "Good Effort! 👍";
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
        if (typeof item.isCorrect === "boolean") {
            return item.isCorrect;
        }

        const selected = normalizeAnswer(cleanAnswer(item.selectedAnswer));
        const correctAnswer = normalizeAnswer(cleanAnswer(item.correctAnswer));

        if (!selected || !correctAnswer) return false;
        if (selected === correctAnswer) return true;

        const type = item.type || item.questionType;
        if (type === "short_answer") {
            return selected === correctAnswer;
        }

        return false;
    };

    const getQuestionType = (type) => {
        switch (type) {
            case "mcq": return "Multiple Choice";
            case "true_false": return "True / False";
            case "short_answer": return "Short Answer";
            default: return "Question";
        }
    };

    const handleRetake = () => {
        if (isStudyPlanQuiz) {
            if (planId && dayNumber) {
                navigate(`/studyPlan/${planId}/day/${dayNumber}/quiz`);
            } else {
                navigate("/studyPlan");
            }
            return;
        }

        if (isWeakTopicQuiz) {
            navigate("/dashboard");
            return;
        }

        navigate(`/quiz/${quizId}`);
    };

    const scrollToQuestion = (index) => {
        const element = document.getElementById(`question-analysis-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={handleBackNavigation}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#19b673] transition"
                        >
                            <ArrowLeft size={18} />
                            {getPageLabel()}
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <Clock size={16} />
                            {formatDate(completedAt)}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-7">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            {getQuizIcon()}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                    Quiz Results
                                </h1>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-[#19b673]">
                                    {getQuizTypeLabel()}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                {title || "Generated Quiz"}
                            </p>
                        </div>
                    </div>
                </div>

                {isStudyPlanQuiz && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-3">
                            <GraduationCap size={20} className="text-[#19b673]" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-900">Study Plan Progress</p>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                    {dayNumber ? `Day ${dayNumber} quiz completed successfully.` : "Study plan quiz completed successfully."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isWeakTopicQuiz && (
                    <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-3">
                            <Brain size={20} className="text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Weak Topic Practice</p>
                                <p className="text-xs text-blue-700 mt-0.5">Practice completed for this weak topic.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREMIUM HERO RESULT CARD */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-7">
                    <div className="h-2 bg-gradient-to-r from-emerald-400 via-[#19b673] to-teal-500" />
                    <div className="p-6 sm:p-10">
                        <div className="grid lg:grid-cols-12 gap-8 items-center">

                            {/* Score Circle & Title */}
                            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center text-center sm:text-left lg:text-center gap-6">
                                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-emerald-50 border-8 border-emerald-100 flex flex-col items-center justify-center shadow-inner">
                                        <span className="text-4xl font-black text-[#19b673]">{scorePercentage}%</span>
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Score</span>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{getScoreMessage()}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        You answered <span className="font-bold text-slate-800">{correct}</span> out of <span className="font-bold text-slate-800">{total}</span> questions correctly.
                                    </p>
                                    {document?.title && (
                                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 font-medium">
                                            <FileText size={14} className="text-slate-400" />
                                            {document.title}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats & Performance Breakdown */}
                            <div className="lg:col-span-7 space-y-5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">

                                {/* 3 Stat Blocks */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                                            <CheckCircle2 size={15} /> Correct
                                        </div>
                                        <p className="text-2xl font-black text-emerald-800">{correct}</p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-red-50/70 border border-red-100 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-red-700 font-semibold mb-1">
                                            <XCircle size={15} /> Wrong
                                        </div>
                                        <p className="text-2xl font-black text-red-800">{wrongAnswers}</p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                                            <HelpCircle size={15} /> Skipped
                                        </div>
                                        <p className="text-2xl font-black text-slate-700">{unanswered}</p>
                                    </div>
                                </div>

                                {/* Performance Bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                                        <span>Performance Accuracy</span>
                                        <span className="text-[#19b673]">{scorePercentage}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-[#19b673] rounded-full transition-all duration-1000"
                                            style={{ width: `${scorePercentage}%` }}
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* QUESTION NAVIGATOR / OVERVIEW GRID */}
                {results.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-7">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                Question Overview
                            </h3>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Correct
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Incorrect
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            {results.map((item, index) => {
                                const isCorrect = isAnswerCorrect(item);
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => scrollToQuestion(index)}
                                        className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center transition shadow-sm hover:scale-105 ${isCorrect
                                                ? "bg-emerald-50 text-[#19b673] border border-emerald-200 hover:bg-emerald-100"
                                                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* QUESTION ANALYSIS HEADER */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Question Analysis</h2>
                        <p className="mt-0.5 text-sm text-slate-500">Review your answers and detailed explanations.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                        {correct} / {total} Correct
                    </span>
                </div>

                {/* QUESTION ANALYSIS LIST */}
                <div className="space-y-5">
                    {results.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                            <Target size={35} className="mx-auto text-slate-300" />
                            <p className="mt-3 text-sm text-slate-500">No question analysis available.</p>
                        </div>
                    ) : (
                        results.map((item, index) => {
                            const correctAnswer = isAnswerCorrect(item);
                            const questionType = item.type || item.questionType || "mcq";
                            const hasOptions = Array.isArray(item.options) && item.options.length > 0;
                            const selectedValue = cleanAnswer(item.selectedAnswer);
                            const correctValue = cleanAnswer(item.correctAnswer);

                            return (
                                <div
                                    key={item.questionIndex ?? index}
                                    id={`question-analysis-${index}`}
                                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
                                >
                                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                                                {index + 1}
                                            </div>
                                            <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                                                {getQuestionType(questionType)}
                                            </span>
                                            {item.difficulty && (
                                                <span className="px-3 py-1 rounded-lg bg-amber-50 text-xs font-semibold text-amber-700 capitalize border border-amber-100">
                                                    {item.difficulty}
                                                </span>
                                            )}
                                        </div>
                                        {correctAnswer ? (
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#19b673]">
                                                <CheckCircle2 size={15} /> Correct
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                                                <XCircle size={15} /> Incorrect
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-7">
                                            {item.question}
                                        </h3>

                                        {hasOptions ? (
                                            <div className="mt-5 space-y-3">
                                                {item.options.map((option, optionIndex) => {
                                                    const isSelected = normalizeAnswer(option) === normalizeAnswer(selectedValue);
                                                    const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(correctValue);

                                                    let optionClass = "border-slate-200 bg-white text-slate-700";
                                                    if (isCorrectOption) {
                                                        optionClass = "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold";
                                                    } else if (isSelected) {
                                                        optionClass = "border-red-300 bg-red-50 text-red-900 font-semibold";
                                                    }

                                                    return (
                                                        <div key={optionIndex} className={`flex items-center gap-3.5 p-4 rounded-2xl border ${optionClass} shadow-xs`}>
                                                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0 text-slate-700">
                                                                {String.fromCharCode(65 + optionIndex)}
                                                            </div>
                                                            <span className="flex-1 text-sm">{option}</span>
                                                            {isCorrectOption && <CheckCircle2 size={18} className="text-[#19b673] shrink-0" />}
                                                            {!isCorrectOption && isSelected && <XCircle size={18} className="text-red-500 shrink-0" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="mt-5 grid sm:grid-cols-2 gap-4">
                                                <div className={`p-4 rounded-2xl border ${correctAnswer ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                                                    <p className={`text-xs font-bold uppercase tracking-wider ${correctAnswer ? "text-[#19b673]" : "text-red-600"}`}>
                                                        Your Answer
                                                    </p>
                                                    <p className={`mt-2 text-sm font-semibold ${correctAnswer ? "text-emerald-900" : "text-red-900"}`}>
                                                        {selectedValue || "Not Answered"}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                                                    <p className="text-xs font-bold text-[#19b673] uppercase tracking-wider">
                                                        Correct Answer
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-emerald-900">
                                                        {correctValue}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {item.explanation && (
                                            <div className="mt-5 p-5 rounded-2xl bg-blue-50/70 border border-blue-100">
                                                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                                                    💡 Explanation
                                                </p>
                                                <p className="mt-2 text-sm text-blue-950 leading-6">
                                                    {item.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* BOTTOM NAVIGATION ACTIONS */}
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={handleBackNavigation}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 transition shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        {getPageLabel()}
                    </button>
                    <button
                        onClick={handleRetake}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#19b673] hover:bg-[#159d63] text-white text-sm font-bold shadow-sm transition hover:shadow"
                    >
                        <RotateCcw size={18} />
                        {isWeakTopicQuiz ? "Practice Again" : "Retake / View Quiz"}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default QuizResultPage;