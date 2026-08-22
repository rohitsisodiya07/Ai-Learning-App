const mongoose = require("mongoose");

const documentModel = require("../Model/documentModel");
const flashcardModel = require("../Model/flashcardModel");
const quizModel = require("../Model/quizModel");


// =====================================================
// GET DASHBOARD
// =====================================================

const getDashBoard = async (req, res) => {

    try {

        // =================================================
        // 1. Authentication Check
        // =================================================

        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user"
            });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);


        // =================================================
        // 2. BASIC COUNTS
        // =================================================

        const [
            totalDocuments,
            totalFlashcardSets,
            totalQuizzes,
            completedQuizzes
        ] = await Promise.all([

            documentModel.countDocuments({
                userId
            }),

            flashcardModel.countDocuments({
                userId
            }),

            quizModel.countDocuments({
                userId
            }),

            quizModel.countDocuments({
                userId,
                completedAt: {
                    $ne: null
                }
            })

        ]);


        // =================================================
        // 3. FLASHCARD STATISTICS
        // =================================================

        const flashcardStats = await flashcardModel.aggregate([

            // Current user's flashcards
            {
                $match: {
                    userId
                }
            },

            // Calculate stats for each flashcard set
            {
                $project: {

                    totalCards: {
                        $size: {
                            $ifNull: ["$cards", []]
                        }
                    },

                    reviewedCards: {
                        $size: {
                            $filter: {
                                input: {
                                    $ifNull: ["$cards", []]
                                },
                                as: "card",
                                cond: {
                                    $gt: [
                                        {
                                            $ifNull: [
                                                "$$card.reviewCount",
                                                0
                                            ]
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    },

                    starredCards: {
                        $size: {
                            $filter: {
                                input: {
                                    $ifNull: ["$cards", []]
                                },
                                as: "card",
                                cond: {
                                    $eq: [
                                        "$$card.isStarred",
                                        true
                                    ]
                                }
                            }
                        }
                    }

                }
            },

            // Combine all flashcard sets
            {
                $group: {

                    _id: null,

                    totalFlashcards: {
                        $sum: "$totalCards"
                    },

                    reviewedFlashcards: {
                        $sum: "$reviewedCards"
                    },

                    starredFlashcards: {
                        $sum: "$starredCards"
                    }

                }
            }

        ]);


        // If user has no flashcards
        const flashcardData = flashcardStats[0] || {

            totalFlashcards: 0,

            reviewedFlashcards: 0,

            starredFlashcards: 0

        };


        // =================================================
        // 4. QUIZ STATISTICS
        // =================================================

        const quizStats = await quizModel.aggregate([

            {
                $match: {
                    userId,
                    completedAt: {
                        $ne: null
                    }
                }
            },

            {
                $group: {

                    _id: null,

                    averageScore: {
                        $avg: {
                            $ifNull: ["$score", 0]
                        }
                    },

                    bestScore: {
                        $max: {
                            $ifNull: ["$score", 0]
                        }
                    },

                    totalCompleted: {
                        $sum: 1
                    }

                }
            }

        ]);


        const quizData = quizStats[0] || {

            averageScore: 0,

            bestScore: 0,

            totalCompleted: 0

        };


        // =================================================
        // 5. PROGRESS CALCULATION
        // =================================================

        const flashcardProgress =
            flashcardData.totalFlashcards > 0

                ? Math.round(
                    (
                        flashcardData.reviewedFlashcards /
                        flashcardData.totalFlashcards
                    ) * 100
                )

                : 0;


        const quizCompletion =
            totalQuizzes > 0

                ? Math.round(
                    (
                        completedQuizzes /
                        totalQuizzes
                    ) * 100
                )

                : 0;


        // =================================================
        // 6. RECENT DOCUMENTS
        // =================================================

        const recentDocuments = await documentModel
            .find({
                userId
            })
            .sort({
                lastAccessed: -1,
                createdAt: -1
            })
            .limit(5)
            .select(
                "title fileName lastAccessed status createdAt"
            )
            .lean();


        // =================================================
        // 7. RECENT QUIZZES
        // =================================================

        const recentQuizzes = await quizModel
            .find({
                userId
            })
            .sort({
                createdAt: -1
            })
            .limit(5)
            .populate(
                "documentId",
                "title"
            )
            .select(
                "title score totalQuestions completedAt createdAt"
            )
            .lean();


        // =================================================
        // 8. FINAL RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            message: "Dashboard data fetched successfully",

            data: {

                // =========================================
                // OVERVIEW
                // =========================================

                overview: {

                    totalDocuments,

                    totalFlashcardSets,

                    totalFlashcards:
                        flashcardData.totalFlashcards,

                    reviewedFlashcards:
                        flashcardData.reviewedFlashcards,

                    starredFlashcards:
                        flashcardData.starredFlashcards,

                    totalQuizzes,

                    completedQuizzes,

                    averageScore:
                        Math.round(
                            quizData.averageScore || 0
                        ),

                    bestScore:
                        Math.round(
                            quizData.bestScore || 0
                        )

                },


                // =========================================
                // PROGRESS
                // =========================================

                progress: {

                    flashcardProgress,

                    quizCompletion

                },


                // =========================================
                // RECENT ACTIVITY
                // =========================================

                recentActivity: {

                    documents:
                        recentDocuments,

                    quizzes:
                        recentQuizzes

                }

            }

        });


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch dashboard statistics",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined

        });

    }

};


module.exports = {
    getDashBoard
};