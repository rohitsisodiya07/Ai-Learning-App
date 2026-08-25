import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Trophy,
    RotateCcw,
    Target,
    AlertCircle,
    PenLine,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../Api";

const StudyPlanQuiz = () => {
    const { planId, dayNumber } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const getQuiz = async () => {
        try {
            setLoading(true);
            setError("");

            if (!planId || !dayNumber) {
                throw new Error("Study plan ID or day number is missing");
            }

            if (!token) {
                toast.error("Please login first");
                navigate("/");
                return;
            }

            const response = await axios.post(
                `${api}/studyPlan/${planId}/day/${dayNumber}/quiz`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message || "Failed to load quiz"
                );
            }

            const quizData = response.data.data;

            if (!quizData?._id) {
                throw new Error("Quiz ID not received from server");
            }

            if (
                !Array.isArray(quizData.questions) ||
                quizData.questions.length === 0
            ) {
                throw new Error("No quiz questions available");
            }

            setQuiz(quizData);

            const previousAnswers = {};
            (quizData.userAnswers || []).forEach((answer) => {
                previousAnswers[answer.questionIndex] = answer.selectedAnswer;
            });

            setSelectedAnswers(previousAnswers);

            if (quizData.completedAt) {
                const totalQuestions =
                    quizData.totalQuestions || quizData.questions.length;
                const score = quizData.score || 0;

                setResult({
                    quizId: quizData._id,
                    score,
                    totalQuestions,
                    percentage:
                        totalQuestions > 0
                            ? Math.round((score / totalQuestions) * 100)
                            : 0,
                    userAnswers: quizData.userAnswers || [],
                    completedAt: quizData.completedAt,
                });
            }
        } catch (error) {
            console.error("Get Study Plan Quiz Error:", error);
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to load quiz";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getQuiz();
    }, [planId, dayNumber]);

    const questions = quiz?.questions || [];
    const currentQuestion = questions[currentIndex];

    const getQuestionType = (question) => {
        if (!question) return "mcq";
        let type = question.questionType || question.type || "mcq";
        type = String(type).toLowerCase().trim();

        if (
            type === "multiple_choice" ||
            type === "multiple-choice" ||
            type === "multiplechoice"
        ) {
            return "mcq";
        }
        if (
            type === "truefalse" ||
            type === "true-false" ||
            type === "true/false"
        ) {
            return "true_false";
        }
        if (type === "short-answer" || type === "shortanswer") {
            return "short_answer";
        }
        return type;
    };

    const questionType = getQuestionType(currentQuestion);
    const options = Array.isArray(currentQuestion?.options)
        ? currentQuestion.options
        : [];

    const selectAnswer = (answer) => {
        if (result) return;
        setSelectedAnswers((previous) => ({
            ...previous,
            [currentIndex]: answer,
        }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((previous) => previous + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex((previous) => previous - 1);
        }
    };

    const submitQuiz = async () => {
        try {
            if (!quiz?._id) {
                toast.error("Quiz ID is missing");
                return;
            }

            const unansweredQuestions = questions.filter((_, index) => {
                const answer = selectedAnswers[index];
                return (
                    answer === undefined ||
                    answer === null ||
                    String(answer).trim() === ""
                );
            });

            if (unansweredQuestions.length > 0) {
                toast.error(`Please answer all ${questions.length} questions`);
                return;
            }

            setSubmitting(true);

            const answers = questions.map((_, index) => ({
                questionIndex: index,
                selectedAnswer: selectedAnswers[index],
            }));

            const response = await axios.patch(
                `${api}/studyPlan/quiz/${quiz._id}/submit`,
                { answers },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message || "Failed to submit quiz"
                );
            }

            const resultData = response.data.data;
            setResult(resultData);

            setQuiz((previous) => ({
                ...previous,
                completedAt: resultData.completedAt,
                score: resultData.score,
                totalQuestions: resultData.totalQuestions,
                userAnswers: resultData.userAnswers,
            }));

            toast.success("Quiz submitted successfully!");
        } catch (error) {
            console.error("Submit Study Plan Quiz Error:", error);
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Failed to submit quiz"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const goBack = () => {
        navigate(`/studyPlan/${planId}`);
    };

    const viewResult = () => {
        if (!quiz?._id) {
            toast.error("Quiz ID is missing");
            return;
        }
        navigate(`/studyPlan/quiz/${quiz._id}/results`);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={38}
                        className="animate-spin text-[#19b673]"
                    />
                    <p className="text-sm font-medium text-slate-500">
                        Preparing your quiz...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                        <AlertCircle size={27} />
                    </div>
                    <h2 className="mt-5 text-lg font-bold text-slate-900">
                        Unable to load quiz
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {error}
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            onClick={goBack}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                        <button
                            onClick={getQuiz}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#149e63]"
                        >
                            <RotateCcw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Target size={45} className="mx-auto text-slate-300" />
                    <h2 className="mt-4 text-lg font-bold text-slate-800">
                        No quiz available
                    </h2>
                    <button
                        onClick={goBack}
                        className="mt-5 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                    >
                        Back to Study Plan
                    </button>
                </div>
            </div>
        );
    }

    const getResultMessage = (percentage) => {
        if (percentage >= 90) return "Excellent work!";
        if (percentage >= 75) return "Great job!";
        if (percentage >= 60) return "Good effort!";
        return "Keep practicing!";
    };

    if (result) {
        const percentage =
            result.percentage ??
            (result.totalQuestions > 0
                ? Math.round((result.score / result.totalQuestions) * 100)
                : 0);
        const passed = percentage >= 60;

        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-8">
                <div className="mx-auto max-w-3xl">
                    <button
                        onClick={goBack}
                        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#19b673]"
                    >
                        <ArrowLeft size={18} />
                        Back to Study Plan
                    </button>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col items-center px-6 py-10 text-center md:px-10">
                            <div
                                className={`flex h-20 w-20 items-center justify-center rounded-3xl ${
                                    passed ? "bg-emerald-50 text-[#19b673]" : "bg-orange-50 text-orange-500"
                                }`}
                            >
                                {passed ? <Trophy size={38} /> : <Target size={38} />}
                            </div>

                            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Day {dayNumber} Quiz
                            </p>
                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                Quiz Completed!
                            </h1>

                            <div className="mt-7 flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 border-emerald-50 bg-white shadow-inner">
                                <span className="text-3xl font-bold text-[#19b673]">
                                    {percentage}%
                                </span>
                                <span className="mt-1 text-xs font-semibold text-slate-400">
                                    Score
                                </span>
                            </div>

                            <p className="mt-6 text-sm text-slate-500">
                                You scored <span className="font-bold text-slate-800">{result.score}</span> out of <span className="font-bold text-slate-800">{result.totalQuestions}</span> questions.
                            </p>

                            <p className="mt-2 text-sm font-medium text-slate-600">
                                {getResultMessage(percentage)}
                            </p>

                            <div
                                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold border ${
                                    passed ? "bg-emerald-50 text-[#19b673] border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                }`}
                            >
                                <CheckCircle2 size={15} />
                                {passed ? "Great job!" : "Keep practicing!"}
                            </div>

                            <div className="mt-7 flex flex-wrap justify-center gap-3">
                                <button
                                    onClick={viewResult}
                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-[#168d5b] hover:bg-emerald-100 shadow-sm"
                                >
                                    <Trophy size={16} />
                                    View Detailed Result
                                </button>
                                <button
                                    onClick={goBack}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#149e63] shadow-sm"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Study Plan
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 border-t border-slate-100">
                            <div className="border-r border-slate-100 p-5 text-center">
                                <p className="text-xs font-medium text-slate-400">Correct</p>
                                <p className="mt-1 text-xl font-bold text-[#19b673]">
                                    {result.score}
                                </p>
                            </div>
                            <div className="p-5 text-center">
                                <p className="text-xs font-medium text-slate-400">Total Questions</p>
                                <p className="mt-1 text-xl font-bold text-slate-900">
                                    {result.totalQuestions}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const selectedAnswer = selectedAnswers[currentIndex] || "";
    const answeredCount = Object.values(selectedAnswers).filter(
        (answer) =>
            answer !== undefined &&
            answer !== null &&
            String(answer).trim() !== ""
    ).length;

    const questionProgress = ((currentIndex + 1) / questions.length) * 100;
    const isLastQuestion = currentIndex === questions.length - 1;
    const hasAnswer =
        selectedAnswer !== undefined &&
        selectedAnswer !== null &&
        String(selectedAnswer).trim() !== "";

    const getTypeLabel = () => {
        if (questionType === "mcq") return "Multiple Choice";
        if (questionType === "true_false") return "True / False";
        if (questionType === "short_answer") return "Short Answer";
        return "Question";
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-5 md:px-6 md:py-8">
            <div className="mx-auto max-w-4xl">

                {/* TOP BAR */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#19b673]"
                    >
                        <ArrowLeft size={18} />
                        Study Plan
                    </button>

                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                        <Target size={15} className="text-[#19b673]" />
                        {answeredCount}/{questions.length} Answered
                    </div>
                </div>

                {/* QUIZ HEADER */}
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-[#19b673]">
                            <Target size={23} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Day {dayNumber}
                            </p>
                            <h1 className="mt-1 text-lg font-bold text-slate-900 md:text-xl">
                                {quiz.title || "Study Plan Quiz"}
                            </h1>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <span className="text-xs font-bold text-[#19b673]">
                                {Math.round(questionProgress)}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-[#19b673] transition-all duration-300"
                                style={{ width: `${questionProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* QUESTION CARD */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-5 flex items-center justify-between">
                        <div
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border ${
                                questionType === "short_answer"
                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                    : questionType === "true_false"
                                    ? "bg-purple-50 text-purple-600 border-purple-100"
                                    : "bg-emerald-50 text-[#19b673] border-emerald-100"
                            }`}
                        >
                            {questionType === "short_answer" ? <PenLine size={14} /> : <Target size={14} />}
                            {getTypeLabel()}
                        </div>

                        <span className="text-xs font-semibold text-slate-400">
                            {currentQuestion?.difficulty
                                ? currentQuestion.difficulty.charAt(0).toUpperCase() +
                                  currentQuestion.difficulty.slice(1)
                                : "Medium"}
                        </span>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#19b673]">
                            {currentIndex + 1}
                        </div>
                        <h2 className="text-lg font-bold leading-7 text-slate-900 md:text-xl">
                            {currentQuestion?.question}
                        </h2>
                    </div>

                    {/* MCQ */}
                    {questionType === "mcq" && (
                        <div className="mt-7 space-y-3">
                            {options.length === 4 ? (
                                options.map((option, optionIndex) => {
                                    const isSelected = selectedAnswer === option;
                                    return (
                                        <button
                                            key={optionIndex}
                                            type="button"
                                            onClick={() => selectAnswer(option)}
                                            className={`group relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                                                isSelected
                                                    ? "border-[#19b673] bg-emerald-50 shadow-sm shadow-emerald-100"
                                                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                                                    isSelected
                                                        ? "bg-[#19b673] text-white shadow-sm"
                                                        : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-[#19b673]"
                                                }`}
                                            >
                                                {String.fromCharCode(65 + optionIndex)}
                                            </div>
                                            <span
                                                className={`text-sm font-medium ${
                                                    isSelected ? "text-emerald-900 font-semibold" : "text-slate-700"
                                                }`}
                                            >
                                                {option}
                                            </span>
                                            {isSelected && (
                                                <CheckCircle2
                                                    size={19}
                                                    className="ml-auto shrink-0 text-[#19b673]"
                                                />
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
                                    This MCQ does not contain 4 valid options.
                                </div>
                            )}
                        </div>
                    )}

                    {/* TRUE / FALSE */}
                    {questionType === "true_false" && (
                        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {["True", "False"].map((option) => {
                                const isSelected = selectedAnswer === option;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => selectAnswer(option)}
                                        className={`flex items-center justify-center gap-3 rounded-2xl border p-5 text-sm font-bold transition ${
                                            isSelected
                                                ? "border-[#19b673] bg-emerald-50 text-[#168d5b] shadow-sm"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40"
                                        }`}
                                    >
                                        {isSelected && <CheckCircle2 size={19} />}
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* SHORT ANSWER */}
                    {questionType === "short_answer" && (
                        <div className="mt-7">
                            <div className="relative">
                                <textarea
                                    value={selectedAnswer}
                                    onChange={(e) => selectAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    rows={5}
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-emerald-50"
                                />
                                <div className="pointer-events-none absolute bottom-3 right-3">
                                    <PenLine size={17} className="text-slate-300" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                Write a concise answer based on the concept.
                            </p>
                        </div>
                    )}

                    {/* NAVIGATION */}
                    <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                        >
                            <ChevronLeft size={17} />
                            Previous
                        </button>

                        <div className="flex flex-col items-end">
                            {isLastQuestion ? (
                                <button
                                    onClick={submitQuiz}
                                    disabled={submitting || !hasAnswer}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#149e63] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={17} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Quiz
                                            <CheckCircle2 size={17} />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    disabled={!hasAnswer}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#149e63] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                                >
                                    Next
                                    <ChevronRight size={17} />
                                </button>
                            )}

                            {isLastQuestion && (
                                <p className="mt-2 text-xs text-slate-400">
                                    {answeredCount === questions.length
                                        ? "All questions answered"
                                        : `${questions.length - answeredCount} question${
                                              questions.length - answeredCount > 1 ? "s" : ""
                                          } remaining`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* QUESTION DOTS & LEGEND */}
                <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Questions
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-[#19b673]" />
                                Current
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-100" />
                                Answered
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-slate-200" />
                                Pending
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {questions.map((_, index) => {
                            const answer = selectedAnswers[index];
                            const answered =
                                answer !== undefined &&
                                answer !== null &&
                                String(answer).trim() !== "";
                            const active = index === currentIndex;

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCurrentIndex(index)}
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                                        active
                                            ? "bg-[#19b673] text-white shadow-md shadow-emerald-200 scale-105"
                                            : answered
                                            ? "border border-emerald-200 bg-emerald-50 text-[#168d5b]"
                                            : "border border-slate-200 bg-white text-slate-400 hover:border-emerald-200 hover:text-[#19b673]"
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StudyPlanQuiz;