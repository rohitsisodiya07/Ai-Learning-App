import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  BookOpen,
  ClipboardCheck,
  Trophy,
  Star,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  CircleAlert,
  RefreshCw,
  BarChart3
} from "lucide-react";

import api from "../../Api";

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // Fetch Dashboard Data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(`${api}/progress/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard");
      }

      setDashboard(result.data);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      setError(error.message || "Something went wrong while loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Safe Data Extraction
  const overview = dashboard?.overview || {};
  const progress = dashboard?.progress || {};
  const recentActivity = dashboard?.recentActivity || {};
  const documents = recentActivity.documents || [];
  const quizzes = recentActivity.quizzes || [];

  // Calculations
  const flashcardProgress = Math.min(Math.max(Number(progress.flashcardProgress) || 0, 0), 100);
  const quizCompletion = Math.min(Math.max(Number(progress.quizCompletion) || 0, 0), 100);
  const reviewedFlashcards = Number(overview.reviewedFlashcards) || 0;
  const totalFlashcards = Number(overview.totalFlashcards) || 0;
  const averageScore = Number(overview.averageScore) || 0;
  const bestScore = Number(overview.bestScore) || 0;

  // =====================================================
  // STATS (Moved to Top Level before any conditional returns)
  // =====================================================
  const stats = useMemo(() => [
    {
      title: "Documents",
      value: overview.totalDocuments || 0,
      subtitle: "Total uploaded",
      icon: FileText,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Flashcards",
      value: overview.totalFlashcards || 0,
      subtitle: `${reviewedFlashcards} reviewed`,
      icon: BookOpen,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      title: "Quizzes",
      value: overview.totalQuizzes || 0,
      subtitle: `${overview.completedQuizzes || 0} completed`,
      icon: ClipboardCheck,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "Average Score",
      value: `${averageScore}%`,
      subtitle: `Best score ${bestScore}%`,
      icon: Trophy,
      iconBg: "bg-emerald-50",
      iconColor: "text-[#19b673]"
    }
  ], [overview, reviewedFlashcards, averageScore, bestScore]);

  // =====================================================
  // CONDITIONAL RETURNS (After all Hooks)
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-11 h-11 border-4 border-gray-200 border-t-[#19b673] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <CircleAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-5">Unable to load dashboard</h2>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#19b673] text-white font-semibold hover:bg-[#159d63] transition"
          >
            <RefreshCw size={17} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Format Date Helper
  const formatDate = (date) => {
    if (!date) return "Recently";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "Recently";
    return value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Document Status Helper
  const getDocumentStatus = (status) => {
    if (status === "ready") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#159d63] bg-emerald-50 px-2.5 py-1 rounded-full">
          <CheckCircle2 size={13} /> Ready
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
          <CircleAlert size={13} /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
        <Clock3 size={13} /> Processing
      </span>
    );
  };

  // Empty Activity Component
  const EmptyActivity = ({ icon: Icon, title, description }) => (
    <div className="py-10 px-6 text-center">
      <div className="w-12 h-12 mx-auto rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
        <Icon size={23} />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-700">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );

  return (
    <div className="space-y-7 pb-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#19b673] mb-1">Welcome back 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Learning Dashboard</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Keep track of your learning progress and achievements.</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="self-start sm:self-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h2 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{stat.value}</h2>
                  <p className="text-xs text-gray-400 mt-2">{stat.subtitle}</p>
                </div>
                <div className={`w-11 h-11 shrink-0 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center group-hover:scale-105 transition`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Flashcard Progress */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BookOpen size={19} />
                </div>
                <h2 className="font-bold text-gray-900">Learning Progress</h2>
              </div>
              <p className="text-sm text-gray-500 mt-2">Your flashcard review progress</p>
            </div>
            <span className="text-2xl font-bold text-[#19b673]">{flashcardProgress}%</span>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-gray-600">Reviewed flashcards</span>
              <span className="text-gray-400">{reviewedFlashcards} / {totalFlashcards}</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#19b673] rounded-full transition-all duration-700" style={{ width: `${flashcardProgress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-7">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <BookOpen size={17} className="text-purple-500" />
                <span className="text-xs text-gray-500">Flashcard Sets</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-2">{overview.totalFlashcardSets || 0}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Star size={17} className="text-yellow-500" />
                <span className="text-xs text-gray-500">Favorites</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-2">{overview.starredFlashcards || 0}</p>
            </div>
          </div>
        </div>

        {/* Quiz Performance */}
        <div className="bg-[#19b673] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Trophy size={21} />
              </div>
              <BarChart3 size={22} className="text-white/70" />
            </div>

            <p className="text-sm text-white/75 mt-6">Quiz Performance</p>
            <h2 className="text-4xl font-bold mt-1">{averageScore}%</h2>
            <p className="text-sm text-white/75 mt-1">Average score</p>

            <div className="mt-7">
              <div className="flex items-center justify-between text-xs text-white/80 mb-2">
                <span>Completion</span>
                <span>{quizCompletion}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${quizCompletion}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/15">
              <div>
                <p className="text-xs text-white/60">Completed</p>
                <p className="text-lg font-bold mt-1">{overview.completedQuizzes || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">Best Score</p>
                <p className="text-lg font-bold mt-1">{bestScore}%</p>
              </div>
            </div>
          </div>
          <Trophy size={170} className="absolute -right-12 -bottom-12 text-white/5" />
        </div>

      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Recent Documents */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Recent Documents</h2>
              <p className="text-xs text-gray-500 mt-1">Your recently accessed documents</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>

          {documents.length === 0 ? (
            <EmptyActivity icon={FileText} title="No documents yet" description="Upload your first document to get started." />
          ) : (
            <div className="divide-y divide-gray-100">
              {documents.map((document) => (
                <div key={document._id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <FileText size={19} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{document.title || "Untitled Document"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400">{formatDate(document.lastAccessed || document.createdAt)}</span>
                      <span className="text-gray-300">•</span>
                      {getDocumentStatus(document.status)}
                    </div>
                  </div>
                  <ArrowUpRight size={17} className="text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Quizzes */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Recent Quizzes</h2>
              <p className="text-xs text-gray-500 mt-1">Your latest quiz activity</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ClipboardCheck size={18} />
            </div>
          </div>

          {quizzes.length === 0 ? (
            <EmptyActivity icon={ClipboardCheck} title="No quizzes yet" description="Generate a quiz from your documents to start." />
          ) : (
            <div className="divide-y divide-gray-100">
              {quizzes.map((quiz) => {
                const score = Number(quiz.score) || 0;
                return (
                  <div key={quiz._id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                      <Trophy size={19} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{quiz.title || "Untitled Quiz"}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400 truncate">{quiz.documentId?.title || "Document Quiz"}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{formatDate(quiz.completedAt || quiz.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#19b673]">{score}%</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Learning Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#19b673]/10 text-[#19b673] flex items-center justify-center">
            <BarChart3 size={21} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Learning Summary</h2>
            <p className="text-xs text-gray-500 mt-1">A quick overview of your learning activity</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Documents</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{overview.totalDocuments || 0}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Flashcards</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{overview.totalFlashcards || 0}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Quizzes Completed</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{overview.completedQuizzes || 0}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Favorite Cards</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{overview.starredFlashcards || 0}</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;