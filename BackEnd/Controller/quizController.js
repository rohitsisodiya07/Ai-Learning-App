const mongoose = require("mongoose");
const quizModel = require("../Model/quizModel");
const { createNotification } = require('../Controller/notificationController');

const getQuizzes = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) return res.status(400).json({ success: false, message: "Document ID is required" });
        if (!mongoose.Types.ObjectId.isValid(documentId)) return res.status(400).json({ success: false, message: "Invalid Document ID" });

        const {
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 6
        } = req.query;

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        const filter = {
            userId: new mongoose.Types.ObjectId(req.user._id),
            documentId: new mongoose.Types.ObjectId(documentId)
        };

        if (search.trim()) {
            filter.title = {
                $regex: search.trim(),
                $options: "i"
            };
        }

        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1
        };

        const stats = await quizModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalQuizzes: { $sum: 1 },
                    totalQuestions: {
                        $sum: {
                            $cond: [
                                { $isArray: "$questions" },
                                { $size: "$questions" },
                                { $ifNull: ["$totalQuestions", 0] }
                            ]
                        }
                    }
                }
            }
        ]);

        const totalQuizzes = stats.length > 0 ? stats[0].totalQuizzes : 0;
        const totalQuestions = stats.length > 0 ? stats[0].totalQuestions : 0;

        const quizzes = await quizModel
            .find(filter)
            .populate("documentId", "title fileName")
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean();

        const totalPages = Math.ceil(totalQuizzes / limitNumber);

        return res.status(200).json({
            success: true,
            message: "Quizzes fetched successfully",
            data: quizzes,
            totalQuestions,
            pagination: {
                total: totalQuizzes,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        });
    } catch (error) {
        console.error("Get Quizzes Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch quizzes" });
    }
};

const getQuizId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: "Quiz ID is required" });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Quiz ID" });

        const quiz = await quizModel
            .findOne({ _id: id, userId: req.user._id })
            .populate("documentId", "title fileName");

        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        return res.status(200).json({ success: true, message: "Quiz fetched successfully", data: quiz });
    } catch (error) {
        console.error("Get Quiz Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch quiz" });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid or missing Quiz ID" });
        }

        if (!Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: "Answers must be an array" });
        }

        const quiz = await quizModel.findOne({ _id: id, userId: req.user._id });
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
        if (quiz.completedAt) return res.status(400).json({ success: false, message: "Quiz already completed" });

        if (answers.length !== quiz.questions.length) {
            return res.status(400).json({
                success: false,
                message: `Please answer all ${quiz.questions.length} questions before submitting`
            });
        }

        const uniqueIndexes = new Set(answers.map((answer) => answer.questionIndex));
        if (uniqueIndexes.size !== quiz.questions.length) {
            return res.status(400).json({ success: false, message: "Each question must be answered exactly once" });
        }

        const normalizeAnswer = (answer) => {
            return String(answer || "").trim().replace(/\s+/g, " ").toLowerCase();
        };

        const cleanCorrectAnswer = (answer) => {
            return String(answer || "").replace(/^\s*\d+\s*:\s*/, "").trim();
        };

        let correctCount = 0;
        const userAnswers = [];

        answers.forEach((answer) => {
            const { questionIndex, selectedAnswer } = answer;

            if (typeof questionIndex !== "number" || questionIndex < 0 || questionIndex >= quiz.questions.length) {
                throw new Error("Invalid question index");
            }

            if (typeof selectedAnswer !== "string" || !selectedAnswer.trim()) {
                throw new Error("Invalid selected answer");
            }

            const question = quiz.questions[questionIndex];
            const originalCorrectAnswer = question.correctAnswer;
            const cleanedCorrectAnswer = cleanCorrectAnswer(originalCorrectAnswer);

            const normalizedSelected = normalizeAnswer(selectedAnswer);
            const normalizedCorrect = normalizeAnswer(cleanedCorrectAnswer);

            let isCorrect = normalizedSelected === normalizedCorrect;

            if (isCorrect) correctCount++;

            userAnswers.push({
                questionIndex,
                selectedAnswer,
                isCorrect,
                answeredAt: new Date()
            });
        });

        const totalQuestions = quiz.questions.length;
        const score = Math.round((correctCount / totalQuestions) * 100);

        quiz.userAnswers = userAnswers;
        quiz.score = score;
        quiz.completedAt = new Date();

        await quiz.save();

        return res.status(200).json({
            success: true,
            message: "Quiz submitted successfully",
            data: {
                quizId: quiz._id,
                score,
                correctAnswers: correctCount,
                totalQuestions,
                userAnswers,
                completedAt: quiz.completedAt
            }
        });
    } catch (error) {
        console.error("Submit Quiz Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to submit quiz" });
    }
};

const getQuizResults = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid or missing Quiz ID" });
        }

        const quiz = await quizModel
            .findOne({ _id: id, userId: req.user._id })
            .populate("documentId", "title");

        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
        if (!quiz.completedAt) return res.status(400).json({ success: false, message: "Quiz has not been completed yet" });

        const detailedResults = quiz.questions.map((question, index) => {
            const userAnswer = quiz.userAnswers.find(answer => answer.questionIndex === index);

            return {
                questionIndex: index,
                type: question.questionType,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                selectedAnswer: userAnswer ? userAnswer.selectedAnswer : null,
                isCorrect: userAnswer ? userAnswer.isCorrect : false,
                explanation: question.explanation,
                difficulty: question.difficulty
            };
        });

        const correctAnswers = quiz.userAnswers.filter(answer => answer.isCorrect === true).length;

        return res.status(200).json({
            success: true,
            message: "Quiz results fetched successfully",
            data: {
                quizId: quiz._id,
                title: quiz.title,
                document: quiz.documentId,
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                correctAnswers,
                attemptedQuestions: quiz.userAnswers.length,
                completedAt: quiz.completedAt,
                results: detailedResults
            }
        });
    } catch (error) {
        console.error("Get Quiz Results Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch quiz results" });
    }
};

const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Quiz ID" });
        }

        const quiz = await quizModel.findOne({ _id: id, userId: req.user._id });
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        const relatedDocumentId = quiz.documentId;
        await quiz.deleteOne();

        await createNotification({
            userId: req.user._id,
            title: "Quiz Deleted",
            message: `Quiz was deleted successfully.`,
            type: "quiz",
            relatedId: relatedDocumentId
        });

        return res.status(200).json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
        console.error("Delete Quiz Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getQuizzes, getQuizId, submitQuiz, getQuizResults, deleteQuiz };