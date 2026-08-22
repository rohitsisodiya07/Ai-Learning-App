import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    Trophy,
    HelpCircle,
    Circle,
    Loader2,
    AlertCircle,
    Send,
    Sparkles
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import api from "../../Api";

const QuizTakePage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    const [submitting, setSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Fetch Quiz
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const response = await axios.get(`${api}/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log("Fetched Quiz Data:", response.data);
                const actualQuizData = response.data?.data || response.data?.quiz || response.data;
                setQuiz(actualQuizData);
            } catch (error) {
                console.error("Failed to fetch quiz:", error);
                toast.error(error.response?.data?.message || "Failed to load quiz");
            } finally {
                setLoading(false);
            }
        };

        if (quizId) {
            fetchQuiz();
        }
    }, [quizId]);

    // Derived Quiz Data
    const totalQuestions = quiz?.questions?.length || 0;
    const currentQuestion = quiz?.questions?.[currentQuestionIndex];
    const questionId = currentQuestion?._id;
    const answeredCount = Object.keys(selectedAnswers).length;
    const unansweredCount = totalQuestions - answeredCount;

    const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
    const answeredProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const isAnswered = questionId && Object.prototype.hasOwnProperty.call(selectedAnswers, questionId);
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    // Handlers
    const handleOptionChange = (questionId, optionIndex) => {
        setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    };

    const goToQuestion = (index) => {
        if (index >= 0 && index < totalQuestions) {
            setCurrentQuestionIndex(index);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleNextQuestion = () => {
        if (!isLastQuestion) goToQuestion(currentQuestionIndex + 1);
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
    };

    const handleSubmitQuiz = async () => {
        if (!quiz?.questions?.length) return;

        if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
            toast.error(`Please answer all ${quiz.questions.length} questions before submitting.`);
            setShowSubmitModal(false);
            return;
        }

        const formattedAnswers = quiz.questions.map((question, index) => ({
            questionIndex: index,
            selectedAnswer: question.options[selectedAnswers[question._id]]
        }));

        try {
            setSubmitting(true);
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${api}/quiz/${quizId}/submit`,
                { answers: formattedAnswers },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Quiz submitted successfully!");
            navigate(`/quiz/${quizId}/results`, { state: { result: response.data } });
        } catch (error) {
            console.error("Submit quiz error:", error);
            toast.error(error.response?.data?.message || "Failed to submit quiz");
        } finally {
            setSubmitting(false);
            setShowSubmitModal(false);
        }
    };

    const getOptionLetter = (index) => String.fromCharCode(65 + index);

    // Loading State
    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-900">Loading quiz</h3>
                    <p className="text-sm text-slate-500 mt-1">Preparing your questions...</p>
                </div>
            </div>
        );
    }

    // Not Found State
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-5">Quiz Not Available</h2>
                    <p className="text-sm text-slate-500 mt-2 leading-6">
                        This quiz could not be found or doesn't contain any questions.
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition"
                    >
                        <ChevronLeft size={17} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/70">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

                {/* TOP HEADER */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                                    {quiz.title || "Take Quiz"}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Test your knowledge and complete all questions.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                                <HelpCircle size={16} className="text-slate-500" />
                                <span className="text-xs sm:text-sm font-semibold text-slate-700">
                                    {totalQuestions} Questions
                                </span>
                            </div>
                            {quiz.timeLimit && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                                    <Clock size={16} />
                                    <span className="text-xs sm:text-sm font-semibold">{quiz.timeLimit} min</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PROGRESS */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                Question {currentQuestionIndex + 1} <span className="font-medium text-slate-400">/ {totalQuestions}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {answeredCount} of {totalQuestions} answered
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-600">
                                {Math.round(answeredProgress)}% complete
                            </span>
                        </div>
                    </div>
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

                    {/* QUESTION SECTION */}
                    <div>
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                                    <Sparkles size={14} />
                                    <span className="text-xs font-bold">Question {currentQuestionIndex + 1}</span>
                                </div>
                                {isAnswered && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                        <CheckCircle2 size={15} /> Answered
                                    </span>
                                )}
                            </div>

                            <div className="px-5 sm:px-7 py-6 sm:py-8">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed tracking-tight">
                                    {currentQuestion.question}
                                </h2>

                                {/* Options */}
                                <div className="mt-7 space-y-3">
                                    {currentQuestion.options?.map((option, index) => {
                                        const isSelected = selectedAnswers[questionId] === index;
                                        return (
                                            <label
                                                key={index}
                                                className={`group relative flex items-center gap-3 sm:gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                                                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${questionId}`}
                                                    value={index}
                                                    checked={isSelected}
                                                    onChange={() => handleOptionChange(questionId, index)}
                                                    className="sr-only"
                                                />

                                                {/* Letter */}
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all ${isSelected
                                                            ? "bg-emerald-500 text-white shadow-sm"
                                                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                                        }`}
                                                >
                                                    {getOptionLetter(index)}
                                                </div>

                                                {/* Option Text */}
                                                <span className={`flex-1 text-sm sm:text-base font-medium leading-6 ${isSelected ? "text-emerald-900" : "text-slate-700"}`}>
                                                    {option}
                                                </span>

                                                {/* Check */}
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"
                                                        }`}
                                                >
                                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Selection Hint */}
                                <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                                    <Circle size={13} />
                                    <span>Select one option to continue</span>
                                </div>
                            </div>
                        </div>

                        {/* NAVIGATION BUTTONS */}
                        <div className="flex items-center justify-between gap-3 mt-5">
                            <button
                                type="button"
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={18} />
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            {isLastQuestion ? (
                                <button
                                    type="button"
                                    onClick={() => setShowSubmitModal(true)}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-60 transition-all active:scale-[0.98]"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Submit Quiz</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleNextQuestion}
                                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* QUESTION NAVIGATOR */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 lg:sticky lg:top-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Questions</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Jump to any question</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600">{answeredCount}/{totalQuestions}</span>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {quiz.questions.map((question, index) => {
                                const answered = Object.prototype.hasOwnProperty.call(selectedAnswers, question._id);
                                const active = index === currentQuestionIndex;

                                return (
                                    <button
                                        key={question._id || index}
                                        type="button"
                                        onClick={() => goToQuestion(index)}
                                        className={`relative aspect-square rounded-xl text-xs font-bold transition-all ${active
                                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                : answered
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {index + 1}
                                        {answered && !active && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-3 h-3 rounded bg-emerald-500" /> Current question
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Answered
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Not answered
                            </div>
                        </div>

                        {unansweredCount > 0 && (
                            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-xs leading-5 text-amber-700">
                                        {unansweredCount} {unansweredCount === 1 ? "question" : "questions"} remaining.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SUBMIT CONFIRMATION MODAL */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !submitting && setShowSubmitModal(false)} />

                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                            <Send className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Submit Quiz?</h2>
                        <p className="text-sm text-slate-500 mt-2 leading-6">
                            You have answered all <span className="font-semibold text-slate-700">{totalQuestions}</span> questions. Once submitted, your answers will be evaluated.
                        </p>

                        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Answered</span>
                                <span className="font-bold text-emerald-600">{answeredCount}/{totalQuestions}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
                            >
                                Continue Quiz
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitQuiz}
                                disabled={submitting}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 transition"
                            >
                                {submitting ? (
                                    <><Loader2 size={17} className="animate-spin" /> Submitting...</>
                                ) : (
                                    <><Send size={17} /> Submit</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizTakePage;