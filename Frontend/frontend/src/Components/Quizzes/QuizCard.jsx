import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Award,
    Clock,
    HelpCircle,
    Play,
    Trash2,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    ListChecks,
    CircleHelp,
    FileQuestion
} from "lucide-react";

const QuizCard = ({ quiz, onDelete }) => {
    const navigate = useNavigate();

    // =========================
    // Navigation
    // =========================

    const handleTakeQuiz = () => {
        navigate(`/quiz/${quiz._id}`);
    };

    const handleViewResults = () => {
        navigate(`/quiz/${quiz._id}/results`);
    };

    // =========================
    // Delete
    // =========================

    const handleDelete = (e) => {
        e.stopPropagation();

        if (onDelete) {
            onDelete(quiz);
        }
    };

    // =========================
    // Format Date
    // =========================

    const formatDate = (date) => {
        if (!date) {
            return "Recently";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Recently";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    // =========================
    // Quiz Data
    // =========================

    const questions = Array.isArray(quiz?.questions)
        ? quiz.questions
        : [];

    const questionCount = questions.length;

    const isAttempted =
        Array.isArray(quiz?.userAnswers) &&
        quiz.userAnswers.length > 0;

    const score = quiz?.score ?? 0;

    // =========================
    // Question Type Count
    // =========================

    const mcqCount = questions.filter(
        (question) => question?.type === "mcq"
    ).length;

    const trueFalseCount = questions.filter(
        (question) => question?.type === "true_false"
    ).length;

    const shortAnswerCount = questions.filter(
        (question) => question?.type === "short_answer"
    ).length;

    // =========================
    // Difficulty Count
    // =========================

    const easyCount = questions.filter(
        (question) => question?.difficulty === "easy"
    ).length;

    const mediumCount = questions.filter(
        (question) => question?.difficulty === "medium"
    ).length;

    const hardCount = questions.filter(
        (question) => question?.difficulty === "hard"
    ).length;

    // =========================
    // Difficulty Text
    // =========================

    const getDifficultyText = () => {
        if (hardCount > 0) {
            return "Mixed";
        }

        if (mediumCount > 0 && easyCount > 0) {
            return "Mixed";
        }

        if (mediumCount > 0) {
            return "Medium";
        }

        if (easyCount > 0) {
            return "Easy";
        }

        return "General";
    };

    // =========================
    // Difficulty Style
    // =========================

    const getDifficultyStyle = () => {
        const difficulty = getDifficultyText().toLowerCase();

        if (difficulty === "easy") {
            return {
                wrapper:
                    "bg-emerald-50 text-emerald-700 border-emerald-100",
                dot: "bg-emerald-500"
            };
        }

        if (difficulty === "medium") {
            return {
                wrapper:
                    "bg-amber-50 text-amber-700 border-amber-100",
                dot: "bg-amber-500"
            };
        }

        if (difficulty === "mixed") {
            return {
                wrapper:
                    "bg-blue-50 text-blue-700 border-blue-100",
                dot: "bg-blue-500"
            };
        }

        if (difficulty === "hard") {
            return {
                wrapper:
                    "bg-red-50 text-red-700 border-red-100",
                dot: "bg-red-500"
            };
        }

        return {
            wrapper:
                "bg-slate-50 text-slate-600 border-slate-200",
            dot: "bg-slate-400"
        };
    };

    const difficultyStyle = getDifficultyStyle();

    return (
        <div
            className="
                group
                relative
                bg-white
                border
                border-slate-200
                rounded-2xl
                overflow-hidden
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:border-emerald-200
                hover:shadow-xl
                hover:shadow-slate-200/50
            "
        >

            {/* =========================
                Top Accent
            ========================= */}

            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

            <div className="p-5">

                {/* =========================
                    Header
                ========================= */}

                <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3 min-w-0">

                        {/* Quiz Icon */}

                        <div
                            className="
                                w-12
                                h-12
                                rounded-2xl
                                bg-emerald-50
                                border
                                border-emerald-100
                                flex
                                items-center
                                justify-center
                                shrink-0
                                transition-transform
                                duration-300
                                group-hover:scale-105
                            "
                        >
                            <Award
                                size={23}
                                className="text-emerald-600"
                                strokeWidth={2}
                            />
                        </div>

                        {/* Title */}

                        <div className="min-w-0 pt-0.5">

                            <h3
                                className="
                                    text-base
                                    font-bold
                                    text-slate-900
                                    leading-6
                                    line-clamp-2
                                "
                                title={quiz?.title}
                            >
                                {quiz?.title || "Generated Quiz"}
                            </h3>

                            <div className="flex items-center gap-1.5 mt-1.5">

                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

                                <p className="text-xs text-slate-500">
                                    Created {formatDate(quiz?.createdAt)}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Delete */}

                    <button
                        type="button"
                        onClick={handleDelete}
                        title="Delete Quiz"
                        className="
                            w-9
                            h-9
                            flex
                            items-center
                            justify-center
                            rounded-xl
                            text-slate-400
                            hover:text-red-500
                            hover:bg-red-50
                            transition-all
                            shrink-0
                        "
                    >
                        <Trash2
                            size={17}
                            strokeWidth={2}
                        />
                    </button>

                </div>

                {/* =========================
                    Score & Status
                ========================= */}

                <div className="mt-5 flex items-center justify-between gap-3">

                    {/* Score */}

                    <div
                        className="
                            flex
                            items-center
                            gap-2.5
                            px-3.5
                            py-2
                            rounded-xl
                            bg-emerald-50
                            border
                            border-emerald-100
                        "
                    >

                        <div
                            className="
                                w-7
                                h-7
                                rounded-lg
                                bg-white
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <Award
                                size={15}
                                className="text-emerald-600"
                            />
                        </div>

                        <div>

                            <p
                                className="
                                    text-[10px]
                                    uppercase
                                    tracking-wide
                                    font-medium
                                    text-emerald-600
                                "
                            >
                                Score
                            </p>

                            <p
                                className="
                                    text-sm
                                    font-bold
                                    text-emerald-800
                                    leading-4
                                "
                            >
                                {isAttempted ? `${score}%` : "--"}
                            </p>

                        </div>

                    </div>

                    {/* Status */}

                    {isAttempted ? (

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                px-3
                                py-2
                                rounded-xl
                                bg-blue-50
                                border
                                border-blue-100
                                text-xs
                                font-semibold
                                text-blue-700
                            "
                        >
                            <CheckCircle2 size={14} />
                            Attempted
                        </span>

                    ) : (

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                px-3
                                py-2
                                rounded-xl
                                bg-slate-50
                                border
                                border-slate-200
                                text-xs
                                font-semibold
                                text-slate-600
                            "
                        >
                            <Sparkles size={13} />
                            Not Attempted
                        </span>

                    )}

                </div>

                {/* =========================
                    Quiz Stats
                ========================= */}

                <div className="grid grid-cols-2 gap-3 mt-4">

                    {/* Questions */}

                    <div
                        className="
                            flex
                            items-center
                            gap-2.5
                            px-3
                            py-3
                            bg-slate-50
                            border
                            border-slate-100
                            rounded-xl
                        "
                    >

                        <div
                            className="
                                w-8
                                h-8
                                rounded-lg
                                bg-white
                                flex
                                items-center
                                justify-center
                                shrink-0
                            "
                        >
                            <HelpCircle
                                size={16}
                                className="text-slate-500"
                            />
                        </div>

                        <div>

                            <p className="text-xs text-slate-400">
                                Questions
                            </p>

                            <p className="text-sm font-semibold text-slate-700">
                                {questionCount}
                            </p>

                        </div>

                    </div>

                    {/* Time */}

                    <div
                        className="
                            flex
                            items-center
                            gap-2.5
                            px-3
                            py-3
                            bg-slate-50
                            border
                            border-slate-100
                            rounded-xl
                        "
                    >

                        <div
                            className="
                                w-8
                                h-8
                                rounded-lg
                                bg-white
                                flex
                                items-center
                                justify-center
                                shrink-0
                            "
                        >
                            <Clock
                                size={16}
                                className="text-slate-500"
                            />
                        </div>

                        <div>

                            <p className="text-xs text-slate-400">
                                Time
                            </p>

                            <p className="text-sm font-semibold text-slate-700">
                                {quiz?.timeLimit
                                    ? `${quiz.timeLimit} min`
                                    : "No limit"}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =========================
                    Question Types
                ========================= */}

                {questionCount > 0 && (
                    <div className="mt-4">

                        <p className="text-xs font-semibold text-slate-500 mb-2">
                            Question Types
                        </p>

                        <div className="flex flex-wrap gap-2">

                            {/* MCQ */}

                            {mcqCount > 0 && (
                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-violet-50
                                        border
                                        border-violet-100
                                        text-xs
                                        font-semibold
                                        text-violet-700
                                    "
                                >
                                    <ListChecks size={13} />
                                    MCQ: {mcqCount}
                                </span>
                            )}

                            {/* True False */}

                            {trueFalseCount > 0 && (
                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-blue-50
                                        border
                                        border-blue-100
                                        text-xs
                                        font-semibold
                                        text-blue-700
                                    "
                                >
                                    <CircleHelp size={13} />
                                    True/False: {trueFalseCount}
                                </span>
                            )}

                            {/* Short Answer */}

                            {shortAnswerCount > 0 && (
                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-orange-50
                                        border
                                        border-orange-100
                                        text-xs
                                        font-semibold
                                        text-orange-700
                                    "
                                >
                                    <FileQuestion size={13} />
                                    Short: {shortAnswerCount}
                                </span>
                            )}

                        </div>

                    </div>
                )}

                {/* =========================
                    Difficulty
                ========================= */}

                {questionCount > 0 && (
                    <div className="mt-4">

                        <span
                            className={`
                                inline-flex
                                items-center
                                gap-2
                                px-3
                                py-1.5
                                rounded-lg
                                border
                                text-xs
                                font-semibold
                                ${difficultyStyle.wrapper}
                            `}
                        >

                            <span
                                className={`
                                    w-1.5
                                    h-1.5
                                    rounded-full
                                    ${difficultyStyle.dot}
                                `}
                            />

                            {getDifficultyText()}

                        </span>

                    </div>
                )}

                {/* =========================
                    Action Button
                ========================= */}

                <div className="mt-5 pt-4 border-t border-slate-100">

                    {isAttempted ? (

                        <button
                            type="button"
                            onClick={handleViewResults}
                            className="
                                w-full
                                h-11
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-emerald-500
                                hover:bg-emerald-600
                                text-white
                                text-sm
                                font-semibold
                                shadow-sm
                                hover:shadow-md
                                transition-all
                                active:scale-[0.98]
                            "
                        >
                            <BarChart3
                                size={17}
                                strokeWidth={2.3}
                            />

                            <span>
                                View Results
                            </span>

                            <ChevronRight
                                size={16}
                                className="ml-0.5"
                            />

                        </button>

                    ) : (

                        <button
                            type="button"
                            onClick={handleTakeQuiz}
                            className="
                                w-full
                                h-11
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-emerald-500
                                hover:bg-emerald-600
                                text-white
                                text-sm
                                font-semibold
                                shadow-sm
                                hover:shadow-md
                                transition-all
                                active:scale-[0.98]
                            "
                        >

                            <Play
                                size={17}
                                fill="currentColor"
                                strokeWidth={2}
                            />

                            <span>
                                Start Quiz
                            </span>

                            <ChevronRight
                                size={16}
                                className="ml-0.5"
                            />

                        </button>

                    )}

                </div>

            </div>
        </div>
    );
};

export default QuizCard;