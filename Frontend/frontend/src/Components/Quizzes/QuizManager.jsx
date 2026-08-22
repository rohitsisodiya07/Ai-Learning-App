import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  X,
  ClipboardList,
  Sparkles,
  Loader2,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../Api";
import Spinner from "../Common/Spinner";
import QuizCard from "./QuizCard";

const QuizManager = ({ documentId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch Quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/quiz/document/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Quizzes:", response.data);
      setQuizzes(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Fetch quizzes error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch quizzes");
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchQuizzes();
    }
  }, [documentId]);

  // Generate Quiz
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const response = await axios.post(
        `${api}/ai/generateQuiz`,
        { documentId, numQuestions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Generated Quiz:", response.data);
      toast.success("Quiz generated successfully!");
      setIsGenerateModalOpen(false);
      await fetchQuizzes();
    } catch (error) {
      console.error("Generate quiz error:", error);
      toast.error(error.response?.data?.message || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  // Delete Requests
  const handleDeleteRequest = (quiz) => {
    setSelectedQuiz(quiz);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteQuiz = async () => {
    if (!selectedQuiz?._id) return;
    try {
      setDeleting(true);
      await axios.delete(`${api}/quiz/${selectedQuiz._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Quiz deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedQuiz(null);
      setQuizzes((prev) => prev.filter((quiz) => quiz._id !== selectedQuiz._id));
    } catch (error) {
      console.error("Delete quiz error:", error);
      toast.error(error.response?.data?.message || "Failed to delete quiz");
    } finally {
      setDeleting(false);
    }
  };

  // Modal Handlers
  const closeGenerateModal = () => {
    if (!generating) setIsGenerateModalOpen(false);
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setIsDeleteModalOpen(false);
      setSelectedQuiz(null);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">Quizzes</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  <HelpCircle size={13} /> {quizzes.length}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Test your knowledge and improve your understanding.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98] shrink-0"
          >
            <Plus size={18} strokeWidth={2.5} /> Generate Quiz
          </button>
        </div>
      </div>

      {/* QUIZ LIST */}
      {quizzes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
            <ClipboardList size={30} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-5">No quizzes yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Create an AI-powered quiz from this document and test how well you understand the content.
          </p>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition"
          >
            <Sparkles size={16} /> Generate Your First Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Your Quizzes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Choose a quiz to start testing yourself.</p>
            </div>
            <span className="hidden sm:block text-xs text-slate-400">
              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz._id} quiz={quiz} onDelete={handleDeleteRequest} />
            ))}
          </div>
        </div>
      )}

      {/* GENERATE QUIZ MODAL */}
      {isGenerateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeGenerateModal}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Sparkles size={21} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Generate Quiz</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Create a quiz using AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeGenerateModal}
                disabled={generating}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleGenerateQuiz} className="p-6">
              <div>
                <label className="text-sm font-semibold text-slate-800">Number of Questions</label>
                <p className="text-xs text-slate-500 mt-1 mb-4">Choose how many questions you want in your quiz.</p>

                <div className="grid grid-cols-2 gap-3">
                  {[5, 10, 15, 20].map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setNumQuestions(number)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${numQuestions === number
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-lg font-bold ${numQuestions === number ? "text-emerald-600" : "text-slate-800"}`}>
                            {number}
                          </p>
                          <p className="text-xs text-slate-500">Questions</p>
                        </div>
                        {numQuestions === number && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <Sparkles size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs leading-5 text-slate-500">
                  AI will generate <span className="font-semibold text-slate-700">{numQuestions} questions</span> based on the content of this document.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeGenerateModal}
                  disabled={generating}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <><Loader2 size={17} className="animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles size={17} /> Generate</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-5">Delete Quiz?</h2>
              <p className="text-sm text-slate-500 mt-2 leading-6">
                Are you sure you want to delete this quiz? This action cannot be undone.
              </p>

              {selectedQuiz && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-400">Selected quiz</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1 line-clamp-2">
                    {selectedQuiz.title || selectedQuiz.name || "Quiz"}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteQuiz}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60"
                >
                  {deleting ? (
                    <><Loader2 size={16} className="animate-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 size={16} /> Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;