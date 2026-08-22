import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Brain,
  Plus,
  Trash2,
  Play,
  FileQuestion,
  X,
  CheckCircle2,
  Clock,
  BarChart3,
  ListChecks
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import api from "../../Api";
import Spinner from "../Common/Spinner";

const QuizManager = ({ documentData, documentId }) => {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  // Changed from array to single string to match backend requirements
  const [questionType, setQuestionType] = useState("mixed");

  const questionTypeOptions = [
    { value: "mixed", label: "Mixed (All Types)", description: "A balanced mix of multiple choice, true/false, and short answers" },
    { value: "mcq", label: "Multiple Choice", description: "4 options with one correct answer" },
    { value: "true_false", label: "True / False", description: "Questions with True or False answers" },
    { value: "short_answer", label: "Short Answer", description: "Questions requiring a short written answer" }
  ];

  // Get Quizzes
  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${api}/quiz/document/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data.data || []);
    } catch (error) {
      console.error("Fetch Quizzes Error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchQuizzes();
    }
  }, [documentId]);

  // Generate Quiz Handler
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();

    if (!documentId) {
      toast.error("Document ID is missing");
      return;
    }

    if (!numQuestions || numQuestions < 1 || numQuestions > 20) {
      toast.error("Please select between 1 and 20 questions");
      return;
    }

    try {
      setGenerating(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${api}/ai/generateQuiz`,
        {
          documentId,
          numQuestions: Number(numQuestions),
          questionType
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success("Quiz generated successfully!");
        setShowGenerateModal(false);
        setNumQuestions(5);
        setQuestionType("mixed");
        await fetchQuizzes();
      } else {
        toast.error(response.data.message || "Failed to generate quiz");
      }
    } catch (error) {
      console.error("Generate Quiz Error:", error);
      toast.error(error.response?.data?.message || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${api}/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Quiz deleted successfully");
        setQuizzes((prev) => prev.filter((quiz) => quiz._id !== quizId));
      }
    } catch (error) {
      console.error("Delete Quiz Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete quiz");
    }
  };

  const handleTakeQuiz = (quizId) => {
    navigate(`/documents/${documentId}/quiz/${quizId}`);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Brain size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Quizzes</h2>
              <p className="text-sm text-slate-500 mt-1">
                Test your knowledge from <span className="font-medium text-slate-700">{documentData?.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-medium hover:bg-[#159f64] transition"
          >
            <Plus size={17} /> Generate Quiz
          </button>
        </div>
      </div>

      {/* Empty State */}
      {quizzes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center">
            <FileQuestion size={30} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mt-5">No quizzes yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Generate an AI-powered quiz from this document and test your understanding.
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-medium hover:bg-[#159f64] transition"
          >
            <Brain size={17} /> Generate Your First Quiz
          </button>
        </div>
      ) : (
        /* Quiz List */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Brain size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">Created on {formatDate(quiz.createdAt)}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteQuiz(quiz._id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                  title="Delete Quiz"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              {/* Quiz Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ListChecks size={15} />
                    <span className="text-xs">Questions</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{quiz.totalQuestions || quiz.questions?.length || 0}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <BarChart3 size={15} />
                    <span className="text-xs">Score</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800 mt-1">
                    {quiz.completedAt ? `${quiz.score}%` : "Not Attempted"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={15} />
                    <span className="text-xs">Status</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {quiz.completedAt ? <span className="text-green-600">Completed</span> : <span className="text-orange-500">Not Attempted</span>}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => handleTakeQuiz(quiz._id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-medium hover:bg-[#159f64] transition"
                >
                  {quiz.completedAt ? (
                    <><CheckCircle2 size={17} /> View Result</>
                  ) : (
                    <><Play size={17} /> Take Quiz</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Quiz Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !generating && setShowGenerateModal(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Generate AI Quiz</h3>
                <p className="text-xs text-slate-500 mt-1">Create questions from your document</p>
              </div>
              <button
                disabled={generating}
                onClick={() => setShowGenerateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleGenerateQuiz} className="p-5">
              {/* Number of Questions */}
              <div>
                <label className="text-sm font-semibold text-slate-800">Number of Questions</label>
                <p className="text-xs text-slate-500 mt-1">Choose how many questions AI should generate.</p>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[5, 10, 15, 20].map((number) => (
                    <button
                      type="button"
                      key={number}
                      onClick={() => setNumQuestions(number)}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition ${numQuestions === number
                          ? "border-[#19b673] bg-emerald-50 text-[#19b673]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Type Selection (Radio / Select style) */}
              <div className="mt-6">
                <label className="text-sm font-semibold text-slate-800">Question Style</label>
                <p className="text-xs text-slate-500 mt-1 mb-3">Select the format of questions you want.</p>

                <div className="space-y-2.5">
                  {questionTypeOptions.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${questionType === type.value
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="questionType"
                        value={type.value}
                        checked={questionType === type.value}
                        onChange={() => setQuestionType(type.value)}
                        className="mt-1 accent-emerald-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{type.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-medium hover:bg-[#159f64] transition disabled:opacity-60"
                >
                  {generating ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
                  ) : (
                    <><Brain size={17} /> Generate Quiz</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizManager;