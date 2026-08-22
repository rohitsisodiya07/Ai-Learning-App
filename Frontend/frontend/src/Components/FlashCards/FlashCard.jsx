import React, { useEffect, useRef, useState } from "react";
import { Star, RotateCcw, HelpCircle, Lightbulb } from "lucide-react";

const FlashCard = ({ flashcard, onToggleStar, onReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Prevent review API from being called multiple times
  const reviewedRef = useRef(false);

  // Reset when card changes
  useEffect(() => {
    setIsFlipped(false);
    reviewedRef.current = false;
  }, [flashcard?._id]);

  // Flip card
  const handleFlip = () => {
    // Prevent accidental multiple calls during animation
    if (isFlipped) {
      setIsFlipped(false);
      return;
    }

    setIsFlipped(true);

    // Review only first time answer is revealed
    if (!reviewedRef.current && onReview && flashcard?._id) {
      reviewedRef.current = true;
      onReview(flashcard._id);
    }
  };

  // Toggle Star
  const handleStar = (e) => {
    e.stopPropagation();
    if (onToggleStar && flashcard?._id) {
      onToggleStar(flashcard._id);
    }
  };

  return (
    <div className="w-full h-[420px] sm:h-[440px]" style={{ perspective: "1200px" }}>
      <div
        onClick={handleFlip}
        className="relative w-full h-full cursor-pointer transition-transform duration-500 ease-[cubic-bezier(0.4,0.2,0.2,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 bg-white rounded-[28px] border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500" />

          {/* STAR BUTTON */}
          <button
            type="button"
            onClick={handleStar}
            aria-label={flashcard?.isStarred ? "Remove from favorites" : "Add to favorites"}
            className={`absolute top-5 right-5 z-20 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${flashcard?.isStarred
                ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-200"
                : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
              }`}
          >
            <Star
              className="w-5 h-5"
              strokeWidth={2}
              fill={flashcard?.isStarred ? "currentColor" : "none"}
            />
          </button>

          {/* CONTENT */}
          <div className="h-full flex flex-col items-center justify-center px-8 sm:px-14 py-16">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-6">
              <HelpCircle size={14} /> Question
            </div>

            <div className="max-h-[210px] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-slate-200">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 text-center leading-relaxed max-w-3xl mx-auto">
                {flashcard?.question}
              </p>
            </div>
          </div>

          {/* BOTTOM INSTRUCTION */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm px-5 py-4">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
              <span>Click anywhere to reveal the answer</span>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-[28px] overflow-hidden bg-gradient-to-br from-teal-500 via-emerald-500 to-emerald-600 shadow-[0_12px_45px_rgba(16,185,129,0.25)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          {/* DECORATIVE CIRCLES */}
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-white/5" />

          {/* STAR BUTTON */}
          <button
            type="button"
            onClick={handleStar}
            aria-label={flashcard?.isStarred ? "Remove from favorites" : "Add to favorites"}
            className={`absolute top-5 right-5 z-20 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${flashcard?.isStarred
                ? "bg-white/30 text-white shadow-lg backdrop-blur-sm"
                : "bg-white/15 text-white hover:bg-white/25"
              }`}
          >
            <Star
              className="w-5 h-5"
              strokeWidth={2}
              fill={flashcard?.isStarred ? "currentColor" : "none"}
            />
          </button>

          {/* ANSWER CONTENT */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 sm:px-14 py-16">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
              <Lightbulb size={14} /> Answer
            </div>

            <div className="max-h-[220px] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-white/30">
              <p className="text-base sm:text-lg text-white text-center leading-8 font-medium max-w-3xl mx-auto">
                {flashcard?.answer}
              </p>
            </div>
          </div>

          {/* BOTTOM INSTRUCTION */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/10 backdrop-blur-sm px-5 py-4">
            <div className="flex items-center justify-center gap-2 text-sm text-white/75">
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
              <span>Click to see the question again</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;