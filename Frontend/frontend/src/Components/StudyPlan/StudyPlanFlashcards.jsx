import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RotateCcw,
    Sparkles,
    Trophy,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../Api";

const StudyPlanFlashcards = () => {
    const { planId, dayNumber } = useParams();
    const navigate = useNavigate();

    const [flashcardSet, setFlashcardSet] = useState(null);
    const [plan, setPlan] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const cards = useMemo(() => {
        return flashcardSet?.cards || [];
    }, [flashcardSet]);

    const currentCard = cards[currentIndex];

    const reviewedCount = useMemo(() => {
        return cards.filter((card) => {
            const count = Number(card?.reviewCount || 0);
            return count > 0 && card?.lastReviewed != null;
        }).length;
    }, [cards]);

    const allCardsReviewed =
        cards.length > 0 &&
        reviewedCount === cards.length;

    const isLastCard =
        cards.length > 0 &&
        currentIndex === cards.length - 1;

    const getFlashcards = async () => {
        try {
            setLoading(true);
            setError("");

            if (!planId || !dayNumber) {
                throw new Error(
                    "Study plan ID or day number is missing"
                );
            }

            if (!token) {
                toast.error("Please login first");
                navigate("/");
                return;
            }

            const planResponse = await axios.get(
                `${api}/studyPlan/${planId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!planResponse.data.success) {
                throw new Error(
                    planResponse.data.message ||
                    "Failed to fetch study plan"
                );
            }

            const studyPlan = planResponse.data.data;
            setPlan(studyPlan);

            const day = studyPlan.days?.find(
                (item) =>
                    Number(item.dayNumber) ===
                    Number(dayNumber)
            );

            if (!day) {
                throw new Error("Study day not found");
            }

            const response = await axios.post(
                `${api}/studyPlan/${planId}/day/${dayNumber}/flashcards`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message ||
                    "Failed to load flashcards"
                );
            }

            const data = response.data.data;

            if (!data?._id) {
                throw new Error(
                    "Flashcard ID not received from server"
                );
            }

            if (
                !Array.isArray(data.cards) ||
                data.cards.length === 0
            ) {
                throw new Error("No flashcards available");
            }

            setFlashcardSet(data);

            const firstUnreviewedIndex =
                data.cards.findIndex(
                    (card) =>
                        Number(card.reviewCount || 0) === 0
                );

            if (firstUnreviewedIndex !== -1) {
                setCurrentIndex(firstUnreviewedIndex);
            } else {
                setCurrentIndex(0);
            }

            setShowAnswer(false);
        } catch (error) {
            console.error(
                "Get Study Plan Flashcards Error:",
                error
            );

            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to load flashcards";

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getFlashcards();
    }, [planId, dayNumber]);

    const reviewCurrentCard = async () => {
        try {
            if (!flashcardSet?._id || !currentCard?._id) {
                return;
            }

            if (
                Number(currentCard.reviewCount || 0) > 0
            ) {
                return;
            }

            setReviewing(true);

            const response = await axios.patch(
                `${api}/studyPlan/flashcards/${flashcardSet._id}/review/${currentCard._id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message ||
                    "Failed to review flashcard"
                );
            }

            const result = response.data.data;

            setFlashcardSet((previous) => {
                if (!previous) return previous;

                return {
                    ...previous,
                    cards: previous.cards.map((card) =>
                        card._id === currentCard._id
                            ? {
                                ...card,
                                reviewCount:
                                    result.reviewCount ||
                                    Number(card.reviewCount || 0) + 1,
                                lastReviewed:
                                    result.lastReviewed ||
                                    new Date(),
                            }
                            : card
                    ),
                };
            });
        } catch (error) {
            console.error(
                "Review Study Plan Flashcard Error:",
                error
            );
            toast.error(
                error.response?.data?.message ||
                "Failed to review flashcard"
            );
        } finally {
            setReviewing(false);
        }
    };

    const handleNext = async () => {
        if (!currentCard) return;

        if (
            Number(currentCard.reviewCount || 0) === 0
        ) {
            await reviewCurrentCard();
        }

        if (currentIndex < cards.length - 1) {
            setCurrentIndex((previous) => previous + 1);
            setShowAnswer(false);
            return;
        }

        toast.success("All flashcards reviewed!");
    };

    const handlePrevious = () => {
        if (currentIndex === 0) return;
        setCurrentIndex((previous) => previous - 1);
        setShowAnswer(false);
    };

    const restartView = () => {
        setCurrentIndex(0);
        setShowAnswer(false);
    };

    const goBack = () => {
        navigate(`/studyPlan/${planId}`);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={38}
                        className="animate-spin text-[#19b673]"
                    />
                    <p className="text-sm font-medium text-slate-500">
                        Preparing your flashcards...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                        <BookOpen size={25} />
                    </div>
                    <h2 className="mt-5 text-lg font-bold text-slate-900">
                        Unable to load flashcards
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            onClick={goBack}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                        <button
                            onClick={getFlashcards}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#149e63]"
                        >
                            <RotateCcw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!flashcardSet || !currentCard) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <BookOpen
                        size={45}
                        className="mx-auto text-slate-300"
                    />
                    <h2 className="mt-4 text-lg font-bold text-slate-800">
                        No flashcards found
                    </h2>
                    <button
                        onClick={goBack}
                        className="mt-5 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Back to Study Plan
                    </button>
                </div>
            </div>
        );
    }

    const cardProgress =
        ((currentIndex + 1) / cards.length) * 100;

    const difficultyStyle = {
        easy: "bg-emerald-50 text-emerald-600 border-emerald-100",
        medium: "bg-amber-50 text-amber-600 border-amber-100",
        hard: "bg-red-50 text-red-600 border-red-100",
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-5 md:px-6 md:py-7">
            <div className="mx-auto max-w-4xl">

                {/* TOP BAR */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#19b673]"
                    >
                        <ArrowLeft size={18} />
                        Study Plan
                    </button>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#19b673]">
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">
                                {reviewedCount} / {cards.length} Reviewed
                            </p>
                            <p className="text-[11px] text-slate-400">
                                {Math.round((reviewedCount / cards.length) * 100)}% completed
                            </p>
                        </div>
                    </div>
                </div>

                {/* HEADER */}
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-[#19b673]">
                                <Sparkles size={23} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Day {dayNumber}
                                </p>
                                <h1 className="mt-1 text-lg font-bold text-slate-900 md:text-xl">
                                    {plan?.days?.find(
                                        (day) =>
                                            Number(day.dayNumber) ===
                                            Number(dayNumber)
                                    )?.topic || "Study Flashcards"}
                                </h1>
                            </div>
                        </div>

                        {allCardsReviewed && (
                            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-[#19b673] border border-emerald-100">
                                <CheckCircle2 size={15} />
                                Completed
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">
                                Card {currentIndex + 1} of {cards.length}
                            </span>
                            <span className="text-xs font-bold text-[#19b673]">
                                {Math.round(cardProgress)}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-[#19b673] transition-all duration-300"
                                style={{
                                    width: `${cardProgress}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* FLASHCARD CONTAINER */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
                    <div className="flex items-center justify-between">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#19b673]">
                            Card {currentIndex + 1}
                        </span>

                        {currentCard.difficulty && (
                            <span
                                className={`rounded-full border px-3 py-1 text-[11px] font-bold capitalize ${difficultyStyle[currentCard.difficulty] ||
                                    "bg-slate-50 text-slate-500 border-slate-200"
                                    }`}
                            >
                                {currentCard.difficulty}
                            </span>
                        )}
                    </div>

                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center py-8">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Question
                        </p>
                        <h2 className="mt-4 max-w-2xl text-xl font-bold leading-8 text-slate-900 md:text-2xl">
                            {currentCard.question}
                        </h2>

                        {!showAnswer && (
                            <>
                                <p className="mt-4 text-xs font-medium text-slate-400">
                                    Take a moment to think about your answer.
                                </p>
                                <button
                                    onClick={() => setShowAnswer(true)}
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#149e63] hover:shadow-md"
                                >
                                    Show Answer
                                    <ChevronRight size={17} />
                                </button>
                            </>
                        )}

                        {showAnswer && (
                            <div className="mt-6 w-full max-w-2xl rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-left">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={17}
                                        className="text-[#19b673]"
                                    />
                                    <p className="text-xs font-bold uppercase tracking-wider text-[#168d5b]">
                                        Answer
                                    </p>
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
                                    {currentCard.answer}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* NAVIGATION CONTROLS */}
                <div className="mt-5 grid grid-cols-3 items-center gap-3">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                    >
                        <ChevronLeft size={17} />
                        <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">
                            {currentIndex + 1} / {cards.length}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Cards
                        </p>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={reviewing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#19b673] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#149e63] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                    >
                        {reviewing ? (
                            <>
                                <Loader2 size={17} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : isLastCard ? (
                            <>
                                Finish
                                <CheckCircle2 size={17} />
                            </>
                        ) : (
                            <>
                                <span>Next</span>
                                <ChevronRight size={17} />
                            </>
                        )}
                    </button>
                </div>

                {/* COMPLETED SECTION */}
                {allCardsReviewed && (
                    <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                        <div className="flex flex-col items-center px-6 py-8 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-[#19b673]">
                                <Trophy size={27} />
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-slate-900">
                                Flashcards Completed!
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                You reviewed all {cards.length} flashcards for Day {dayNumber}.
                            </p>
                            <div className="mt-5 flex flex-wrap justify-center gap-3">
                                <button
                                    onClick={restartView}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 shadow-sm"
                                >
                                    <RotateCcw size={16} />
                                    View Again
                                </button>
                                <button
                                    onClick={goBack}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#19b673] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#149e63] shadow-sm"
                                >
                                    <CheckCircle2 size={16} />
                                    Back to Study Plan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StudyPlanFlashcards;