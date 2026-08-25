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
  ListChecks,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import api from "../../Api";
import Spinner from "../Common/Spinner";
import useSearch from "../../Components/Common/useSearch";

const QuizManager = ({ documentData, documentId }) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState("mixed");

  const questionTypeOptions = [
    { value: "mixed", label: "Mixed (All Types)", description: "A balanced mix of multiple choice, true/false, and short answers" },
    { value: "mcq", label: "Multiple Choice", description: "4 options with one correct answer" },
    { value: "true_false", label: "True / False", description: "Questions with True or False answers" },
    { value: "short_answer", label: "Short Answer", description: "Questions requiring a short written answer" }
  ];

  const token = localStorage.getItem("token");

  const {
    data: searchData,
    loading: searchLoading,
    refetch
  } = useSearch(
    documentId ? `${api}/quiz/document/${documentId}` : null,
    search,
    { sortBy, sortOrder, page, limit },
    500
  );

  const quizzes = searchData?.data || [];
  const pagination = searchData?.pagination || { total: 0, page: 1, limit: 6, totalPages: 1 };
  const totalPages = pagination.totalPages;
  const totalItems = pagination.total;
  const totalQuestions = searchData?.totalQuestions || 0;

  const completedQuizzesCount = quizzes.filter((q) => q.completedAt).length;
  
  const validScores = quizzes
    .filter((q) => q.completedAt && q.score != null)
    .map((q) => Number(q.score));
  
  const averageScore = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) 
    : 0;

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder, limit]);

  useEffect(() => {
    if (documentId) {
      refetch();
    }
  }, [documentId]);

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
        setPage(1);
        refetch();
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

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const response = await axios.delete(`${api}/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Quiz deleted successfully");
        if (quizzes.length === 1 && page > 1) {
          setPage((prev) => prev - 1);
        } else {
          refetch();
        }
      }
    } catch (error) {
      console.error("Delete Quiz Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete quiz");
    }
  };

  const handleTakeQuiz = (quizId) => {
    navigate(`/documents/${documentId}/quiz/${quizId}`);
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (searchLoading && quizzes.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">

      {/* PREMIUM HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm text-white">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI Quizzes</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Test your knowledge from <span className="font-semibold text-slate-700">{documentData?.title || "Document"}</span>
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                <span className="text-purple-600 font-semibold">{totalItems} Quizzes</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{totalQuestions} Questions</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159f64] transition shadow-sm"
          >
            <Sparkles size={17} /> Generate Quiz
          </button>
        </div>
      </div>

      {/* COMPACT SEARCH & FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#19b673] focus:ring-4 focus:ring-[#19b673]/10 transition"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative">
            <ArrowUpDown size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("_");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="appearance-none w-full md:w-48 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#19b673] focus:ring-4 focus:ring-[#19b673]/10 cursor-pointer"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="title_asc">Title A-Z</option>
            </select>
          </div>

          <div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full md:w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#19b673] focus:ring-4 focus:ring-[#19b673]/10 cursor-pointer"
            >
              <option value={6}>6 / page</option>
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
            </select>
          </div>
        </div>

        {(search || totalItems > 0) && (
          <div className="flex justify-between items-center mt-3 px-1">
            <p className="text-xs text-slate-400">
              {search ? `Found ${totalItems} quizzes` : `${totalItems} quizzes available`}
            </p>
          </div>
        )}
      </div>

      {/* EMPTY STATES */}
      {quizzes.length === 0 && !search ? (
        <div className="bg-white border border-slate-200 rounded-3xl py-16 px-5 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center">
            <FileQuestion size={30} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mt-5">No quizzes yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Generate an AI-powered quiz from this document and test your understanding.
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159f64] transition shadow-sm"
          >
            <Brain size={17} /> Generate Your First Quiz
          </button>
        </div>
      ) : quizzes.length === 0 && search ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
            <Search size={27} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-4">No quizzes found</h3>
          <p className="text-sm text-slate-500 mt-1">Try searching with a different keyword.</p>
          <button
            onClick={handleClearSearch}
            className="mt-5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          {/* 4-CARD DASHBOARD STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Layers size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Quizzes</p>
                <p className="text-lg font-bold text-slate-900">{totalItems}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ListChecks size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Questions</p>
                <p className="text-lg font-bold text-slate-900">{totalQuestions}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-lg font-bold text-slate-900">{completedQuizzesCount}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <BarChart3 size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Score</p>
                <p className="text-lg font-bold text-slate-900">{averageScore}%</p>
              </div>
            </div>
          </div>

          {/* QUIZ GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-[#19b673]/40 transition duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Brain size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{quiz.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Created on {formatDate(quiz.createdAt)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteQuiz(quiz._id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Delete Quiz"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {/* Quiz Sub-stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <ListChecks size={14} />
                      <span className="text-[11px] font-medium">Questions</span>
                    </div>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{quiz.totalQuestions || quiz.questions?.length || 0}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <BarChart3 size={14} />
                      <span className="text-[11px] font-medium">Score</span>
                    </div>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {quiz.completedAt ? `${quiz.score}%` : "---"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[11px] font-medium">Status</span>
                    </div>
                    <p className="text-xs font-bold mt-1">
                      {quiz.completedAt ? <span className="text-emerald-600">Completed</span> : <span className="text-orange-500">Pending</span>}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleTakeQuiz(quiz._id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159f64] transition shadow-sm"
                  >
                    {quiz.completedAt ? (
                      <><CheckCircle size={16} /> View Results</>
                    ) : (
                      <><Play size={16} fill="currentColor" /> Take Quiz</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* BETTER PAGINATION */}
          {totalPages > 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
                <span className="font-semibold text-slate-800">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#19b673] text-white text-sm font-medium hover:bg-[#159f64] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* POLISHED GENERATE QUIZ MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !generating && setShowGenerateModal(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-emerald-600 p-6 text-white relative">
              <button
                disabled={generating}
                onClick={() => setShowGenerateModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold w-fit mb-3 backdrop-blur-sm">
                <Sparkles size={13} /> AI Generator
              </div>
              <h3 className="text-xl font-bold">Generate AI Quiz</h3>
              <p className="text-xs text-purple-100 mt-1">Turn your document text into structured testing sets</p>
            </div>

            <form onSubmit={handleGenerateQuiz} className="p-6 space-y-6">
              
              {/* Number of Questions */}
              <div>
                <label className="text-sm font-semibold text-slate-800">Number of Questions</label>
                <p className="text-xs text-slate-500 mt-0.5">Select how many questions you want to practice.</p>
                <div className="grid grid-cols-4 gap-2.5 mt-3">
                  {[5, 10, 15, 20].map((number) => (
                    <button
                      type="button"
                      key={number}
                      onClick={() => setNumQuestions(number)}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition ${
                        numQuestions === number
                          ? "border-[#19b673] bg-emerald-50 text-[#19b673] shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Style / Type Selection */}
              <div>
                <label className="text-sm font-semibold text-slate-800">Question Style</label>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Choose the layout of your quiz questions.</p>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {questionTypeOptions.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        questionType === type.value
                          ? "border-[#19b673] bg-emerald-50/50 shadow-sm"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="questionType"
                        value={type.value}
                        checked={questionType === type.value}
                        onChange={() => setQuestionType(type.value)}
                        className="mt-1 accent-[#19b673] w-4 h-4"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{type.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[#19b673] shrink-0">
                  <Sparkles size={16} />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  Will generate <span className="font-bold text-slate-900">{numQuestions} questions</span> with <span className="font-bold text-slate-900">{questionType.toUpperCase()}</span> style.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159f64] transition disabled:opacity-60 shadow-sm"
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