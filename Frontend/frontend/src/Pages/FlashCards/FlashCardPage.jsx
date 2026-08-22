import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  RotateCcw
} from "lucide-react";
import toast from "react-hot-toast";

import FlashCard from "../../Components/FlashCards/FlashCard";
import api from "../../Api";

const FlashCardPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  console.log("DOCUMENT ID:", documentId);

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const token = localStorage.getItem("token");

  // =====================================================
  // FETCH FLASHCARDS
  // =====================================================

  const fetchFlashcards = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${api}/flashcard/document/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("Flashcards API Response:", response.data);

      // Backend response:
      //
      // {
      //   success: true,
      //   count: 1,
      //   data: [
      //      {
      //        _id: "...",
      //        documentId: "...",
      //        cards: [...]
      //      }
      //   ]
      // }

      const sets = response.data?.data;

      if (!Array.isArray(sets)) {
        setFlashcards([]);
        return;
      }

      // =================================================
      // MERGE ALL FLASHCARD SETS
      // =================================================

      const allCards = sets.flatMap((set) => {
        if (Array.isArray(set?.cards)) {
          return set.cards;
        }

        return [];
      });

      console.log("All Flashcards:", allCards);
      console.log("Total Cards:", allCards.length);

      setFlashcards(allCards);
      setCurrentIndex(0);

    } catch (error) {
      console.error("Fetch Flashcards Error:", error);

      setFlashcards([]);

      toast.error(
        error.response?.data?.message ||
        "Failed to fetch flashcards"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    if (documentId) {
      fetchFlashcards();
    }
  }, [documentId]);

  // =====================================================
  // CURRENT CARD
  // =====================================================

  const currentCard = flashcards[currentIndex];

  // =====================================================
  // REVIEW FLASHCARD
  // =====================================================

  const handleReview = async (cardId) => {
    if (!cardId || reviewing) {
      return;
    }

    try {
      setReviewing(true);

      const response = await axios.patch(
        `${api}/flashcard/${cardId}/review`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("Review Response:", response.data);

      // Update local card
      setFlashcards((prev) =>
        prev.map((card) =>
          card._id === cardId
            ? {
              ...card,
              lastReviewed:
                response.data?.data?.lastReviewed ||
                new Date().toISOString(),

              reviewCount:
                response.data?.data?.reviewCount ??
                ((card.reviewCount || 0) + 1)
            }
            : card
        )
      );

    } catch (error) {
      console.error("Review Error:", error);

      toast.error(
        error.response?.data?.message ||
        "Failed to save review"
      );
    } finally {
      setReviewing(false);
    }
  };

  // =====================================================
  // TOGGLE STAR
  // =====================================================

  const handleToggleStar = async (cardId) => {
    if (!cardId) {
      return;
    }

    try {
      const response = await axios.patch(
        `${api}/flashcard/${cardId}/star`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("Star Response:", response.data);

      const updatedCard = response.data?.data;

      if (!updatedCard) {
        return;
      }

      setFlashcards((prev) =>
        prev.map((card) =>
          card._id === cardId
            ? {
              ...card,
              isStarred: updatedCard.isStarred
            }
            : card
        )
      );

    } catch (error) {
      console.error("Star Error:", error);

      toast.error(
        error.response?.data?.message ||
        "Failed to update favorite"
      );
    }
  };

  // =====================================================
  // NEXT CARD
  // =====================================================

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // =====================================================
  // PREVIOUS CARD
  // =====================================================

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // =====================================================
  // STUDIED COUNT
  // =====================================================

  const studiedCount = flashcards.filter(
    (card) =>
      card.lastReviewed ||
      Number(card.reviewCount) > 0
  ).length;

  // =====================================================
  // PROGRESS
  // =====================================================

  const progress =
    flashcards.length > 0
      ? Math.round(
        (studiedCount / flashcards.length) * 100
      )
      : 0;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#19b673] rounded-full animate-spin mx-auto" />

          <p className="text-sm text-gray-500 mt-3">
            Loading flashcards...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // NO FLASHCARDS
  // =====================================================

  if (!flashcards.length) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">

            <RotateCcw
              size={28}
              className="text-gray-400"
            />

          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-4">
            No Flashcards Found
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            No flashcards are available for this document.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-5 px-5 py-2.5 bg-[#19b673] text-white rounded-xl text-sm font-medium hover:bg-[#149b61]"
          >
            Go Back
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={17} />

          Back
        </button>

        <div className="text-sm text-gray-500">

          Card{" "}

          <span className="font-semibold text-gray-900">
            {currentIndex + 1}
          </span>

          {" "}of{" "}

          <span className="font-semibold text-gray-900">
            {flashcards.length}
          </span>

        </div>

      </div>

      {/* =================================================
          PROGRESS
      ================================================= */}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">

        <div className="flex items-center justify-between mb-2">

          <div className="flex items-center gap-2">

            <CheckCircle
              size={17}
              className="text-[#19b673]"
            />

            <span className="text-sm font-medium text-gray-700">
              Study Progress
            </span>

          </div>

          <span className="text-sm font-semibold text-[#19b673]">
            {studiedCount}/{flashcards.length}
          </span>

        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">

          <div
            className="h-full bg-[#19b673] rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`
            }}
          />

        </div>

        <p className="text-xs text-gray-400 mt-2">
          {progress}% completed
        </p>

      </div>

      {/* =================================================
          FLASHCARD
      ================================================= */}

      {currentCard && (
        <FlashCard
          key={currentCard._id}
          flashcard={currentCard}
          onToggleStar={handleToggleStar}
          onReview={handleReview}
        />
      )}

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div className="flex items-center justify-between">

        {/* PREVIOUS */}

        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >

          <ArrowLeft size={17} />

          Previous

        </button>

        {/* STATUS */}

        <span className="text-sm text-gray-400">

          {reviewing
            ? "Saving progress..."
            : "Click the card to reveal answer"}

        </span>

        {/* NEXT */}

        <button
          onClick={handleNext}
          disabled={
            currentIndex === flashcards.length - 1
          }
          className="flex items-center gap-2 px-5 py-2.5 bg-[#19b673] text-white rounded-xl text-sm font-medium hover:bg-[#149b61] disabled:opacity-40 disabled:cursor-not-allowed"
        >

          Next

          <ArrowRight size={17} />

        </button>

      </div>

    </div>
  );
};

export default FlashCardPage;