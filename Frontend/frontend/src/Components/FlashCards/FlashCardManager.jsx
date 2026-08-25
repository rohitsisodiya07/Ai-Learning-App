import React, { useEffect, useState } from "react";
import {
    Plus,
    Brain,
    Trash2,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Play,
    Loader2,
    Layers,
    Sparkles,
    CheckCircle,
    Search,
    ArrowUpDown,
    X
} from "lucide-react";

import toast from "react-hot-toast";
import axios from "axios";

import api from "../../Api";
import FlashCard from "./FlashCard";
import Modal from "../Actions/Modal";
import useSearch from "../../Components/Common/useSearch";

const FlashCardManager = ({ documentId }) => {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(6);

    const [flashcardSets, setFlashcardSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    const [generating, setGenerating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [setToDelete, setSetToDelete] = useState(null);

    const token = localStorage.getItem("token");

    const {
        data: searchData,
        loading: searchLoading,
        refetch
    } = useSearch(
        documentId ? `${api}/flashcard/document/${documentId}` : null,
        search,
        { sortBy, sortOrder, page, limit },
        500
    );

    const pagination = searchData?.pagination || { total: 0, page: 1, limit: 6, totalPages: 1 };
    const totalPages = pagination.totalPages;
    const totalItems = pagination.total;

    useEffect(() => {
        if (!searchData) return;
        const data = searchData?.data || searchData?.flashcards || [];
        setFlashcardSets(Array.isArray(data) ? data : []);
    }, [searchData]);

    useEffect(() => {
        setPage(1);
    }, [search, sortBy, sortOrder, limit]);

    const handleGenerateFlashcards = async () => {
        try {
            setGenerating(true);
            await axios.post(
                `${api}/ai/generate`,
                { documentId, count: 10 },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Flashcards generated successfully!");
            setPage(1);
            refetch();
        } catch (error) {
            console.log("Generate Flashcards Error:", error);
            toast.error(error.response?.data?.message || "Failed to generate flashcards");
        } finally {
            setGenerating(false);
        }
    };

    const handleSelectSet = (set) => {
        setSelectedSet(set);
        setCurrentCardIndex(0);
    };

    const handleBack = () => {
        setSelectedSet(null);
        setCurrentCardIndex(0);
    };

    const handleNextCard = () => {
        if (!selectedSet) return;
        const totalCardsInSet = selectedSet.cards?.length || 0;
        if (currentCardIndex < totalCardsInSet - 1) {
            setCurrentCardIndex((prev) => prev + 1);
        }
    };

    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex((prev) => prev - 1);
        }
    };

    const handleToggleStar = async (cardId) => {
        try {
            const response = await axios.patch(
                `${api}/flashcard/${cardId}/star`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedCard = response.data?.data;
            const updatedSets = flashcardSets.map((set) => {
                if (set._id === selectedSet?._id) {
                    const updatedCards = set.cards.map((card) => {
                        if (card._id === cardId) {
                            return {
                                ...card,
                                isStarred: updatedCard?.isStarred ?? !card.isStarred
                            };
                        }
                        return card;
                    });
                    return { ...set, cards: updatedCards };
                }
                return set;
            });

            setFlashcardSets(updatedSets);
            const updatedSelectedSet = updatedSets.find((set) => set._id === selectedSet?._id);
            setSelectedSet(updatedSelectedSet);
        } catch (error) {
            console.log("Star Error:", error);
            toast.error(error.response?.data?.message || "Failed to update star");
        }
    };

    const handleDeleteRequest = (e, set) => {
        e.stopPropagation();
        setSetToDelete(set);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!setToDelete) return;
        try {
            setDeleting(true);
            await axios.delete(
                `${api}/flashcard/${setToDelete._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Flashcard set deleted successfully!");
            setIsDeleteModalOpen(false);
            setSetToDelete(null);

            if (flashcardSets.length === 1 && page > 1) {
                setPage((prev) => prev - 1);
            } else {
                refetch();
            }
        } catch (error) {
            console.log("Delete Error:", error);
            toast.error(error.response?.data?.message || "Failed to delete flashcard set");
        } finally {
            setDeleting(false);
        }
    };

    const handleClearSearch = () => {
        setSearch("");
        setPage(1);
    };

    if (searchLoading && flashcardSets.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">Loading Flashcards</h3>
                <p className="text-sm text-slate-500 mt-1">Preparing your study sets...</p>
            </div>
        );
    }

    if (selectedSet) {
        const currentCard = selectedSet.cards?.[currentCardIndex];
        const studyTotalCards = selectedSet.cards?.length || 0;
        const progress = studyTotalCards > 0 ? ((currentCardIndex + 1) / studyTotalCards) * 100 : 0;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
                    >
                        <ArrowLeft size={17} />
                        Back to Sets
                    </button>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                        <Brain size={14} />
                        Study Mode
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Sparkles size={17} className="text-emerald-500" />
                                <h2 className="font-semibold text-slate-900">Flashcard Practice</h2>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Test yourself and strengthen your memory.
                            </p>
                        </div>
                        <div className="text-sm font-semibold text-slate-700">
                            <span className="text-emerald-600">{currentCardIndex + 1}</span>
                            {" / "}
                            {studyTotalCards}
                        </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="max-w-3xl mx-auto w-full">
                    {currentCard && (
                        <FlashCard
                            key={currentCard._id}
                            flashcard={currentCard}
                            onToggleStar={handleToggleStar}
                        />
                    )}
                </div>

                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handlePrevCard}
                        disabled={currentCardIndex === 0}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={17} />
                        Previous
                    </button>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle size={14} className="text-emerald-500" />
                        Keep practicing
                    </div>
                    <button
                        onClick={handleNextCard}
                        disabled={currentCardIndex === studyTotalCards - 1}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                    >
                        Next
                        <ChevronRight size={17} />
                    </button>
                </div>
            </div>
        );
    }

    if (flashcardSets.length === 0 && !search) {
        return (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-10 sm:p-14 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center mx-auto">
                        <Brain size={30} className="text-emerald-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-5">
                        No Flashcards Yet
                    </h2>
                    <p className="max-w-md mx-auto text-sm text-slate-500 mt-2 leading-6">
                        Turn this document into an interactive study session with AI-generated flashcards.
                    </p>
                    <button
                        onClick={handleGenerateFlashcards}
                        disabled={generating}
                        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {generating ? (
                            <Loader2 size={17} className="animate-spin" />
                        ) : (
                            <Sparkles size={17} />
                        )}
                        {generating ? "Generating..." : "Generate Flashcards"}
                    </button>
                </div>
            </div>
        );
    }

    const totalCardsCount = searchData?.totalCards || flashcardSets.reduce((total, set) => total + (set.cards?.length || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Brain size={19} className="text-emerald-500" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Flashcards</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                        Practice and review concepts from this document.
                    </p>
                </div>

                <button
                    onClick={handleGenerateFlashcards}
                    disabled={generating}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {generating ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
                    {generating ? "Generating..." : "Generate New Set"}
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search flashcards..."
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
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
                            className="appearance-none w-full md:w-48 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
                        >
                            <option value="createdAt_desc">Newest First</option>
                            <option value="createdAt_asc">Oldest First</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                            }}
                            className="w-full md:w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
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
                            {search ? `Found ${totalItems} flashcard sets` : `${totalItems} flashcard sets`}
                        </p>
                    </div>
                )}
            </div>

            {flashcardSets.length === 0 && search ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Search size={27} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mt-4">No flashcards found</h3>
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Layers size={18} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Sets</p>
                                <p className="text-lg font-bold text-slate-900">{totalItems}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Brain size={18} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Cards</p>
                                <p className="text-lg font-bold text-slate-900">{totalCardsCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {flashcardSets.map((set, index) => {
                            const cardCount = set.cards?.length || 0;
                            return (
                                <div
                                    key={set._id || index}
                                    onClick={() => handleSelectSet(set)}
                                    className="group relative bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <button
                                        onClick={(e) => handleDeleteRequest(e, set)}
                                        className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition z-10"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                                        <Brain size={24} className="text-emerald-500" />
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900">
                                        Flashcard Set {index + 1 + (page - 1) * limit}
                                    </h3>

                                    <p className="text-xs text-slate-400 mt-1">
                                        {set.createdAt
                                            ? new Date(set.createdAt).toLocaleDateString(undefined, {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric"
                                            })
                                            : "Recently created"}
                                    </p>

                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold">
                                            <Brain size={13} />
                                            {cardCount} cards
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 opacity-0 group-hover:opacity-100 transition">
                                            <Play size={13} fill="currentColor" />
                                            Study
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-slate-500">
                                Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
                                <span className="font-semibold text-slate-800">{totalPages}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page >= totalPages}
                                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !deleting && setIsDeleteModalOpen(false)}
                title="Delete Flashcard Set?"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                        <Trash2 size={20} className="text-red-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">This action cannot be undone.</p>
                            <p className="text-sm text-red-600 mt-1">This flashcard set will be permanently removed.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleting}
                            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50"
                        >
                            {deleting && <Loader2 size={16} className="animate-spin" />}
                            {deleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FlashCardManager;