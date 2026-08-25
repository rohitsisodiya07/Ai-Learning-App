import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Upload,
  Trash2,
  FileText,
  X,
  CloudUpload,
  BookOpen,
  Sparkles,
  Clock,
  Search,
  ArrowUpDown,
  File,
  CheckCircle2,
  HardDrive,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Spinner from "../../Components/Common/Spinner";
import api from "../../Api";
import useSearch from "../../Components/Common/useSearch";

// ======================================================
// Helper Functions
// ======================================================

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 KB";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const timeAgo = (date) => {
  if (!date) return "Recently";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Recently";

  const seconds = Math.floor((new Date() - parsedDate) / 1000);
  if (seconds < 0) return "Just now";

  const year = seconds / 31536000;
  const month = seconds / 2592000;
  const day = seconds / 86400;
  const hour = seconds / 3600;
  const minute = seconds / 60;

  if (year >= 1) return `${Math.floor(year)}y ago`;
  if (month >= 1) return `${Math.floor(month)}mo ago`;
  if (day >= 1) return `${Math.floor(day)}d ago`;
  if (hour >= 1) return `${Math.floor(hour)}h ago`;
  if (minute >= 1) return `${Math.floor(minute)}m ago`;

  return "Just now";
};

const getFileExtension = (fileName = "") => {
  const extension = fileName.split(".").pop();
  return extension ? extension.toUpperCase() : "FILE";
};

// ======================================================
// Main Component
// ======================================================

const DocumentListPage = () => {
  const navigate = useNavigate();

  // ======================================================
  // Search / Sort / Pagination
  // ======================================================
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // ======================================================
  // Upload States
  // ======================================================
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  // ======================================================
  // Delete States
  // ======================================================
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ======================================================
  // API Hook
  // ======================================================
  const { data, loading, error, refetch } = useSearch(
    `${api}/document/`,
    search,
    { sortBy, page, limit },
    500
  );

  // ======================================================
  // Extract API Data safely
  // ======================================================
  const documents = Array.isArray(data?.data) ? data.data : [];

  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  const stats = data?.stats || {
    totalDocuments: 0,
    totalFlashcards: 0,
    totalQuizzes: 0,
    totalStorage: 0,
  };

  // ======================================================
  // Error handling
  // ======================================================
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // ======================================================
  // Reset Page When Search / Sort / Limit Changes
  // ======================================================
  useEffect(() => {
    setPage(1);
  }, [search, sortBy, limit]);

  // ======================================================
  // Keyboard Escape Handler for Modals
  // ======================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (!uploading) setIsUploadModalOpen(false);
        if (!deleting) setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uploading, deleting]);

  // ======================================================
  // Upload handlers
  // ======================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: File Size (Max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("File size exceeds 25MB limit.");
      return;
    }

    // Validation: File Type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, DOC, or DOCX formats are supported.");
      return;
    }

    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      return toast.error("Please select a file.");
    }
    if (!uploadTitle.trim()) {
      return toast.error("Please enter a document title.");
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());

      const response = await axios.post(`${api}/document/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        toast.success("Document uploaded successfully!");
        closeUploadModal();
        setPage(1);
        refetch();
      } else {
        toast.error(response.data?.message || "Upload failed.");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error(err.response?.data?.message || "Server error during document upload.");
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    if (uploading) return;
    setIsUploadModalOpen(false);
    setUploadFile(null);
    setUploadTitle("");
  };

  // ======================================================
  // Delete handlers
  // ======================================================
  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");

      const response = await axios.delete(`${api}/document/${selectedDoc._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        toast.success("Document deleted successfully.");
        closeDeleteModal();

        // Edge case: If last item of the current page is deleted & page > 1, go back one page
        if (documents.length === 1 && page > 1) {
          setPage((prev) => prev - 1);
        } else {
          refetch();
        }
      } else {
        toast.error(response.data?.message || "Failed to delete document.");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err.response?.data?.message || "Server error while deleting document.");
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setIsDeleteModalOpen(false);
    setSelectedDoc(null);
  };

  // ======================================================
  // Pagination navigation
  // ======================================================
  const handlePrevious = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  const handleNext = useCallback(() => {
    if (page < pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [page, pagination.totalPages]);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  // ======================================================
  // Loading State
  // ======================================================
  if (loading && !data) {
    return <Spinner />;
  }

  const isInitialEmpty = stats.totalDocuments === 0 && !search;
  const isSearchEmpty = stats.totalDocuments > 0 && documents.length === 0;

  // ======================================================
  // JSX
  // ======================================================
  return (
    <div className="min-h-full pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#19b673]/10 flex items-center justify-center">
              <FileText size={19} className="text-[#19b673]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#19b673]">
              Learning Library
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Manage your study materials and learning resources.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#19b673] hover:bg-[#149f65] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#19b673]/20 hover:shadow-xl transition-all"
        >
          <Plus size={19} strokeWidth={2.5} />
          Upload Document
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText size={19} className="text-blue-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400">TOTAL</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">
            {stats.totalDocuments}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">Documents</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <BookOpen size={19} className="text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400">GENERATED</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">
            {stats.totalFlashcards}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">Flashcards</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Sparkles size={19} className="text-[#19b673]" />
            </div>
            <span className="text-xs font-semibold text-slate-400">GENERATED</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">
            {stats.totalQuizzes}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">Quizzes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <HardDrive size={19} className="text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400">STORAGE</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">
            {formatFileSize(stats.totalStorage)}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">Total file size</p>
        </div>
      </div>

      {/* SEARCH + SORT + LIMIT BAR */}
      {!isInitialEmpty && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-7 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#19b673] focus:ring-4 focus:ring-[#19b673]/10 transition"
              />
            </div>

            <div className="relative">
              <ArrowUpDown
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full md:w-48 pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#19b673] focus:ring-4 focus:ring-[#19b673]/10 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            <div>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="w-full md:w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#19b673] focus:ring-4 focus:ring-[#19b673]/10 cursor-pointer"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-slate-400">
              Showing {documents.length} of {pagination.total} documents
            </p>
            {search && (
              <p className="text-xs text-[#19b673] font-medium">
                Search: "{search}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* CONTENT / EMPTY STATES */}
      {isInitialEmpty ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 md:p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#19b673]/10 to-teal-50 flex items-center justify-center mb-5">
            <FileText size={34} className="text-[#19b673]" strokeWidth={1.7} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Your library is empty</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Upload your first PDF or document and start creating flashcards and quizzes.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#19b673] hover:bg-[#149f65] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#19b673]/20 transition"
          >
            <Upload size={18} />
            Upload Document
          </button>
        </div>
      ) : isSearchEmpty ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
            <Search size={27} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-4">
            No documents found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Try searching with a different document name.
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          {/* DOCUMENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {documents.map((doc) => {
              const fileName =
                doc.fileName || doc.originalName || doc.name || "";
              const extension = getFileExtension(fileName);
              const flashcardCount = Number(doc.flashcardCount || 0);
              const quizCount = Number(doc.quizCount || 0);

              return (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                  className="group bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 hover:border-[#19b673]/20 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#19b673] to-teal-400 flex items-center justify-center shadow-md shadow-[#19b673]/20">
                          <FileText size={23} className="text-white" />
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                          <File size={11} />
                          {extension}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(doc);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                        title="Delete document"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Title */}
                    <div className="mt-5">
                      <h3
                        className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug"
                        title={doc.title}
                      >
                        {doc.title || "Untitled Document"}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-slate-500">
                          {doc.fileSize
                            ? formatFileSize(doc.fileSize)
                            : "Size unavailable"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-xs font-medium text-slate-500">
                          {timeAgo(doc.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                          <BookOpen size={15} className="text-purple-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-purple-700">
                            {flashcardCount}
                          </p>
                          <p className="text-[10px] font-semibold text-purple-500 truncate">
                            Flashcards
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                          <Sparkles size={15} className="text-[#19b673]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#159b62]">
                            {quizCount}
                          </p>
                          <p className="text-[10px] font-semibold text-[#19b673] truncate">
                            Quizzes
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-1.5 text-slate-400 mt-5 pt-4 border-t border-slate-100">
                      <Clock size={14} />
                      <span className="text-xs font-medium">
                        Uploaded {timeAgo(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <p className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-800">{pagination.page}</span>{" "}
                of <span className="font-semibold text-slate-800">{pagination.totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, index) => index + 1
                  )
                    .filter((pageNumber) => {
                      return (
                        pageNumber === 1 ||
                        pageNumber === pagination.totalPages ||
                        Math.abs(pageNumber - page) <= 1
                      );
                    })
                    .map((pageNumber, index, arr) => {
                      const previous = arr[index - 1];
                      const showDots = previous && pageNumber - previous > 1;

                      return (
                        <React.Fragment key={pageNumber}>
                          {showDots && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setPage(pageNumber)}
                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${
                              page === pageNumber
                                ? "bg-[#19b673] text-white shadow-md shadow-[#19b673]/20"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={handleNext}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeUploadModal}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#19b673]/10 flex items-center justify-center">
                    <Upload size={18} className="text-[#19b673]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Upload Document
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-2 ml-11">
                  Add a document to your learning library.
                </p>
              </div>
              <button
                onClick={closeUploadModal}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  DOCUMENT TITLE
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. JavaScript Notes"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#19b673] focus:ring-4 focus:ring-[#19b673]/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  DOCUMENT FILE (PDF, DOC, DOCX • MAX 25MB)
                </label>
                <label className="relative flex flex-col items-center justify-center min-h-[180px] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-[#19b673]/5 hover:border-[#19b673]/40 rounded-2xl p-6 cursor-pointer transition-all">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                  />

                  {!uploadFile ? (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-[#19b673]/10 flex items-center justify-center mb-3">
                        <CloudUpload size={28} className="text-[#19b673]" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        Choose your document
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PDF, DOC or DOCX
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                        <CheckCircle2 size={28} className="text-[#19b673]" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 max-w-full px-4 truncate">
                        {uploadFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatFileSize(uploadFile.size)}
                      </p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={uploading}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#19b673] hover:bg-[#149f65] text-white rounded-2xl text-sm font-bold transition disabled:opacity-60 shadow-sm"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={17} />
                      Upload
                    </>
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
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
              <Trash2 size={25} className="text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 text-center mt-5">
              Delete Document?
            </h2>
            <p className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800">
                "{selectedDoc?.title}"
              </span>
              ?
            </p>
            <p className="text-xs text-rose-500 text-center mt-2">
              This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-7">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-sm font-bold transition disabled:opacity-60 shadow-sm"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentListPage;