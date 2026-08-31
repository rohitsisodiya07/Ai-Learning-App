const studyPlanModel = require("../Model/studyPlanModel");
const flashcardModel = require('../Model/flashcardModel')
const quizModel = require('../Model/quizModel')
const studyActivityModel = require('../Model/studyActivityModel');

const { calculateStudyStats, recordStudyActivity } = require('../Utilities/recordStudyActivity')
const { generateStudyPlan, generateFlashcards, generateQuiz } = require("../Utilities/geminiService");
const PDFDocument = require("pdfkit");

const createStudyPlan = async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            subject,
            level,
            duration,
            dailyHours,
            goal
        } = req.body;

        if (
            !subject ||
            !level ||
            !duration ||
            !dailyHours ||
            !goal
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const plan = await generateStudyPlan(
            subject,
            level,
            duration,
            dailyHours,
            goal
        );

        const studyPlan = await studyPlanModel.create({
            userId,
            title: plan.title,
            subject,
            level,
            duration,
            dailyHours,
            goal,
            days: plan.days,
            status: "active",
            progress: 0
        });

        return res.status(201).json({
            success: true,
            message: "Study plan generated successfully",
            data: studyPlan
        });

    } catch (error) {
        console.error("Create Study Plan Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create study plan"
        });
    }
};

const getMyStudyPlans = async (req, res) => {
    try {
        const userId = req.user._id;

        const studyPlans = await studyPlanModel
            .find({ userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: studyPlans.length,
            data: studyPlans,
        });

    } catch (error) {
        console.error("Get Study Plans Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch study plans",
        });
    }
};

const getStudyPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        const studyPlan = await studyPlanModel.findOne({
            _id: id,
            userId: req.user._id,
        });

        if (!studyPlan) {
            return res.status(404).json({
                success: false,
                message: "Study plan not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: studyPlan,
        });

    } catch (error) {
        console.error("Get Study Plan Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch study plan",
        });
    }
};

const completeStudyDay = async (req, res) => {
    try {
        const { planId, dayNumber } = req.params;

        const studyPlan = await studyPlanModel.findOne({
            _id: planId,
            userId: req.user._id,
        });

        if (!studyPlan) {
            return res.status(404).json({
                success: false,
                message: "Study plan not found",
            });
        }

        const day = studyPlan.days.find(
            (item) => item.dayNumber === Number(dayNumber)
        );

        if (!day) {
            return res.status(404).json({
                success: false,
                message: "Study day not found",
            });
        }

        day.completed = true;
        day.completedAt = new Date();

        const totalDays = studyPlan.days.length;

        const completedDays = studyPlan.days.filter(
            (item) => item.completed
        ).length;

        const progress = Math.round(
            (completedDays / totalDays) * 100
        );

        studyPlan.progress = progress;

        if (completedDays === totalDays) {
            studyPlan.status = "completed";
        }

        await studyPlan.save();

        return res.status(200).json({
            success: true,
            message: "Study day completed successfully",
            data: {
                planId: studyPlan._id,
                dayNumber: day.dayNumber,
                completed: day.completed,
                progress: studyPlan.progress,
                status: studyPlan.status,
            },
        });

    } catch (error) {
        console.error("Complete Study Day Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to complete study day",
        });
    }
};

const generateStudyPlanFlashcards = async (req, res) => {
    try {
        const { planId, dayNumber } = req.params;
        const userId = req.user._id;

        const studyPlan = await studyPlanModel.findOne({
            _id: planId,
            userId,
        });

        if (!studyPlan) {
            return res.status(404).json({
                success: false,
                message: "Study plan not found",
            });
        }

        const day = studyPlan.days.find(
            (item) => item.dayNumber === Number(dayNumber)
        );

        if (!day) {
            return res.status(404).json({
                success: false,
                message: "Study day not found",
            });
        }

        const existingFlashcards = await flashcardModel.findOne({
            userId,
            planId,
            dayNumber: Number(dayNumber),
        });

        if (existingFlashcards) {
            // 💡 Ensure all existing cards have valid review counts if undefined
            let updated = false;
            existingFlashcards.cards.forEach(card => {
                if (card.reviewCount === undefined || card.reviewCount === null) {
                    card.reviewCount = 0;
                    updated = true;
                }
            });
            if (updated) {
                await existingFlashcards.save();
            }

            return res.status(200).json({
                success: true,
                message: "Flashcards already exist",
                data: existingFlashcards,
            });
        }

        const context = `
Subject: ${studyPlan.subject}

Topic: ${day.topic}

Description:
${day.description}

Learning Tasks:
${day.tasks.join("\n")}

Generate flashcards ONLY about the educational concepts
related to the topic "${day.topic}".

Do NOT create flashcards about:
- study plan
- day number
- learning goal
- subject name
- tasks themselves

Focus on actual concepts, definitions, examples,
interview concepts, and practical understanding.
`;

        const cards = await generateFlashcards(context, 10);

        if (!cards || cards.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate flashcards",
            });
        }

        // 💡 Ensure newly generated cards explicitly start with reviewCount: 0
        const formattedCards = cards.map(card => ({
            ...card,
            reviewCount: 0,
            lastReviewed: null
        }));

        const flashcards = await flashcardModel.create({
            userId,
            documentId: null,
            planId: studyPlan._id,
            dayNumber: Number(dayNumber),
            sourceType: "study_plan",
            cards: formattedCards,
        });

        return res.status(201).json({
            success: true,
            message: "Study plan flashcards generated successfully",
            data: flashcards,
        });

    } catch (error) {
        console.error("Generate Study Plan Flashcards Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate flashcards",
        });
    }
};

const generateStudyPlanQuiz = async (req, res) => {
    try {
        const { planId, dayNumber } = req.params;
        const userId = req.user._id;

        const numericDayNumber = Number(dayNumber);

        if (!Number.isInteger(numericDayNumber) || numericDayNumber <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid day number",
            });
        }

        const studyPlan = await studyPlanModel.findOne({
            _id: planId,
            userId,
        });

        if (!studyPlan) {
            return res.status(404).json({
                success: false,
                message: "Study plan not found",
            });
        }

        const day = studyPlan.days.find(
            (item) => item.dayNumber === numericDayNumber
        );

        if (!day) {
            return res.status(404).json({
                success: false,
                message: "Study day not found",
            });
        }

        const existingQuiz = await quizModel.findOne({
            userId,
            planId,
            dayNumber: numericDayNumber,
        });

        if (existingQuiz) {
            day.quizId = existingQuiz._id;
            day.quizCompleted = !!existingQuiz.completedAt;

            await studyPlan.save();

            return res.status(200).json({
                success: true,
                message: "Quiz already exists",
                data: existingQuiz,
            });
        }

        const context = `
Subject: ${studyPlan.subject}

Topic:
${day.topic}

Description:
${day.description || ""}

Learning Tasks:
${Array.isArray(day.tasks)
                ? day.tasks.join("\n")
                : ""
            }

Generate exactly 5 educational quiz questions.

Questions must ONLY test knowledge related to the topic.

Do NOT ask questions about:
- study plan
- day number
- learning goal
- plan metadata
- number of tasks

Focus on:
- conceptual understanding
- practical knowledge
- interview concepts
- real-world examples
- problem solving

QUESTION TYPES:

1. MCQ
questionType = "mcq"
options = exactly 4 options
correctAnswer MUST exactly match one of the 4 options

2. TRUE/FALSE
questionType = "true_false"
options MUST be:
["True", "False"]

correctAnswer MUST be:
"True"
OR
"False"

3. SHORT ANSWER
questionType = "short_answer"
options MUST be:
[]

correctAnswer should contain the expected concise answer.

IMPORTANT:

- Generate a MIX of the above question types.
- Do not generate only MCQs.
- Every question must contain:
  question
  questionType
  options
  correctAnswer
  explanation
  difficulty

- MCQ must ALWAYS contain exactly 4 options.
- True/False must ALWAYS contain exactly 2 options.
- Short Answer must ALWAYS contain an empty options array.
`;

        let questions;

        try {
            questions = await generateQuiz(
                context,
                5,
                "mixed"
            );
        } catch (error) {
            console.error("AI Quiz Generation Error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to generate quiz",
            });
        }

        if (!Array.isArray(questions)) {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid quiz data",
            });
        }

        const validQuestions = [];

        for (const rawQuestion of questions) {
            if (
                !rawQuestion ||
                typeof rawQuestion !== "object"
            ) {
                continue;
            }

            const questionText =
                typeof rawQuestion.question === "string"
                    ? rawQuestion.question.trim()
                    : "";

            if (!questionText) {
                continue;
            }

            let questionType =
                rawQuestion.questionType ||
                rawQuestion.type ||
                "mcq";

            questionType = String(questionType)
                .toLowerCase()
                .trim();

            if (
                [
                    "multiple_choice",
                    "multiple-choice",
                    "multiplechoice",
                    "multiple choice",
                ].includes(questionType)
            ) {
                questionType = "mcq";
            }

            if (
                [
                    "truefalse",
                    "true-false",
                    "true/false",
                    "true false",
                ].includes(questionType)
            ) {
                questionType = "true_false";
            }

            if (
                [
                    "short-answer",
                    "shortanswer",
                    "short answer",
                ].includes(questionType)
            ) {
                questionType = "short_answer";
            }

            if (
                ![
                    "mcq",
                    "true_false",
                    "short_answer",
                ].includes(questionType)
            ) {
                continue;
            }

            let options = Array.isArray(
                rawQuestion.options
            )
                ? rawQuestion.options
                : [];

            options = options
                .filter(
                    (option) =>
                        typeof option === "string" &&
                        option.trim()
                )
                .map((option) => option.trim());

            if (questionType === "mcq") {
                if (options.length !== 4) {
                    continue;
                }

                const uniqueOptions = [
                    ...new Set(
                        options.map((option) =>
                            option.toLowerCase()
                        )
                    ),
                ];

                if (uniqueOptions.length !== 4) {
                    continue;
                }
            }

            if (questionType === "true_false") {
                options = ["True", "False"];
            }

            if (questionType === "short_answer") {
                options = [];
            }

            let correctAnswer =
                typeof rawQuestion.correctAnswer === "string"
                    ? rawQuestion.correctAnswer.trim()
                    : "";

            if (!correctAnswer) {
                continue;
            }

            if (questionType === "mcq") {
                const matchedOption = options.find(
                    (option) =>
                        option.toLowerCase() ===
                        correctAnswer.toLowerCase()
                );

                if (!matchedOption) {
                    continue;
                }

                correctAnswer = matchedOption;
            }

            if (questionType === "true_false") {
                const normalizedAnswer =
                    correctAnswer.toLowerCase();

                if (normalizedAnswer === "true") {
                    correctAnswer = "True";
                } else if (
                    normalizedAnswer === "false"
                ) {
                    correctAnswer = "False";
                } else {
                    continue;
                }
            }

            if (questionType === "short_answer") {
                options = [];
                correctAnswer = correctAnswer.trim();

                if (!correctAnswer) {
                    continue;
                }
            }

            let difficulty =
                typeof rawQuestion.difficulty === "string"
                    ? rawQuestion.difficulty
                        .toLowerCase()
                        .trim()
                    : "medium";

            if (
                !["easy", "medium", "hard"].includes(
                    difficulty
                )
            ) {
                difficulty = "medium";
            }

            const explanation =
                typeof rawQuestion.explanation === "string"
                    ? rawQuestion.explanation.trim()
                    : "";

            validQuestions.push({
                question: questionText,
                questionType,
                options,
                correctAnswer,
                explanation,
                difficulty,
            });
        }

        if (validQuestions.length !== 5) {
            return res.status(500).json({
                success: false,
                message: `AI generated only ${validQuestions.length}/5 valid questions. Please try again.`,
            });
        }

        const title =
            `${studyPlan.subject} - Day ${numericDayNumber} Quiz`;

        const quiz = await quizModel.create({
            userId,
            planId,
            dayNumber: numericDayNumber,
            sourceType: "study_plan",
            title,
            questions: validQuestions,
            userAnswers: [],
            score: 0,
            totalQuestions: validQuestions.length,
            completedAt: null,
        });

        day.quizId = quiz._id;
        day.quizCompleted = false;

        await studyPlan.save();

        return res.status(201).json({
            success: true,
            message: "Study plan quiz generated successfully",
            data: quiz,
        });

    } catch (error) {
        console.error("Generate Study Plan Quiz Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate study plan quiz",
        });
    }
};

const submitStudyPlanQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        const userId = req.user._id;

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Answers are required",
            });
        }

        const quiz = await quizModel.findOne({
            _id: quizId,
            userId,
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        if (quiz.completedAt) {
            return res.status(400).json({
                success: false,
                message: "Quiz has already been completed",
            });
        }

        const studyPlan = await studyPlanModel.findOne({
            _id: quiz.planId,
            userId,
        });

        let score = 0;
        const userAnswers = [];

        for (const answer of answers) {
            const questionIndex = Number(answer.questionIndex);
            const selectedAnswer =
                answer.selectedAnswer?.trim();

            if (
                questionIndex < 0 ||
                questionIndex >= quiz.questions.length
            ) {
                continue;
            }

            if (!selectedAnswer) {
                continue;
            }

            const question =
                quiz.questions[questionIndex];

            const isCorrect =
                selectedAnswer.toLowerCase() ===
                question.correctAnswer
                    .trim()
                    .toLowerCase();

            if (isCorrect) {
                score++;
            }

            userAnswers.push({
                questionIndex,
                selectedAnswer,
                isCorrect,
                answeredAt: new Date(),
            });
        }

        const totalQuestions =
            quiz.questions.length;

        const percentage =
            totalQuestions > 0
                ? Math.round(
                    (score / totalQuestions) * 100
                )
                : 0;

        quiz.userAnswers = userAnswers;
        quiz.score = score;
        quiz.totalQuestions = totalQuestions;
        quiz.completedAt = new Date();

        await quiz.save();

        let dayCompleted = false;
        let progress = studyPlan?.progress || 0;

        if (studyPlan) {
            const day = studyPlan.days.find(
                (item) =>
                    item.dayNumber ===
                    Number(quiz.dayNumber)
            );

            if (day) {
                day.quizId = quiz._id;
                day.quizCompleted = true;

                if (day.flashcardsCompleted) {
                    day.completed = true;
                    day.completedAt = new Date();
                    dayCompleted = true;
                }

                const completedDays =
                    studyPlan.days.filter(
                        (item) => item.completed
                    ).length;

                const totalDays =
                    studyPlan.days.length;

                progress =
                    totalDays > 0
                        ? Math.round(
                            (completedDays /
                                totalDays) *
                            100
                        )
                        : 0;

                studyPlan.progress = progress;

                if (progress === 100) {
                    studyPlan.status = "completed";
                }

                await studyPlan.save();
            }
        }

        if (quiz.sourceType === "weak_topic") {
            await recordStudyActivity(
                userId,
                "weakTopicQuiz"
            );
        } else {
            await recordStudyActivity(
                userId,
                "quiz"
            );
        }

        return res.status(200).json({
            success: true,
            message: "Quiz submitted successfully",
            data: {
                quizId: quiz._id,
                score,
                totalQuestions,
                percentage,
                userAnswers,
                completedAt:
                    quiz.completedAt,
                dayCompleted,
                progress,
            },
        });

    } catch (error) {
        console.error("Submit Study Plan Quiz Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to submit quiz",
        });
    }
};

const reviewStudyPlanFlashcard = async (req, res) => {
    try {
        const { flashcardId, cardId } = req.params;
        const userId = req.user._id;

        const flashcard = await flashcardModel.findOne({
            _id: flashcardId,
            userId,
            sourceType: "study_plan",
        });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: "Flashcard not found",
            });
        }

        const card = flashcard.cards.id(cardId);

        if (!card) {
            return res.status(404).json({
                success: false,
                message: "Flashcard card not found",
            });
        }

        // Initialize reviewCount safely
        if (typeof card.reviewCount !== "number") {
            card.reviewCount = 0;
        }

        card.reviewCount += 1;
        card.lastReviewed = new Date();

        await flashcard.save();

        const studyPlan = await studyPlanModel.findOne({
            _id: flashcard.planId,
            userId,
        });

        let flashcardsCompleted = false;
        let dayCompleted = false;
        let progress = studyPlan?.progress || 0;

        if (studyPlan) {
            const day = studyPlan.days.find(
                (item) =>
                    item.dayNumber === Number(flashcard.dayNumber)
            );

            if (day) {

                // Check whether EVERY card has been reviewed
                const totalCards = flashcard.cards.length;

                const reviewedCards = flashcard.cards.filter(
                    (item) =>
                        Number(item.reviewCount) > 0
                ).length;

                const allCardsReviewed =
                    totalCards > 0 &&
                    reviewedCards === totalCards;

                if (allCardsReviewed) {
                    day.flashcardsCompleted = true;
                } else {
                    day.flashcardsCompleted = false;
                }

                flashcardsCompleted =
                    day.flashcardsCompleted;

                // Day is completed only when BOTH are completed
                if (
                    day.quizCompleted === true &&
                    day.flashcardsCompleted === true
                ) {
                    day.completed = true;

                    if (!day.completedAt) {
                        day.completedAt = new Date();
                    }

                    dayCompleted = true;
                }

                const completedDays =
                    studyPlan.days.filter(
                        (item) => item.completed === true
                    ).length;

                const totalDays =
                    studyPlan.days.length;

                progress =
                    totalDays > 0
                        ? Math.round(
                            (completedDays / totalDays) * 100
                        )
                        : 0;

                studyPlan.progress = progress;

                if (progress === 100) {
                    studyPlan.status = "completed";
                }

                await studyPlan.save();
            }
        }

        await recordStudyActivity(
            userId,
            "flashcard"
        );

        return res.status(200).json({
            success: true,
            message: "Flashcard reviewed successfully",
            data: {
                flashcardId: flashcard._id,
                cardId: card._id,
                reviewCount: card.reviewCount,
                lastReviewed: card.lastReviewed,

                // Current card status
                cardCompleted: card.reviewCount > 0,

                // Entire flashcard set status
                flashcardsCompleted,

                dayCompleted,
                progress,
            },
        });

    } catch (error) {
        console.error(
            "Review Study Plan Flashcard Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to review flashcard",
        });
    }
};

const getStudyPlanQuizResult = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user._id;

        const quiz = await quizModel
            .findOne({
                _id: quizId,
                userId,
            })
            .lean();

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        if (!quiz.completedAt) {
            return res.status(400).json({
                success: false,
                message: "Quiz has not been completed yet",
            });
        }

        const correctAnswers = quiz.userAnswers.filter(
            (answer) => answer.isCorrect
        ).length;

        const attemptedQuestions = quiz.userAnswers.length;

        const wrongAnswers =
            quiz.totalQuestions - correctAnswers;

        const percentage =
            quiz.totalQuestions > 0
                ? Math.round(
                    (correctAnswers / quiz.totalQuestions) * 100
                )
                : 0;

        const results = quiz.questions.map(
            (question, index) => {
                const userAnswer = quiz.userAnswers.find(
                    (answer) =>
                        answer.questionIndex === index
                );

                return {
                    questionIndex: index,
                    type: question.questionType,
                    question: question.question,
                    options: question.options || [],
                    correctAnswer: question.correctAnswer,
                    selectedAnswer:
                        userAnswer?.selectedAnswer || "",
                    isCorrect:
                        userAnswer?.isCorrect || false,
                    explanation:
                        question.explanation || "",
                    difficulty:
                        question.difficulty || "medium",
                };
            }
        );

        return res.status(200).json({
            success: true,
            message: "Study plan quiz result fetched successfully",
            data: {
                quizId: quiz._id,
                title: quiz.title,
                score: percentage,
                totalQuestions: quiz.totalQuestions,
                correctAnswers,
                attemptedQuestions,
                wrongAnswers,
                completedAt: quiz.completedAt,
                planId: quiz.planId,
                dayNumber: quiz.dayNumber,
                results,
            },
        });

    } catch (error) {
        console.error("Get Study Plan Quiz Result Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch study plan quiz result",
        });
    }
};

const getQuizPercentage = (quiz) => {
    const score = Number(quiz.score) || 0;
    const totalQuestions = Number(quiz.totalQuestions) || 0;

    if (totalQuestions <= 0) {
        return 0;
    }

    if (score > totalQuestions) {
        return Math.min(Math.round(score), 100);
    }

    return Math.round((score / totalQuestions) * 100);
};

const studyDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        const studyPlans = await studyPlanModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        const quizzes = await quizModel
            .find({
                userId,
                sourceType: "study_plan",
            })
            .sort({
                createdAt: -1,
            })
            .lean();

        const flashcards = await flashcardModel
            .find({
                userId,
                sourceType: "study_plan",
            })
            .lean();

        const totalStudyPlans = studyPlans.length;

        const activeStudyPlans = studyPlans.filter(
            (plan) => plan.status === "active"
        ).length;

        const completedStudyPlans = studyPlans.filter(
            (plan) => plan.status === "completed"
        ).length;

        let studyPlanProgress = 0;

        if (totalStudyPlans > 0) {
            const totalProgress = studyPlans.reduce(
                (sum, plan) => sum + (Number(plan.progress) || 0),
                0
            );

            studyPlanProgress = Math.round(totalProgress / totalStudyPlans);
        }

        const totalQuizzes = quizzes.length;

        const completedQuizzes = quizzes.filter(
            (quiz) => quiz.completedAt
        ).length;

        const quizCompletionRate =
            totalQuizzes > 0
                ? Math.round((completedQuizzes / totalQuizzes) * 100)
                : 0;

        const completedQuizScores = quizzes
            .filter((quiz) => quiz.completedAt)
            .map((quiz) => getQuizPercentage(quiz))
            .filter((score) => Number.isFinite(score));

        const averageQuizScore =
            completedQuizScores.length > 0
                ? Math.round(
                    completedQuizScores.reduce((sum, score) => sum + score, 0) /
                    completedQuizScores.length
                )
                : 0;

        const totalFlashcards = flashcards.reduce((total, flashcardSet) => {
            return (
                total +
                (Array.isArray(flashcardSet.cards) ? flashcardSet.cards.length : 0)
            );
        }, 0);

        const activities = await studyActivityModel
            .find({ userId })
            .sort({
                activityDate: -1,
            })
            .lean();

        const {
            currentStreak,
            longestStreak,
            totalStudyDays,
            lastStudyDate,
        } = calculateStudyStats(activities);

        const currentStudyPlan =
            studyPlans.find((plan) => plan.status === "active") || null;

        let currentPlanData = null;

        if (currentStudyPlan) {
            const days = Array.isArray(currentStudyPlan.days)
                ? currentStudyPlan.days
                : [];

            const completedDays = days.filter(
                (day) => day.completed === true
            ).length;

            const completedQuizzesInPlan = days.filter(
                (day) => day.quizCompleted === true
            ).length;

            const completedFlashcardsInPlan = days.filter(
                (day) => day.flashcardsCompleted === true
            ).length;

            const today = days.find((day) => day.completed !== true) || null;

            currentPlanData = {
                _id: currentStudyPlan._id,
                title: currentStudyPlan.title,
                subject: currentStudyPlan.subject,
                level: currentStudyPlan.level,
                duration: currentStudyPlan.duration,
                dailyHours: currentStudyPlan.dailyHours,
                goal: currentStudyPlan.goal,
                status: currentStudyPlan.status,
                progress: Number(currentStudyPlan.progress) || 0,
                completedDays,
                totalDays: days.length,
                completedQuizzes: completedQuizzesInPlan,
                completedFlashcards: completedFlashcardsInPlan,
                today,
            };
        }

        const recentQuizzes = quizzes
            .slice(0, 5)
            .map((quiz) => ({
                _id: quiz._id,
                title: quiz.title,
                dayNumber: quiz.dayNumber,
                score: getQuizPercentage(quiz),
                totalQuestions: Number(quiz.totalQuestions) || 0,
                completedAt: quiz.completedAt || null,
                createdAt: quiz.createdAt,
                planId: quiz.planId,
            }));

        const recentStudyPlans = studyPlans
            .slice(0, 5)
            .map((plan) => ({
                _id: plan._id,
                title: plan.title,
                subject: plan.subject,
                level: plan.level,
                status: plan.status,
                progress: Number(plan.progress) || 0,
                duration: plan.duration,
                dailyHours: plan.dailyHours,
                createdAt: plan.createdAt,
            }));

        return res.status(200).json({
            success: true,
            message: "Study dashboard fetched successfully",
            data: {
                statistics: {
                    totalQuizzes,
                    completedQuizzes,
                    totalFlashcards,
                    totalStudyPlans,
                    activeStudyPlans,
                    completedStudyPlans,
                    quizCompletionRate,
                    averageQuizScore,
                    studyPlanProgress,
                    currentStreak,
                    longestStreak,
                    totalStudyDays,
                    lastStudyDate,
                },
                currentStudyPlan: currentPlanData,
                recentQuizzes,
                recentStudyPlans,
            },
        });
    } catch (error) {
        console.error("Study Dashboard Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch study dashboard",
        });
    }
};

const exportStudyDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // =====================================================
        // FETCH DATA
        // =====================================================

        const studyPlans = await studyPlanModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        const quizzes = await quizModel
            .find({
                userId,
                sourceType: "study_plan",
            })
            .sort({ createdAt: -1 })
            .lean();

        const flashcards = await flashcardModel
            .find({
                userId,
                sourceType: "study_plan",
            })
            .lean();

        const activities = await studyActivityModel
            .find({ userId })
            .sort({ activityDate: -1 })
            .lean();

        // =====================================================
        // BASIC STATISTICS
        // =====================================================

        const totalStudyPlans = studyPlans.length;

        const activeStudyPlans = studyPlans.filter(
            (plan) => plan.status === "active"
        ).length;

        const completedStudyPlans = studyPlans.filter(
            (plan) => plan.status === "completed"
        ).length;

        let studyPlanProgress = 0;

        if (totalStudyPlans > 0) {
            const totalProgress = studyPlans.reduce(
                (sum, plan) => sum + (Number(plan.progress) || 0),
                0
            );

            studyPlanProgress = Math.round(
                totalProgress / totalStudyPlans
            );
        }

        // =====================================================
        // QUIZ STATISTICS
        // =====================================================

        const totalQuizzes = quizzes.length;

        const completedQuizzes = quizzes.filter(
            (quiz) => quiz.completedAt
        ).length;

        const quizCompletionRate =
            totalQuizzes > 0
                ? Math.round(
                    (completedQuizzes / totalQuizzes) * 100
                )
                : 0;

        const getQuizPercentage = (quiz) => {
            const score = Number(quiz.score) || 0;

            const totalQuestions =
                Number(quiz.totalQuestions) || 0;

            if (totalQuestions <= 0) {
                return 0;
            }

            if (score > totalQuestions) {
                return Math.min(
                    Math.round(score),
                    100
                );
            }

            return Math.round(
                (score / totalQuestions) * 100
            );
        };

        const completedQuizScores = quizzes
            .filter((quiz) => quiz.completedAt)
            .map((quiz) => getQuizPercentage(quiz))
            .filter((score) => Number.isFinite(score));

        const averageQuizScore =
            completedQuizScores.length > 0
                ? Math.round(
                    completedQuizScores.reduce(
                        (sum, score) => sum + score,
                        0
                    ) / completedQuizScores.length
                )
                : 0;

        // =====================================================
        // FLASHCARD STATISTICS
        // =====================================================

        const totalFlashcards = flashcards.reduce(
            (total, flashcardSet) => {
                return (
                    total +
                    (
                        Array.isArray(flashcardSet.cards)
                            ? flashcardSet.cards.length
                            : 0
                    )
                );
            },
            0
        );

        const reviewedFlashcards = flashcards.reduce(
            (total, flashcardSet) => {
                if (
                    !Array.isArray(
                        flashcardSet.cards
                    )
                ) {
                    return total;
                }

                return (
                    total +
                    flashcardSet.cards.filter(
                        (card) =>
                            Number(card.reviewCount) > 0
                    ).length
                );
            },
            0
        );

        const flashcardCompletionRate =
            totalFlashcards > 0
                ? Math.round(
                    (reviewedFlashcards /
                        totalFlashcards) *
                    100
                )
                : 0;

        // =====================================================
        // STUDY STATS
        // =====================================================

        const {
            currentStreak,
            longestStreak,
            totalStudyDays,
            lastStudyDate,
        } = calculateStudyStats(activities);

        // =====================================================
        // CURRENT STUDY PLAN
        // =====================================================

        const currentStudyPlan =
            studyPlans.find(
                (plan) => plan.status === "active"
            ) || null;

        let currentPlanData = null;

        if (currentStudyPlan) {
            const days = Array.isArray(
                currentStudyPlan.days
            )
                ? currentStudyPlan.days
                : [];

            const completedDays = days.filter(
                (day) => day.completed === true
            ).length;

            const completedQuizzesInPlan =
                days.filter(
                    (day) =>
                        day.quizCompleted === true
                ).length;

            const completedFlashcardsInPlan =
                days.filter(
                    (day) =>
                        day.flashcardsCompleted === true
                ).length;

            const currentDay =
                days.find(
                    (day) =>
                        day.completed !== true
                ) || null;

            currentPlanData = {
                title: currentStudyPlan.title,
                subject: currentStudyPlan.subject,
                level: currentStudyPlan.level,
                goal: currentStudyPlan.goal,
                duration: currentStudyPlan.duration,
                dailyHours: currentStudyPlan.dailyHours,
                progress:
                    Number(
                        currentStudyPlan.progress
                    ) || 0,

                completedDays,

                totalDays: days.length,

                completedQuizzes:
                    completedQuizzesInPlan,

                completedFlashcards:
                    completedFlashcardsInPlan,

                currentDay,
            };
        }

        // =====================================================
        // RECENT QUIZZES
        // =====================================================

        const recentQuizzes = quizzes
            .slice(0, 10)
            .map((quiz) => ({
                title:
                    quiz.title ||
                    "Study Quiz",

                dayNumber:
                    quiz.dayNumber || "-",

                score:
                    getQuizPercentage(quiz),

                totalQuestions:
                    Number(
                        quiz.totalQuestions
                    ) || 0,

                completedAt:
                    quiz.completedAt || null,
            }));

        // =====================================================
        // PDF SETUP
        // =====================================================

        const doc = new PDFDocument({
            size: "A4",
            margin: 40,
            bufferPages: true,
        });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="study-dashboard-${Date.now()}.pdf"`
        );

        doc.pipe(res);

        // =====================================================
        // HELPER FUNCTIONS
        // =====================================================

        const addSection = (title) => {
            doc.moveDown(0.8);

            doc
                .fontSize(13)
                .font("Helvetica-Bold")
                .text(title, {
                    keepWithNext: true,
                });

            doc.moveDown(0.2);

            doc
                .moveTo(40, doc.y)
                .lineTo(555, doc.y)
                .stroke();

            doc.moveDown(0.4);
        };

        const addField = (label, value) => {
            doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(`${label}: `, {
                    continued: true,
                    keepWithNext: true,
                });

            doc
                .font("Helvetica")
                .text(
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                        ? String(value)
                        : "-"
                );

            doc.moveDown(0.15);
        };

        const formatDate = (date) => {
            if (!date) {
                return "-";
            }

            const parsedDate = new Date(date);

            if (
                Number.isNaN(
                    parsedDate.getTime()
                )
            ) {
                return String(date);
            }

            return parsedDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );
        };

        const addBullet = (text) => {
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(`• ${text}`, {
                    indent: 10,
                });

            doc.moveDown(0.1);
        };

        // =====================================================
        // HEADER
        // =====================================================

        doc
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("Study Dashboard", {
                align: "center",
            });

        doc.moveDown(0.2);

        doc
            .fontSize(9)
            .font("Helvetica")
            .text(
                `Generated on ${formatDate(new Date())}`,
                {
                    align: "center",
                }
            );

        doc.moveDown(0.8);

        // =====================================================
        // STUDY PROGRESS
        // =====================================================

        addSection("Study Progress");

        addField(
            "Total Study Plans",
            totalStudyPlans
        );

        addField(
            "Active Study Plans",
            activeStudyPlans
        );

        addField(
            "Completed Study Plans",
            completedStudyPlans
        );

        addField(
            "Overall Study Plan Progress",
            `${studyPlanProgress}%`
        );

        addField(
            "Total Study Days",
            totalStudyDays
        );

        addField(
            "Current Streak",
            `${currentStreak} days`
        );

        addField(
            "Longest Streak",
            `${longestStreak} days`
        );

        addField(
            "Last Study Date",
            formatDate(lastStudyDate)
        );

        // =====================================================
        // QUIZ PERFORMANCE
        // =====================================================

        addSection("Quiz Performance");

        addField(
            "Total Quizzes",
            totalQuizzes
        );

        addField(
            "Completed Quizzes",
            completedQuizzes
        );

        addField(
            "Quiz Completion Rate",
            `${quizCompletionRate}%`
        );

        addField(
            "Average Quiz Score",
            `${averageQuizScore}%`
        );

        // =====================================================
        // FLASHCARD PERFORMANCE
        // =====================================================

        addSection("Flashcard Performance");

        addField(
            "Total Flashcards",
            totalFlashcards
        );

        addField(
            "Reviewed Flashcards",
            reviewedFlashcards
        );

        addField(
            "Flashcard Completion Rate",
            `${flashcardCompletionRate}%`
        );

        // =====================================================
        // CURRENT STUDY PLAN
        // =====================================================

        addSection("Current Study Plan");

        if (currentPlanData) {
            addField(
                "Plan Title",
                currentPlanData.title
            );

            addField(
                "Subject",
                currentPlanData.subject
            );

            addField(
                "Level",
                currentPlanData.level
            );

            addField(
                "Goal",
                currentPlanData.goal
            );

            addField(
                "Duration",
                `${currentPlanData.duration} days`
            );

            addField(
                "Daily Hours",
                `${currentPlanData.dailyHours} hours`
            );

            addField(
                "Progress",
                `${currentPlanData.progress}%`
            );

            addField(
                "Completed Days",
                `${currentPlanData.completedDays}/${currentPlanData.totalDays}`
            );

            addField(
                "Completed Quizzes",
                `${currentPlanData.completedQuizzes}/${currentPlanData.totalDays}`
            );

            addField(
                "Completed Flashcards",
                `${currentPlanData.completedFlashcards}/${currentPlanData.totalDays}`
            );
        } else {
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "No active study plan found."
                );
        }

        // =====================================================
        // TODAY'S LEARNING
        // =====================================================

        if (
            currentPlanData &&
            currentPlanData.currentDay
        ) {
            const day =
                currentPlanData.currentDay;

            addSection("Today's Learning");

            addField(
                "Day Number",
                day.dayNumber
            );

            addField(
                "Topic",
                day.topic
            );

            addField(
                "Quiz Status",
                day.quizCompleted
                    ? "Completed"
                    : "Not Completed"
            );

            addField(
                "Flashcard Status",
                day.flashcardsCompleted
                    ? "Completed"
                    : "Not Completed"
            );

            doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(
                    "Description:",
                    {
                        keepWithNext: true,
                    }
                );

            doc.moveDown(0.1);

            doc
                .font("Helvetica")
                .text(
                    day.description ||
                    "No description available."
                );

            doc.moveDown(0.3);

            doc
                .font("Helvetica-Bold")
                .text(
                    "Tasks:",
                    {
                        keepWithNext: true,
                    }
                );

            doc.moveDown(0.1);

            if (
                Array.isArray(day.tasks) &&
                day.tasks.length > 0
            ) {
                day.tasks.forEach(
                    (task) =>
                        addBullet(task)
                );
            } else {
                doc
                    .font("Helvetica")
                    .text(
                        "No tasks available."
                    );
            }
        }

        // =====================================================
        // RECENT QUIZ ATTEMPTS
        // =====================================================

        addSection(
            "Recent Quiz Attempts"
        );

        if (
            recentQuizzes.length > 0
        ) {
            recentQuizzes.forEach(
                (quiz, index) => {
                    doc
                        .fontSize(11)
                        .font("Helvetica-Bold")
                        .text(
                            `${index + 1}. ${quiz.title}`,
                            {
                                keepWithNext: true,
                            }
                        );

                    addField(
                        "Study Plan Day",
                        quiz.dayNumber
                    );

                    addField(
                        "Score",
                        `${quiz.score}%`
                    );

                    addField(
                        "Questions",
                        quiz.totalQuestions
                    );

                    addField(
                        "Status",
                        quiz.completedAt
                            ? "Completed"
                            : "Not Completed"
                    );

                    addField(
                        "Completed At",
                        formatDate(
                            quiz.completedAt
                        )
                    );

                    doc.moveDown(0.2);
                }
            );
        } else {
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "No quiz attempts found."
                );
        }

        // =====================================================
        // STUDY ACTIVITY
        // =====================================================

        addSection("Study Activity");

        if (
            activities.length > 0
        ) {
            const activityLimit =
                Math.min(
                    activities.length,
                    30
                );

            for (
                let i = 0;
                i < activityLimit;
                i++
            ) {
                const activity =
                    activities[i];

                addBullet(
                    `${formatDate(
                        activity.activityDate
                    )} - ${
                        activity.activityType ||
                        "Study Activity"
                    }`
                );
            }
        } else {
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "No study activity recorded."
                );
        }

        // =====================================================
        // RECENT STUDY PLANS
        // =====================================================

        addSection(
            "Recent Study Plans"
        );

        const recentPlans =
            studyPlans.slice(0, 10);

        if (
            recentPlans.length > 0
        ) {
            recentPlans.forEach(
                (plan, index) => {
                    doc
                        .fontSize(11)
                        .font("Helvetica-Bold")
                        .text(
                            `${index + 1}. ${
                                plan.title ||
                                "Study Plan"
                            }`,
                            {
                                keepWithNext: true,
                            }
                        );

                    addField(
                        "Subject",
                        plan.subject
                    );

                    addField(
                        "Level",
                        plan.level
                    );

                    addField(
                        "Status",
                        plan.status
                    );

                    addField(
                        "Progress",
                        `${
                            Number(
                                plan.progress
                            ) || 0
                        }%`
                    );

                    addField(
                        "Created At",
                        formatDate(
                            plan.createdAt
                        )
                    );

                    doc.moveDown(0.2);
                }
            );
        } else {
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "No study plans found."
                );
        }

        // =====================================================
        // IMPORTANT:
        // SAVE ACTUAL PAGE COUNT BEFORE FOOTERS
        // =====================================================

        const range =
            doc.bufferedPageRange();

        const totalPages =
            range.count;

        // =====================================================
        // FOOTER
        // =====================================================
        // Do NOT allow footer to create a new page.
        // Temporarily remove bottom margin.
        // =====================================================

        for (
            let i = range.start;
            i < range.start + totalPages;
            i++
        ) {
            doc.switchToPage(i);

            const originalBottomMargin =
                doc.page.margins.bottom;

            // Prevent PDFKit from creating
            // another page for footer.
            doc.page.margins.bottom = 0;

            doc
                .save()
                .fontSize(8)
                .font("Helvetica")
                .fillColor("#666666")
                .text(
                    `Study Dashboard | Page ${
                        i + 1
                    } of ${totalPages}`,
                    40,
                    doc.page.height - 25,
                    {
                        width: 515,
                        height: 10,
                        align: "center",
                        lineBreak: false,
                    }
                )
                .restore();

            // Restore original margin
            doc.page.margins.bottom =
                originalBottomMargin;
        }

        // =====================================================
        // END PDF
        // =====================================================

        doc.end();

    } catch (error) {
        console.error(
            "Export Study Dashboard Error:",
            error
        );

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to export study dashboard",
            });
        }

        res.end();
    }
};


module.exports = {
    createStudyPlan,
    getMyStudyPlans,
    getStudyPlanById,
    completeStudyDay,
    generateStudyPlanFlashcards,
    generateStudyPlanQuiz,
    submitStudyPlanQuiz,
    reviewStudyPlanFlashcard,
    getStudyPlanQuizResult,
    studyDashboard,
    exportStudyDashboard
};