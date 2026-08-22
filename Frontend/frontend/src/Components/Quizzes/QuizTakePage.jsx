import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import api from '../../Api'

const QuizTakePage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Get Quiz
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                if (!token) {
                    toast.error("Please login first");
                    navigate("/");
                    return;
                }

                if (!quizId) {
                    toast.error("Quiz ID missing");
                    navigate("/documents");
                    return;
                }

                const response = await axios.get(`${api}/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.success) {
                    const fetchedQuiz = response.data.data;

                    // Agar quiz already completed hai, toh turant result page par bhej do
                    if (fetchedQuiz.completedAt) {
                        toast("Quiz already submitted. Redirecting to results...", { icon: 'ℹ️' });
                        navigate(`/quiz/${quizId}/results`, { replace: true });
                        return; // Yahan se function return ho jayega, loader ghumta rahega flash nahi hoga
                    }

                    setQuiz(fetchedQuiz);
                    setLoading(false); // Sirf tabhi loading false karo jab quiz take karna ho
                } else {
                    toast.error("Failed to load quiz");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Fetch Quiz Error:", error);
                toast.error(error.response?.data?.message || "Failed to load quiz");
                navigate("/documents");
                setLoading(false);
            }
            // Humne finally block hata diya hai taaki response scope ka error na aaye
        };

        fetchQuiz();
    }, [quizId, navigate]);

    // Select Answer
    const handleAnswerChange = (questionIndex, answer) => {
        setAnswers((prev) => ({
            ...prev,
            [questionIndex]: answer,
        }));
    };

    // Submit Quiz
    const handleSubmitQuiz = async () => {
        if (!quiz) return;

        const totalQuestions = quiz.questions.length;

        if (Object.keys(answers).length !== totalQuestions) {
            toast.error(`Please answer all ${totalQuestions} questions`);
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem("token");

            if (!token) {
                toast.error("Please login again");
                navigate("/");
                return;
            }

            const formattedAnswers = quiz.questions.map((_, index) => ({
                questionIndex: index,
                selectedAnswer: answers[index],
            }));

            const response = await axios.post(
                `${api}/quiz/${quizId}/submit`,
                { answers: formattedAnswers },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                toast.success("Quiz submitted successfully!");
                navigate(`/quiz/${quizId}/results`, {
                    state: { result: response.data.data },
                });
            }
        } catch (error) {
            console.error("Submit quiz error:", error);
            toast.error(error.response?.data?.message || "Failed to submit quiz");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={35} className="animate-spin text-emerald-500" />
                    <p className="text-sm text-slate-500">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800">Quiz not found</h2>
                    <button
                        onClick={() => navigate("/documents")}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold"
                    >
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        <div className="flex items-center gap-2">
                            <Trophy size={20} className="text-emerald-500" />
                            <span className="font-bold text-slate-800">Quiz</span>
                        </div>

                        <div className="text-sm font-medium text-slate-500">
                            {Object.keys(answers).length} / {quiz.questions.length} answered
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-5 py-8">

                {/* Quiz Title Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                            {quiz.questions.length} Questions
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium">
                            AI Generated
                        </span>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-5">
                    {quiz.questions.map((question, index) => {
                        const selectedAnswer = answers[index];
                        const qType = question.questionType || question.type;

                        return (
                            <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">

                                        {/* Type & Difficulty Badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                                {qType === "true_false" ? "True / False" : qType === "short_answer" ? "Short Answer" : "MCQ"}
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500 capitalize font-medium">{question.difficulty}</span>
                                        </div>

                                        {/* Question Text */}
                                        <h2 className="text-base md:text-lg font-semibold text-slate-900 leading-7">
                                            {question.question}
                                        </h2>

                                        {/* Answer Inputs based on Type */}
                                        {qType === "short_answer" ? (
                                            <textarea
                                                value={selectedAnswer || ""}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                placeholder="Write your answer here..."
                                                rows={4}
                                                className="w-full mt-5 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none text-sm text-slate-800"
                                            />
                                        ) : (
                                            <div className="grid gap-3 mt-5">
                                                {question.options?.map((option, optionIndex) => {
                                                    const isSelected = selectedAnswer === option;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={optionIndex}
                                                            onClick={() => handleAnswerChange(index, option)}
                                                            className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${isSelected
                                                                ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium"
                                                                : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700"
                                                                }`}
                                                        >
                                                            {isSelected ? (
                                                                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                                            ) : (
                                                                <Circle size={20} className="text-slate-300 shrink-0" />
                                                            )}
                                                            <span className="text-sm">{option}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Submit Section */}
                <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="font-semibold text-slate-800">Ready to submit?</p>
                            <p className="text-sm text-slate-500 mt-1">
                                Answered {Object.keys(answers).length} of {quiz.questions.length} questions
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            disabled={submitting}
                            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                            ) : (
                                <><Send size={18} /> Submit Quiz</>
                            )}
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default QuizTakePage;