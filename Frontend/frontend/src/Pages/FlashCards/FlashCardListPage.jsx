import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  BookOpen,
  Trash2,
  Sparkles,
  Clock,
  Play,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Layers3,
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../Api";
import useSearch from "../../Components/Common/useSearch";

// ==========================================
// Time Ago
// ==========================================
const timeAgo = (date) => {
  if (!date) return "Recently";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

// ==========================================
// FlashCard List Page
// ==========================================
const FlashCardListPage = () => {
  const navigate = useNavigate();

  // ==========================================
  // States for Pagination & Sorting
  // ==========================================
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  // ==========================================
  // Other States
  // ==========================================
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("token");

  // ==========================================
  // Fetch via useSearch
  // ==========================================
  const {
    data: searchData,
    loading: searchLoading,
    refetch
  } = useSearch(
    `${api}/flashcard`,
    "", // No search string passed as requested
    { sortBy, sortOrder, page, limit },
    500
  );

  const pagination = searchData?.pagination || { total: 0, page: 1, limit: 6, totalPages: 1 };
  const totalPages = pagination.totalPages;

  // ==========================================
  // Update Data when searchData changes
  // ==========================================
  useEffect(() => {
    if (!searchData) return;
    const data = searchData?.data || [];
    setFlashcardSets(Array.isArray(data) ? data : []);
  }, [searchData]);

  // ==========================================
  // Reset Page on Sort/Limit change
  // ==========================================
  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder, limit]);

  // ==========================================
  // Get Document ID
  // ==========================================
  const getDocumentId = (flashcardSet) => {
    return (
      flashcardSet?.documentId?._id ||
      flashcardSet?.documentId ||
      flashcardSet?.document?._id ||
      flashcardSet?.document ||
      null
    );
  };

  // ==========================================
  // Calculate Set Progress
  // ==========================================
  const getProgressData = (flashcardSet) => {
    const cards = Array.isArray(flashcardSet?.cards) ? flashcardSet.cards : [];
    const total = cards.length;
    const reviewed = cards.filter(
      (card) => card?.lastReviewed || Number(card?.reviewCount) > 0
    ).length;
    const remaining = Math.max(total - reviewed, 0);
    const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return { total, reviewed, remaining, percentage };
  };

  // ==========================================
  // Study Now
  // ==========================================
  const handleStudyNow = (flashcardSet) => {
    const documentId = getDocumentId(flashcardSet);
    if (!documentId) {
      toast.error("Document ID not found");
      return;
    }
    navigate(`/documents/${documentId}/flashcards`);
  };

  // ==========================================
  // Delete
  // ==========================================
  const handleDelete = async (flashcardSet) => {
    const documentId = getDocumentId(flashcardSet);

    if (!documentId) {
      toast.error("Document ID not found");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this flashcard set?");
    if (!confirmDelete) return;

    try {
      setDeletingId(documentId);
      await axios.delete(`${api}/flashcard/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Flashcard set deleted successfully");

      // Handle Pagination shift if last item deleted
      if (flashcardSets.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        refetch();
      }
    } catch (error) {
      console.log("Delete Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete flashcard set");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // Overall Stats
  // ==========================================
  const overallStats = useMemo(() => {
    let totalCards = 0;
    let reviewedCards = 0;

    flashcardSets.forEach((flashcardSet) => {
      const progress = getProgressData(flashcardSet);
      totalCards += progress.total;
      reviewedCards += progress.reviewed;
    });

    const percentage = totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 0;

    return {
      sets: searchData?.pagination?.total || flashcardSets.length, // Total sets from backend if available
      totalCards,
      reviewedCards,
      percentage,
    };
  }, [flashcardSets, searchData]);

  // ==========================================
  // Loading State
  // ==========================================
  if (searchLoading && flashcardSets.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#19b673]/10 flex items-center justify-center mx-auto">
            <Loader2 size={25} className="text-[#19b673] animate-spin" />
          </div>
          <p className="text-sm text-slate-500 mt-4 font-medium">Loading your flashcards...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Empty State
  // ==========================================
  if (flashcardSets.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-[28px] p-10 text-center max-w-md shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#19b673]/15 to-teal-50 flex items-center justify-center mx-auto">
            <BookOpen size={34} className="text-[#19b673]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-6">No Flashcards Yet</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Generate flashcards from one of your documents and start learning.
          </p>
          <button
            onClick={() => navigate("/documents")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 bg-[#19b673] hover:bg-[#16a567] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#19b673]/20 transition active:scale-95"
          >
            <BookOpen size={18} /> Go to Documents <ArrowRight size={17} />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main UI
  // ==========================================
  return (
    <div className="min-h-full pb-10">

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#19b673]/10 flex items-center justify-center">
                <Sparkles size={17} className="text-[#19b673]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#19b673]">
                Learning Center
              </span>
            </div>
            <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight">
              My Flashcards
            </h1>
            <p className="text-[15px] font-medium text-slate-500 mt-1.5">
              Review, practice and strengthen your knowledge
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Flashcard Sets</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{overallStats.sets}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <Layers3 size={21} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Cards</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{overallStats.totalCards}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen size={21} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Reviewed</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{overallStats.reviewedCards}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={21} className="text-[#19b673]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Overall Progress</p>
              <p className="text-2xl font-extrabold text-[#19b673] mt-2">{overallStats.percentage}%</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#19b673]/10 flex items-center justify-center">
              <TrendingUp size={21} className="text-[#19b673]" />
            </div>
          </div>
        </div>
      </div>

      {/* SORT & PAGINATION CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All Flashcard Sets</h2>
          <p className="text-sm text-slate-500 mt-0.5">Continue where you left off</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* SORT */}
          <div className="relative flex-1 sm:flex-none">
            <ArrowUpDown size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("_");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="appearance-none w-full sm:w-44 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#19b673] focus:ring-2 focus:ring-[#19b673]/10 cursor-pointer"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
            </select>
          </div>

          {/* LIMIT */}
          <div className="flex-1 sm:flex-none">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="appearance-none w-full sm:w-28 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#19b673] focus:ring-2 focus:ring-[#19b673]/10 cursor-pointer"
            >
              <option value={6}>6 / page</option>
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* FLASHCARD SETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {flashcardSets.map((flashcardSet, index) => {
          const documentId = getDocumentId(flashcardSet);
          const documentTitle =
            flashcardSet?.documentId?.title ||
            flashcardSet?.document?.title ||
            flashcardSet?.documentName ||
            flashcardSet?.title ||
            `Flashcard Set ${index + 1 + (page - 1) * limit}`;

          const progress = getProgressData(flashcardSet);

          return (
            <div
              key={flashcardSet?._id || documentId || index}
              className="group bg-white border border-slate-200 rounded-[26px] p-6 shadow-sm hover:border-[#19b673]/30 hover:shadow-[0_14px_35px_rgba(25,182,115,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* CARD TOP */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#19b673] to-teal-400 flex items-center justify-center shadow-lg shadow-[#19b673]/20">
                    <BookOpen size={23} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Flashcard Set
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {timeAgo(flashcardSet.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(flashcardSet)}
                  disabled={deletingId === documentId}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition disabled:opacity-50"
                >
                  {deletingId === documentId ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                </button>
              </div>

              {/* TITLE */}
              <div className="mt-5">
                <h3 className="text-[18px] font-extrabold text-slate-900 line-clamp-2 leading-snug" title={documentTitle}>
                  {documentTitle}
                </h3>
                <p className="text-[13px] text-slate-500 mt-1.5">
                  Master important concepts from this document.
                </p>
              </div>

              {/* BADGES */}
              <div className="flex items-center gap-2.5 mt-5">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <BookOpen size={14} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">{progress.total} Cards</span>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${progress.percentage === 100 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-[#19b673]/5 border-[#19b673]/15 text-[#19b673]"}`}>
                  <TrendingUp size={14} />
                  <span className="text-xs font-bold">{progress.percentage}%</span>
                </div>
              </div>

              {/* PROGRESS */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Progress</span>
                  <span className="text-xs font-bold text-slate-700">{progress.reviewed}/{progress.total} reviewed</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#19b673] to-teal-400 rounded-full transition-all duration-700"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400">{progress.remaining} remaining</span>
                  {progress.percentage === 100 ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#19b673]">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Keep going</span>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full mt-5 mb-4" />

              {/* STUDY BUTTON */}
              <button
                onClick={() => handleStudyNow(flashcardSet)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#e9fff6] to-[#d9fff3] hover:from-[#19b673] hover:to-teal-500 text-[#087a4e] hover:text-white rounded-2xl text-sm font-bold border border-[#19b673]/10 hover:border-transparent transition-all duration-300 group/study"
              >
                <Sparkles size={17} className="group-hover/study:rotate-12 transition-transform" />
                {progress.percentage === 100 ? "Review Again" : progress.reviewed > 0 ? "Continue Studying" : "Study Now"}
                <ArrowRight size={16} className="group-hover/study:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* BOTTOM PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#19b673] text-white text-sm font-semibold hover:bg-[#159f64] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FlashCardListPage;