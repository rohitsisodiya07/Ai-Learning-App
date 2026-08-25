import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen,
  ClipboardCheck,
  Trophy,
  Flame,
  Target,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PlayCircle,
  RefreshCw,
  CircleAlert,
  GraduationCap,
  ArrowRight,
  Layers3,
  BarChart3,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";

import api from "../../Api";
import { useMemo } from "react";

const DashboardPage = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error("Please login again.");
      }

      const response = await fetch(`${api}/progress/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard");
      }

      setDashboard(result.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError(
        err.message || "Something went wrong while loading dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleContinueStudyPlan = () => {
    if (!currentStudyPlan?._id) return;
    navigate(`/studyPlan/${currentStudyPlan._id}`);
  };

  const handleStudyPlanClick = (plan) => {
    if (!plan?._id) return;
    navigate(`/studyPlan/${plan._id}`);
  };

  const handleQuizClick = (quiz) => {
    if (!quiz?._id) return;
    if (quiz.completedAt) {
      navigate(`/quiz/${quiz._id}/results`);
    } else {
      navigate(`/quiz/${quiz._id}`);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "Not available";
    return value.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getQuizPercentage = (quiz) => {
    if (!quiz) return 0;
    const score = Number(quiz.score);
    if (Number.isNaN(score)) return 0;
    return Math.min(Math.max(score, 0), 100);
  };

  const getProgress = (value) => {
    return Math.min(Math.max(Number(value) || 0, 0), 100);
  };

  const statistics = dashboard?.statistics || {};
  const currentStudyPlan = dashboard?.currentStudyPlan || null;
  const recentQuizzes = dashboard?.recentQuizzes || [];
  const recentStudyPlans = dashboard?.recentStudyPlans || [];

  const totalQuizzes = Number(statistics.totalQuizzes) || 0;
  const completedQuizzes = Number(statistics.completedQuizzes) || 0;
  const totalFlashcards = Number(statistics.totalFlashcards) || 0;
  const totalStudyPlans = Number(statistics.totalStudyPlans) || 0;
  const activeStudyPlans = Number(statistics.activeStudyPlans) || 0;
  const completedStudyPlans = Number(statistics.completedStudyPlans) || 0;

  const quizCompletionRate = getProgress(statistics.quizCompletionRate);
  const averageQuizScore = getProgress(statistics.averageQuizScore);
  const studyPlanProgress = getProgress(statistics.studyPlanProgress);
  const currentStreak = Number(statistics.currentStreak) || 0;
  const longestStreak = Number(statistics.longestStreak) || 0;
  const totalStudyDays = Number(statistics.totalStudyDays) || 0;

  const planProgress = getProgress(currentStudyPlan?.progress);
  const today = currentStudyPlan?.today || null;
  const todayTasks = Array.isArray(today?.tasks) ? today.tasks : [];

  const bestRecentScore = useMemo(() => {
    const completed = recentQuizzes.filter((quiz) => quiz.completedAt);
    if (!completed.length) return 0;
    return Math.max(...completed.map((quiz) => getQuizPercentage(quiz)));
  }, [recentQuizzes]);

  const stats = [
    {
      title: "Total Quizzes",
      value: totalQuizzes,
      subtitle: `${completedQuizzes} completed`,
      icon: ClipboardCheck,
      bg: "bg-orange-50",
      color: "text-orange-600",
    },
    {
      title: "Flashcards",
      value: totalFlashcards,
      subtitle: "Total sets",
      icon: BookOpen,
      bg: "bg-purple-50",
      color: "text-purple-600",
    },
    {
      title: "Study Plans",
      value: totalStudyPlans,
      subtitle: `${activeStudyPlans} active`,
      icon: Target,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Average Score",
      value: `${averageQuizScore}%`,
      subtitle: "Quiz performance",
      icon: Trophy,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      title: "Current Streak",
      value: `${currentStreak} days`,
      subtitle: "Keep learning!",
      icon: Flame,
      bg: "bg-red-50",
      color: "text-red-500",
    },
    {
      title: "Study Days",
      value: totalStudyDays,
      subtitle: "Total active days",
      icon: CalendarDays,
      bg: "bg-indigo-50",
      color: "text-indigo-600",
    },
  ];

  const getQuizStatus = (completedAt) => {
    if (completedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          <CheckCircle2 size={12} />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
        <Clock3 size={12} />
        Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#19b673] animate-spin" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[500px] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <CircleAlert size={30} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-5">
            Unable to load dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-6">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159d63] transition shadow-sm"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      {/* =================================================
          HERO HEADER
      ================================================= */}
      <section className="relative overflow-hidden bg-white border border-gray-200 rounded-3xl p-6 md:p-7 shadow-sm">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-blue-50 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#19b673] text-xs font-bold">
              <Zap size={13} />
              Keep learning
            </div>

            <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold text-gray-900 mt-4">
              Welcome back 👋
            </h1>

            <p className="text-sm md:text-base text-gray-500 mt-2 max-w-xl leading-6">
              Track your learning progress, continue your study plan, and keep building your knowledge every day.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              {currentStudyPlan ? (
                <button
                  onClick={handleContinueStudyPlan}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159d63] shadow-sm hover:shadow-md transition"
                >
                  <PlayCircle size={17} />
                  Continue Learning
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/studyPlan")}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159d63] shadow-sm transition"
                >
                  <GraduationCap size={17} />
                  Create Study Plan
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              )}

              <button
                onClick={fetchDashboard}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* STREAK */}
          <div className="shrink-0">
            <div className="relative overflow-hidden min-w-[220px] bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-sm">
              <div className="absolute -right-5 -bottom-7 opacity-10">
                <Flame size={130} />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-white/75">
                      Current Streak
                    </p>
                    <h2 className="text-3xl font-bold mt-1">
                      {currentStreak}
                      <span className="text-sm font-medium ml-1">days</span>
                    </h2>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                    <Flame size={23} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/70">Longest streak</span>
                  <span className="font-bold">{longestStreak} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          OVERVIEW STATS
      ================================================= */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#19b673]/10 text-[#19b673] flex items-center justify-center">
            <BarChart3 size={19} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Overview</h2>
            <p className="text-xs text-gray-500">Your overall learning statistics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] md:text-xs font-medium text-gray-500 truncate">
                      {stat.title}
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </h2>
                    <p className="text-[10px] md:text-xs text-gray-400 mt-1.5 truncate">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================
          CURRENT STUDY PLAN
      ================================================= */}
      <section className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 md:px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900">Current Study Plan</h2>
              {currentStudyPlan?.status && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                  currentStudyPlan.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                  currentStudyPlan.status === "paused" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {currentStudyPlan.status}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Continue where you left off</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#19b673] flex items-center justify-center">
            <GraduationCap size={21} />
          </div>
        </div>

        {!currentStudyPlan ? (
          <div className="py-14 px-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center">
              <Target size={32} className="text-gray-300" />
            </div>
            <p className="mt-4 font-bold text-gray-700">No active study plan</p>
            <p className="text-sm text-gray-400 mt-1">Create a study plan to start your learning journey.</p>
            <button
              onClick={() => navigate("/studyPlan")}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159d63] transition"
            >
              Create Study Plan
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-5 md:p-7">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="min-w-0">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                  {currentStudyPlan.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm text-gray-500">
                  {currentStudyPlan.subject && (
                    <span>Subject: <strong className="text-gray-700">{currentStudyPlan.subject}</strong></span>
                  )}
                  {currentStudyPlan.level && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>Level: <strong className="text-gray-700">{currentStudyPlan.level}</strong></span>
                    </>
                  )}
                  {currentStudyPlan.duration && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{currentStudyPlan.duration} days</span>
                    </>
                  )}
                  {currentStudyPlan.dailyHours && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{currentStudyPlan.dailyHours} hrs/day</span>
                    </>
                  )}
                </div>
              </div>

              {/* CIRCULAR PROGRESS */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - planProgress / 100)}`}
                      className="text-[#19b673] transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{planProgress}%</span>
                    <span className="text-[9px] text-gray-400 font-medium">Complete</span>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <p className="text-xs text-gray-400">Plan Progress</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {currentStudyPlan.completedDays || 0} of {currentStudyPlan.totalDays || 0} days
                  </p>
                  <p className="text-xs text-gray-400 mt-1">completed</p>
                </div>
              </div>
            </div>

            {/* DESKTOP PROGRESS */}
            <div className="mt-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">Overall Progress</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentStudyPlan.completedDays || 0} of {currentStudyPlan.totalDays || 0} days completed
                  </p>
                </div>
                <span className="text-sm font-bold text-[#19b673]">{planProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#19b673] to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${planProgress}%` }}
                />
              </div>
            </div>

            {/* TODAY */}
            {today && (
              <div className="mt-6 rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#19b673] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <CalendarDays size={13} />
                          DAY {today.dayNumber}
                        </span>
                        {today.completed && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-3">
                        {today.topic || "Today's Learning"}
                      </h3>
                      {today.description && (
                        <p className="text-sm text-gray-500 mt-2 leading-6 max-w-2xl">
                          {today.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleContinueStudyPlan}
                      className={`group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 shrink-0 ${
                        today.completed ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-[#19b673] text-white hover:bg-[#159d63] hover:shadow-md"
                      }`}
                    >
                      {today.completed ? (
                        <>
                          <CheckCircle2 size={17} />
                          Review Day
                        </>
                      ) : (
                        <>
                          <PlayCircle size={17} />
                          Continue Learning
                        </>
                      )}
                      <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* TASKS */}
                  {todayTasks.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-gray-800">Today's Tasks</p>
                        <span className="text-xs text-gray-400">{todayTasks.length} tasks</span>
                      </div>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        {todayTasks.map((task, index) => (
                          <div
                            key={index}
                            className={`flex items-start gap-3 p-3.5 ${index !== todayTasks.length - 1 ? "border-b border-gray-150" : ""}`}
                          >
                            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-gray-500">{index + 1}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-5 pt-0.5">{task}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TODAY STATUS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <div className={`rounded-xl p-4 border ${today.quizCompleted ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"}`}>
                      <div className="flex items-center gap-2">
                        {today.quizCompleted ? <CheckCircle2 size={17} className="text-emerald-500" /> : <ClipboardCheck size={17} className="text-orange-500" />}
                        <span className="text-xs font-semibold text-gray-600">Quiz</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-2">{today.quizCompleted ? "Completed" : "Pending"}</p>
                    </div>

                    <div className={`rounded-xl p-4 border ${today.flashcardsCompleted ? "bg-emerald-50 border-emerald-100" : "bg-purple-50 border-purple-100"}`}>
                      <div className="flex items-center gap-2">
                        {today.flashcardsCompleted ? <CheckCircle2 size={17} className="text-emerald-500" /> : <BookOpen size={17} className="text-purple-500" />}
                        <span className="text-xs font-semibold text-gray-600">Flashcards</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-2">{today.flashcardsCompleted ? "Completed" : "Pending"}</p>
                    </div>

                    <div className={`rounded-xl p-4 border ${today.completed ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"}`}>
                      <div className="flex items-center gap-2">
                        {today.completed ? <CheckCircle2 size={17} className="text-emerald-500" /> : <PlayCircle size={17} className="text-blue-500" />}
                        <span className="text-xs font-semibold text-gray-600">Day Status</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-2">{today.completed ? "Completed" : "In Progress"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =================================================
          OVERALL PROGRESS
      ================================================= */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={19} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Overall Learning Progress</h2>
            <p className="text-xs text-gray-500">See how your learning is progressing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* STUDY PLAN */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Target size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Study Plans</p>
                  <p className="text-xs text-gray-400 mt-0.5">Overall completion</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">{studyPlanProgress}%</span>
            </div>
            <div className="mt-5 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${studyPlanProgress}%` }} />
            </div>
            <div className="flex justify-between mt-3 text-xs">
              <span className="text-gray-400">{completedStudyPlans} completed</span>
              <span className="font-semibold text-gray-600">{activeStudyPlans} active</span>
            </div>
          </div>

          {/* QUIZ */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <ClipboardCheck size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Quiz Completion</p>
                  <p className="text-xs text-gray-400 mt-0.5">Completed quizzes</p>
                </div>
              </div>
              <span className="text-xl font-bold text-orange-600">{quizCompletionRate}%</span>
            </div>
            <div className="mt-5 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${quizCompletionRate}%` }} />
            </div>
            <div className="flex justify-between mt-3 text-xs">
              <span className="text-gray-400">{completedQuizzes} completed</span>
              <span className="font-semibold text-gray-600">{totalQuizzes} total</span>
            </div>
          </div>

          {/* SCORE */}
          <div className="relative overflow-hidden bg-[#19b673] rounded-2xl p-6 text-white shadow-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <Trophy size={21} />
                </div>
                <Zap size={22} className="text-white/60" />
              </div>
              <p className="text-xs text-white/70 mt-5">Average Quiz Score</p>
              <h3 className="text-4xl font-bold mt-1">{averageQuizScore}%</h3>
              <div className="mt-5 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${averageQuizScore}%` }} />
              </div>
            </div>
            <Trophy size={145} className="absolute -right-8 -bottom-10 text-white/5" />
          </div>
        </div>
      </section>

      {/* =================================================
          RECENT ACTIVITY
      ================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        
        {/* RECENT QUIZZES */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Recent Quizzes</h2>
              <p className="text-xs text-gray-500 mt-1">Your latest quiz activity</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ClipboardCheck size={19} />
            </div>
          </div>

          {recentQuizzes.length === 0 ? (
            <div className="py-12 text-center px-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center">
                <ClipboardCheck size={28} className="text-gray-300" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-700">No quizzes yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a quiz to see your activity here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentQuizzes.map((quiz) => {
                const score = getQuizPercentage(quiz);
                return (
                  <button
                    type="button"
                    key={quiz._id}
                    onClick={() => handleQuizClick(quiz)}
                    className="w-full text-left px-5 md:px-6 py-4 flex items-center gap-3 md:gap-4 hover:bg-gray-50 transition cursor-pointer group"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-100 transition">
                      <Trophy size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">
                        {quiz.title || "Untitled Quiz"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] text-gray-400">Day {quiz.dayNumber || "-"}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">{formatDate(quiz.completedAt || quiz.createdAt)}</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        {getQuizStatus(quiz.completedAt)}
                        <div className="hidden sm:block flex-1 max-w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#19b673] rounded-full" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#19b673]">{score}%</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{quiz.totalQuestions || 0} questions</p>
                    </div>

                    <ArrowRight size={17} className="text-gray-300 shrink-0 group-hover:text-[#19b673] group-hover:translate-x-0.5 transition" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* RECENT STUDY PLANS */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900">Recent Study Plans</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {recentStudyPlans.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Continue your learning journey</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers3 size={19} />
            </div>
          </div>

          {recentStudyPlans.length === 0 ? (
            <div className="py-12 text-center px-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center">
                <Target size={28} className="text-gray-300" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-700">No study plans yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first study plan to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              {recentStudyPlans.map((plan) => {
                const progress = getProgress(plan.progress);
                return (
                  <button
                    type="button"
                    key={plan._id}
                    onClick={() => handleStudyPlanClick(plan)}
                    className="group w-full text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#19b673]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-[#19b673] flex items-center justify-center group-hover:bg-[#19b673] group-hover:text-white transition">
                          <BookOpen size={19} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{plan.title || "Untitled Plan"}</h3>
                          <p className="text-[11px] text-gray-500 mt-1 truncate">
                            {plan.subject || "Subject"} {plan.level ? `• ${plan.level}` : ""}
                          </p>
                        </div>
                      </div>

                      <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                        plan.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                        plan.status === "paused" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {plan.status || "active"}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-bold text-gray-700">{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#19b673] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-5">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 min-w-0">
                        <CalendarDays size={13} />
                        <span>{plan.duration || 0} days</span>
                        <span>•</span>
                        <span>{plan.dailyHours || 0} hrs/day</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-[#19b673] transition">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* =================================================
          PERFORMANCE SUMMARY
      ================================================= */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Award size={19} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Performance</h2>
            <p className="text-xs text-gray-500">Your learning achievements and performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Trophy size={21} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{averageQuizScore}%</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${averageQuizScore}%` }} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                <Award size={21} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Best Recent Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{bestRecentScore}%</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Your highest recent quiz score</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <Flame size={21} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Learning Streak</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentStreak} days</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">Longest streak</span>
              <span className="text-xs font-bold text-gray-700">{longestStreak} days</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 size={21} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed Work</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{completedQuizzes + completedStudyPlans}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Quizzes + completed study plans</p>
          </div>
        </div>
      </section>

      {/* =================================================
          QUICK SUMMARY
      ================================================= */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 md:p-7 text-white overflow-hidden relative">
        <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-emerald-400" />
                <h2 className="font-bold">Learning Summary</h2>
              </div>
              <p className="text-xs text-white/50 mt-1">A quick snapshot of your learning activity</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-white/50">Last Study</p>
              <p className="text-sm font-bold mt-1">{formatDate(statistics.lastStudyDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] text-white/50">Quiz Completion</p>
              <p className="text-xl font-bold mt-1">{quizCompletionRate}%</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] text-white/50">Plan Progress</p>
              <p className="text-xl font-bold mt-1">{studyPlanProgress}%</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] text-white/50">Study Days</p>
              <p className="text-xl font-bold mt-1">{totalStudyDays}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] text-white/50">Completed Plans</p>
              <p className="text-xl font-bold mt-1">{completedStudyPlans}</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default DashboardPage;