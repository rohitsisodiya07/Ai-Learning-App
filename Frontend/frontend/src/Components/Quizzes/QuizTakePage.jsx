import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Loader2,
    Send,
    Trophy,
    AlertCircle,
} from "lucide-react";
import api from "../../Api";

const QuizTakePage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true);
                setError("");

                if (!token) {
                    toast.error("Please login first");
                    navigate("/");
                    return;
                }

                if (!quizId) {
                    setError("Quiz ID is missing");
                    return;
                }

                const response = await axios.get(`${api}/quiz/${quizId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.data?.success) {
                    throw new Error(response.data?.message || "Failed to load quiz");
                }

                const fetchedQuiz = response.data.data;

                if (!fetchedQuiz?._id) {
                    throw new Error("Invalid quiz data");
                }

                if (!Array.isArray(fetchedQuiz.questions) || fetchedQuiz.questions.length === 0) {
                    throw new Error("No questions available in this quiz");
                }

                if (fetchedQuiz.completedAt) {
                    toast("Quiz already submitted. Redirecting...", { icon: "ℹ️" });
                    navigate(`/quiz/${quizId}/results`, { replace: true });
                    return;
                }

                const cleanedQuestions = fetchedQuiz.questions.map((question) => {
                    let type = question.questionType || question.type || "mcq";
                    type = String(type).toLowerCase().trim();

                    if (type === "multiple_choice" || type === "multiple-choice" || type === "multiplechoice") {
                        type = "mcq";
                    }

                    if (type === "truefalse" || type === "true-false" || type === "true/false") {
                        type = "true_false";
                    }

                    if (type === "short-answer" || type === "shortanswer") {
                        type = "short_answer";
                    }

                    let options = Array.isArray(question.options)
                        ? question.options.filter((option) => typeof option === "string" && option.trim().length > 0)
                        : [];

                    if (type === "true_false") {
                        options = ["True", "False"];
                    }

                    if (type === "short_answer") {
                        options = [];
                    }

                    return {
                        ...question,
                        questionType: type,
                        options,
                    };
                });

                setQuiz({
                    ...fetchedQuiz,
                    questions: cleanedQuestions,
                });
            } catch (error) {
                console.error("Fetch Quiz Error:", error);
                const message = error.response?.data?.message || error.message || "Failed to load quiz";
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId, navigate, token]);

    const questions = quiz?.questions || [];

    const answeredCount = useMemo(() => {
        return Object.values(answers).filter(
            (answer) => typeof answer === "string" && answer.trim().length > 0
        ).length;
    }, [answers]);

    const handleAnswerChange = (questionIndex, answer) => {
        setAnswers((previous) => ({
            ...previous,
            [questionIndex]: answer,
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!quiz) return;

        const totalQuestions = questions.length;
        const unansweredQuestions = questions
            .map((question, index) => ({ question, index }))
            .filter(({ index }) => !answers[index] || !String(answers[index]).trim());

        if (unansweredQuestions.length > 0) {
            toast.error(`Please answer all ${totalQuestions} questions`);
            const firstIndex = unansweredQuestions[0].index;

            setTimeout(() => {
                document.getElementById(`question-${firstIndex}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 100);
            return;
        }

        try {
            setSubmitting(true);
            const currentToken = localStorage.getItem("token");

            if (!currentToken) {
                toast.error("Please login again");
                navigate("/");
                return;
            }

            const formattedAnswers = questions.map((_, index) => ({
                questionIndex: index,
                selectedAnswer: String(answers[index]).trim(),
            }));

            const response = await axios.post(
                `${api}/quiz/${quizId}/submit`,
                { answers: formattedAnswers },
                {
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to submit quiz");
            }

            toast.success("Quiz submitted successfully!");

            navigate(`/quiz/${quizId}/results`, {
                state: { result: response.data.data },
            });
        } catch (error) {
            console.error("Submit Quiz Error:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to submit quiz");
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={38} className="animate-spin text-emerald-500" />
                    <p className="text-sm font-medium text-slate-500">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                        <AlertCircle size={28} className="text-red-500" />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-slate-900">Unable to load quiz</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
                    <button
                        onClick={handleBack}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
                    >
                        <ArrowLeft size={17} />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Trophy size={45} className="mx-auto text-slate-300" />
                    <h2 className="mt-4 text-xl font-bold text-slate-800">Quiz not found</h2>
                    <button
                        onClick={handleBack}
                        className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    const progress = totalQuestionsSafe(answeredCount, questions.length);

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-5xl px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>
                        <div className="hidden sm:flex items-center gap-2">
                            <Trophy size={20} className="text-emerald-500" />
                            <span className="font-bold text-slate-800">Quiz</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">
                                {answeredCount} / {questions.length}
                            </p>
                            <p className="text-xs text-slate-400">Answered</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-4xl px-5 py-8">
                <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-6 md:p-7">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                                    AI Generated Quiz
                                </p>
                                <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                                    {quiz.title || "Quiz"}
                                </h1>
                            </div>
                            <div className="flex shrink-0 items-center justify-center rounded-2xl bg-emerald-50 p-4">
                                <Trophy size={28} className="text-emerald-500" />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                {questions.length} Questions
                            </span>
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                Mixed Quiz
                            </span>
                        </div>

                        <div className="mt-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">Your Progress</span>
                                <span className="text-xs font-bold text-emerald-600">{progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {questions.map((question, index) => {
                        const selectedAnswer = answers[index];
                        let qType = question.questionType || question.type || "mcq";
                        const normalizedType = String(qType).toLowerCase().trim();

                        const isShortAnswer = normalizedType === "short_answer" || normalizedType === "short-answer" || normalizedType === "shortanswer";
                        const isTrueFalse = normalizedType === "true_false" || normalizedType === "true-false" || normalizedType === "truefalse";

                        return (
                            <div
                                id={`question-${index}`}
                                key={index}
                                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md md:p-7"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-600">
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                                                {isShortAnswer ? "Short Answer" : isTrueFalse ? "True / False" : "MCQ"}
                                            </span>
                                            {question.difficulty && (
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-500">
                                                    {question.difficulty}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="text-base font-semibold leading-7 text-slate-900 md:text-lg">
                                            {question.question}
                                        </h2>
                                    </div>
                                </div>

                                {isShortAnswer ? (
                                    <div className="mt-6">
                                        <textarea
                                            value={selectedAnswer || ""}
                                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                                            placeholder="Write your answer here..."
                                            rows={4}
                                            className={`w-full resize-none rounded-2xl border px-4 py-4 text-sm leading-6 text-slate-800 outline-none transition ${selectedAnswer?.trim()
                                                    ? "border-emerald-400 bg-emerald-50/30"
                                                    : "border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                                                }`}
                                        />
                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-xs text-slate-400">Type your answer in your own words.</p>
                                            {selectedAnswer?.trim() && (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                                    <CheckCircle2 size={14} /> Answered
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 grid gap-3">
                                        {(isTrueFalse
                                            ? ["True", "False"]
                                            : Array.isArray(question.options) ? question.options : []
                                        ).map((option, optionIndex) => {
                                            const isSelected = selectedAnswer === option;
                                            return (
                                                <button
                                                    type="button"
                                                    key={optionIndex}
                                                    onClick={() => handleAnswerChange(index, option)}
                                                    className={`group flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${isSelected
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${isSelected
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                                            }`}
                                                    >
                                                        {isTrueFalse
                                                            ? option === "True" ? "✓" : "×"
                                                            : String.fromCharCode(65 + optionIndex)}
                                                    </div>
                                                    <span className="flex-1 text-sm font-medium">{option}</span>
                                                    {isSelected && <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />}
                                                </button>
                                            );
                                        })}
                                        {!isTrueFalse && (!Array.isArray(question.options) || question.options.length === 0) && (
                                            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
                                                This question does not contain valid options.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-6 md:p-7">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-bold text-slate-900">Ready to submit?</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Answered <span className="font-semibold text-slate-700">{answeredCount}</span> of <span className="font-semibold text-slate-700">{questions.length}</span> questions
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmitQuiz}
                                disabled={submitting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} /> Submit Quiz
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const totalQuestionsSafe = (answered, total) => {
    if (!total || total <= 0) return 0;
    return Math.round((answered / total) * 100);
};

export default QuizTakePage;
