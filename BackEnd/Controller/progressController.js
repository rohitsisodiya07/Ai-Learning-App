const quizModel = require("../Model/quizModel");
const flashcardModel = require("../Model/flashcardModel");
const studyPlanModel = require("../Model/studyPlanModel");
const studyActivityModel = require('../Model/studyActivityModel')
const { calculateStudyStats } = require('../Utilities/recordStudyActivity')

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


const getDashBoard = async (req, res) => {
    try {
        const userId = req.user._id;

        const totalQuizzes = await quizModel.countDocuments({
            userId,
        });

        const completedQuizzes = await quizModel.countDocuments({
            userId,
            completedAt: { $ne: null },
        });

        const flashcardSets = await flashcardModel
            .find({ userId })
            .select(
                "cards sourceType documentId planId dayNumber createdAt"
            )
            .lean();

        const totalFlashcards = flashcardSets.reduce(
            (total, flashcardSet) => {
                return (
                    total +
                    (Array.isArray(flashcardSet.cards)
                        ? flashcardSet.cards.length
                        : 0)
                );
            },
            0
        );

        let reviewedFlashcards = 0;

        flashcardSets.forEach((flashcardSet) => {
            if (!Array.isArray(flashcardSet.cards)) {
                return;
            }

            flashcardSet.cards.forEach((card) => {
                if (Number(card.reviewCount) > 0) {
                    reviewedFlashcards++;
                }
            });
        });

        const flashcardProgress =
            totalFlashcards > 0
                ? Math.round(
                      (reviewedFlashcards /
                          totalFlashcards) *
                      100
                  )
                : 0;

        const studyPlans = await studyPlanModel
            .find({ userId })
            .sort({ createdAt: -1 })
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
                (sum, plan) =>
                    sum +
                    (Number(plan.progress) || 0),
                0
            );

            studyPlanProgress = Math.round(
                totalProgress /
                totalStudyPlans
            );
        }

        const completedQuizData = await quizModel
            .find({
                userId,
                completedAt: {
                    $ne: null,
                },
            })
            .select(
                "score totalQuestions completedAt createdAt title"
            )
            .lean();

        let averageQuizScore = 0;
        let bestQuizScore = 0;

        const validScores = completedQuizData
            .map((quiz) => getQuizPercentage(quiz))
            .filter((score) => Number.isFinite(score));

        if (validScores.length > 0) {
            const totalScore = validScores.reduce(
                (sum, score) => sum + score,
                0
            );

            averageQuizScore = Math.round(
                totalScore / validScores.length
            );

            bestQuizScore = Math.max(...validScores);
        }

        const quizCompletionRate =
            totalQuizzes > 0
                ? Math.round(
                      (completedQuizzes /
                          totalQuizzes) *
                      100
                  )
                : 0;

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

            const completedQuizzesInPlan = days.filter(
                (day) =>
                    day.quizCompleted === true
            ).length;

            const completedFlashcardsInPlan = days.filter(
                (day) =>
                    day.flashcardsCompleted === true
            ).length;

            const today =
                days.find(
                    (day) => day.completed !== true
                ) || null;

            currentPlanData = {
                _id: currentStudyPlan._id,
                title: currentStudyPlan.title,
                subject: currentStudyPlan.subject,
                level: currentStudyPlan.level,
                duration: currentStudyPlan.duration,
                dailyHours: currentStudyPlan.dailyHours,
                goal: currentStudyPlan.goal,
                status: currentStudyPlan.status,
                progress:
                    Number(currentStudyPlan.progress) || 0,
                completedDays,
                totalDays: days.length,
                completedQuizzes: completedQuizzesInPlan,
                completedFlashcards: completedFlashcardsInPlan,
                today,
            };
        }

        const rawRecentQuizzes = await quizModel
            .find({ userId })
            .select(
                "title score totalQuestions completedAt createdAt sourceType planId dayNumber"
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean();

        const recentQuizzes = rawRecentQuizzes.map(quiz => ({
            ...quiz,
            score: getQuizPercentage(quiz)
        }));

        const recentStudyPlans = await studyPlanModel
            .find({ userId })
            .select(
                "title subject level duration dailyHours goal progress status createdAt"
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean();

        return res.status(200).json({
            success: true,
            message: "Main dashboard fetched successfully",
            data: {
                statistics: {
                    totalQuizzes,
                    completedQuizzes,
                    quizCompletionRate,
                    totalFlashcards,
                    reviewedFlashcards,
                    flashcardProgress,
                    totalStudyPlans,
                    activeStudyPlans,
                    completedStudyPlans,
                    studyPlanProgress,
                    averageQuizScore,
                    bestQuizScore,
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
        console.error("Main Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch main dashboard",
            error: error.message,
        });
    }
};

const getWeakTopics = async (req, res) => {
    try {
        const userId = req.user._id;

        const quizzes = await quizModel
            .find({
                userId,
                sourceType: {
                    $in: ["study_plan", "weak_topic"],
                },
                completedAt: { $ne: null },
            })
            .sort({ completedAt: 1 })
            .lean();

        if (!quizzes.length) {
            return res.status(200).json({
                success: true,
                message: "No completed quizzes found",
                data: {
                    weakTopics: [],
                    totalTopics: 0,
                    weakTopicCount: 0,
                },
            });
        }

        const plans = await studyPlanModel
            .find({ userId })
            .lean();

        const planMap = new Map();

        plans.forEach((plan) => {
            planMap.set(plan._id.toString(), plan);
        });

        const topicMap = new Map();

        quizzes.forEach((quiz) => {
            let topic = null;

            if (quiz.sourceType === "study_plan") {
                const plan = quiz.planId
                    ? planMap.get(quiz.planId.toString())
                    : null;

                const day = plan?.days?.find(
                    (item) =>
                        Number(item.dayNumber) ===
                        Number(quiz.dayNumber)
                );

                topic =
                    day?.topic ||
                    quiz.title ||
                    `Day ${quiz.dayNumber}`;
            }

            if (quiz.sourceType === "weak_topic") {
                const prefix = "Weak Topic Practice - ";

                if (quiz.title?.startsWith(prefix)) {
                    topic = quiz.title
                        .replace(prefix, "")
                        .trim();
                } else {
                    topic = quiz.title;
                }
            }

            if (!topic) {
                topic = "Unknown Topic";
            }

            const totalQuestions =
                quiz.totalQuestions ||
                quiz.userAnswers?.length ||
                quiz.questions?.length ||
                0;

            let correctAnswers = 0;

            if (quiz.userAnswers?.length) {
                correctAnswers = quiz.userAnswers.filter(
                    (answer) => answer.isCorrect === true
                ).length;
            } else if (
                quiz.score !== undefined &&
                quiz.score !== null
            ) {
                correctAnswers = quiz.score;
            }

            if (!topicMap.has(topic)) {
                topicMap.set(topic, {
                    topic,
                    totalQuestions: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    attempts: 0,
                    latestAccuracy: 0,
                    latestAttemptAt: null,
                    planId:
                        quiz.planId || null,
                    dayNumber:
                        quiz.dayNumber || null,
                });
            }

            const existing = topicMap.get(topic);

            existing.totalQuestions += totalQuestions;

            existing.correctAnswers += correctAnswers;

            existing.wrongAnswers +=
                Math.max(
                    totalQuestions - correctAnswers,
                    0
                );

            existing.attempts += 1;

            const quizAccuracy =
                totalQuestions > 0
                    ? Math.round(
                          (correctAnswers /
                              totalQuestions) *
                          100
                      )
                    : 0;

            if (
                !existing.latestAttemptAt ||
                new Date(quiz.completedAt) >
                new Date(existing.latestAttemptAt)
            ) {
                existing.latestAccuracy =
                    quizAccuracy;

                existing.latestAttemptAt =
                    quiz.completedAt;
            }

            if (
                quiz.sourceType === "study_plan" &&
                quiz.planId
            ) {
                existing.planId =
                    quiz.planId;

                existing.dayNumber =
                    quiz.dayNumber;
            }
        });

        const topics = Array.from(
            topicMap.values()
        ).map((topic) => {
            const overallAccuracy =
                topic.totalQuestions > 0
                    ? Math.round(
                          (topic.correctAnswers /
                              topic.totalQuestions) *
                          100
                      )
                    : 0;

            const accuracy =
                topic.latestAttemptAt
                    ? topic.latestAccuracy
                    : overallAccuracy;

            let level = "Strong";

            if (accuracy < 50) {
                level = "Weak";
            } else if (accuracy < 75) {
                level = "Needs Improvement";
            }

            return {
                topic: topic.topic,
                planId: topic.planId,
                dayNumber: topic.dayNumber,
                accuracy,
                overallAccuracy,
                latestAccuracy:
                    topic.latestAccuracy,
                correctAnswers:
                    topic.correctAnswers,
                wrongAnswers:
                    topic.wrongAnswers,
                totalQuestions:
                    topic.totalQuestions,
                attempts:
                    topic.attempts,
                latestAttemptAt:
                    topic.latestAttemptAt,
                level,
            };
        });

        topics.sort(
            (a, b) =>
                a.accuracy - b.accuracy
        );

        const weakTopics = topics.filter(
            (topic) =>
                topic.accuracy < 75
        );

        return res.status(200).json({
            success: true,
            message:
                "Weak topics detected successfully",

            data: {
                weakTopics,
                totalTopics:
                    topics.length,
                weakTopicCount:
                    weakTopics.length,
            },
        });
    } catch (error) {
        console.error(
            "Weak Topic Detection Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to detect weak topics",
            error: error.message,
        });
    }
};

const generateWeakTopicPractice = async (req, res) => {
    try {
        const { topic, accuracy, level } = req.body;

        if (!topic) {
            return res.status(400).json({
                success: false,
                message: "Topic is required",
            });
        }

        if (accuracy !== undefined && accuracy >= 75) {
            return res.status(400).json({
                success: false,
                message: "This topic is not a weak topic",
            });
        }

        const practice = {
            topic,
            revision: `Revise the core concepts of ${topic} before attempting another quiz.`,
            conceptsToRevise: [
                `Understand the fundamentals of ${topic}`,
                `Review important terminology`,
                `Study common interview questions`,
                `Practice practical examples`,
                `Review common mistakes`,
            ],
            interviewQuestions: [
                `What is ${topic}?`,
                `Explain the main concepts of ${topic}.`,
                `Why is ${topic} important in JavaScript?`,
                `What are common mistakes related to ${topic}?`,
                `Give a practical example of ${topic}.`,
            ],
            practiceQuestions: [
                `Explain ${topic} in your own words.`,
                `Write an example related to ${topic}.`,
                `What problem does ${topic} solve?`,
                `Compare the important concepts of ${topic}.`,
                `Solve a basic problem using ${topic}.`,
            ],
            codingTasks: [
                `Create a basic example using ${topic}.`,
                `Solve one interview-level problem using ${topic}.`,
                `Build a small practical example using ${topic}.`,
            ],
            tips: [
                "Understand the concept before memorizing syntax.",
                "Practice coding examples regularly.",
                "Review incorrect quiz answers.",
            ],
        };

        return res.status(200).json({
            success: true,
            message: "Weak topic practice generated successfully",
            data: practice,
        });

    } catch (error) {
        console.error(
            "Weak Topic Practice Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate weak topic practice",
            error: error.message,
        });
    }
};

const generateWeakTopicQuiz = async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            topic,
            accuracy = 0,
            level = "Beginner"
        } = req.body;

        if (!topic) {
            return res.status(400).json({
                success: false,
                message: "Topic is required",
            });
        }

        if (accuracy < 0 || accuracy > 100) {
            return res.status(400).json({
                success: false,
                message: "Accuracy must be between 0 and 100",
            });
        }

        if (accuracy >= 75) {
            return res.status(400).json({
                success: false,
                message: "This topic is not a weak topic",
            });
        }

        const questions = [
            {
                questionType: "mcq",
                question: `Which concept is most closely related to ${topic}?`,
                options: [
                    "Lexical scope and closures",
                    "CSS Flexbox",
                    "MongoDB indexing",
                    "HTTP status codes"
                ],
                correctAnswer: "Lexical scope and closures",
                explanation: `${topic} is closely related to functions, lexical scope and closures in JavaScript.`,
                difficulty: "medium",
            },
            {
                questionType: "true_false",
                question: "A closure allows an inner function to access variables from its outer lexical scope.",
                options: ["True", "False"],
                correctAnswer: "True",
                explanation: "A closure retains access to variables from its enclosing lexical environment.",
                difficulty: "easy",
            },
            {
                questionType: "mcq",
                question: "What determines lexical scope in JavaScript?",
                options: [
                    "Where the code is defined",
                    "Where the function is called",
                    "The browser version",
                    "The function return value"
                ],
                correctAnswer: "Where the code is defined",
                explanation: "Lexical scope is determined by where variables and functions are defined in the source code.",
                difficulty: "medium",
            },
            {
                questionType: "short_answer",
                question: "What is the name of the mechanism where a function remembers variables from its outer scope?",
                options: [],
                correctAnswer: "closure",
                explanation: "A closure allows a function to retain access to variables from its outer lexical scope.",
                difficulty: "medium",
            },
            {
                questionType: "mcq",
                question: "How do arrow functions handle the `this` keyword?",
                options: [
                    "They create their own dynamic this",
                    "They inherit this lexically",
                    "They always use global this",
                    "They cannot use this"
                ],
                correctAnswer: "They inherit this lexically",
                explanation: "Arrow functions do not create their own this binding and instead inherit it from the surrounding lexical scope.",
                difficulty: "hard",
            },
        ];

        const quiz = await quizModel.create({
            userId,
            documentId: null,
            planId: null,
            dayNumber: null,
            sourceType: "weak_topic",
            title: `Weak Topic Practice - ${topic}`,
            weakTopicAccuracy: accuracy,
            questions,
            userAnswers: [],
            score: 0,
            totalQuestions: questions.length,
            completedAt: null,
        });

        return res.status(201).json({
            success: true,
            message: "Weak topic quiz generated successfully",
            data: {
                quizId: quiz._id,
                topic,
                accuracy,
                level,
                title: quiz.title,
                questions: quiz.questions,
                totalQuestions: quiz.totalQuestions,
            },
        });

    } catch (error) {
        console.error(
            "Generate Weak Topic Quiz Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate weak topic quiz",
            error: error.message,
        });
    }
};

const getStudyStreak = async (req, res) => {
    try {
        const userId = req.user._id;

        const activities = await studyActivityModel
            .find({ userId })
            .sort({ activityDate: -1 })
            .lean();

        if (!activities.length) {
            return res.status(200).json({
                success: true,
                message: "Study streak fetched successfully",
                data: {
                    currentStreak: 0,
                    longestStreak: 0,
                    totalStudyDays: 0,
                    lastStudyDate: null,
                },
            });
        }

        const studyDates = new Set();

        activities.forEach((activity) => {
            const totalActivity =
                (activity.quizCount || 0) +
                (activity.flashcardCount || 0) +
                (activity.studyPlanCount || 0) +
                (activity.weakTopicQuizCount || 0);

            if (totalActivity > 0) {
                const date = new Date(activity.activityDate);

                const dateString =
                    `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, "0")}-${String(
                        date.getDate()
                    ).padStart(2, "0")}`;

                studyDates.add(dateString);
            }
        });

        const dates = Array.from(studyDates)
            .map((date) => new Date(`${date}T00:00:00`))
            .sort((a, b) => b - a);

        if (!dates.length) {
            return res.status(200).json({
                success: true,
                message: "Study streak fetched successfully",
                data: {
                    currentStreak: 0,
                    longestStreak: 0,
                    totalStudyDays: 0,
                    lastStudyDate: null,
                },
            });
        }

        const getDateDifference = (date1, date2) => {
            const oneDay = 24 * 60 * 60 * 1000;
            return Math.round(
                Math.abs(date1 - date2) / oneDay
            );
        };

        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        let currentStreak = 0;
        const daysFromToday = getDateDifference(
            today,
            dates[0]
        );

        if (daysFromToday <= 1) {
            currentStreak = 1;

            for (let i = 1; i < dates.length; i++) {
                const difference = getDateDifference(
                    dates[i - 1],
                    dates[i]
                );

                if (difference === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        let longestStreak = 1;
        let tempStreak = 1;

        for (let i = 1; i < dates.length; i++) {
            const difference = getDateDifference(
                dates[i - 1],
                dates[i]
            );

            if (difference === 1) {
                tempStreak++;
                longestStreak = Math.max(
                    longestStreak,
                    tempStreak
                );
            } else {
                tempStreak = 1;
            }
        }

        const lastStudyDate = dates[0];

        return res.status(200).json({
            success: true,
            message: "Study streak fetched successfully",
            data: {
                currentStreak,
                longestStreak,
                totalStudyDays: dates.length,
                lastStudyDate,
            },
        });

    } catch (error) {
        console.error(
            "Get Study Streak Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch study streak",
        });
    }
};

const getWeakTopicImprovement = async (req, res) => {
    try {
        const userId = req.user._id;

        const quizzes = await quizModel
            .find({
                userId,
                sourceType: "weak_topic",
                completedAt: { $ne: null },
            })
            .sort({ createdAt: 1 })
            .lean();

        if (!quizzes.length) {
            return res.status(200).json({
                success: true,
                message: "No weak topic quiz data found",
                data: [],
            });
        }

        const topicMap = new Map();

        quizzes.forEach((quiz) => {
            const topic =
                quiz.title
                    ?.replace(
                        "Weak Topic Practice - ",
                        ""
                    )
                    .trim() ||
                "Unknown Topic";

            const accuracy =
                quiz.totalQuestions > 0
                    ? Math.round(
                          (quiz.score /
                              quiz.totalQuestions) *
                          100
                      )
                    : 0;

            if (!topicMap.has(topic)) {
                topicMap.set(topic, []);
            }

            topicMap.get(topic).push({
                quizId: quiz._id,
                beforeAccuracy:
                    quiz.weakTopicAccuracy ?? null,
                afterAccuracy: accuracy,
                score: quiz.score,
                totalQuestions:
                    quiz.totalQuestions,
                completedAt:
                    quiz.completedAt,
            });
        });

        const improvementData = [];

        for (const [topic, attempts] of topicMap) {
            const beforeAccuracy =
                attempts[0].beforeAccuracy ?? 0;

            const afterAccuracy =
                attempts[attempts.length - 1]
                    .afterAccuracy;

            const improvement =
                afterAccuracy - beforeAccuracy;

            let status = "No Change";

            if (improvement > 0) {
                status = "Improved";
            } else if (improvement < 0) {
                status = "Declined";
            }

            improvementData.push({
                topic,
                beforeAccuracy,
                afterAccuracy,
                improvement,
                status,
                attempts: attempts.length,
                firstAttempt: attempts[0],
                latestAttempt:
                    attempts[attempts.length - 1],
            });
        }

        improvementData.sort(
            (a, b) =>
                b.improvement -
                a.improvement
        );

        return res.status(200).json({
            success: true,
            message: "Weak topic improvement fetched successfully",
            data: improvementData,
        });

    } catch (error) {
        console.error(
            "Weak Topic Improvement Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch weak topic improvement",
        });
    }
};

module.exports = {
    getDashBoard,
    getWeakTopics,
    generateWeakTopicPractice,
    generateWeakTopicQuiz,
    getStudyStreak,
    getWeakTopicImprovement
};