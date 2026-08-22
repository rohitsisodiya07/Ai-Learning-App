const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userSignup",
            required: true,
        },

        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        questions: [
            {
                type: {
                    type: String,
                    enum: ["mcq", "true_false", "short_answer"],
                    default: "mcq",
                },

                question: {
                    type: String,
                    required: true,
                },

                options: {
                    type: [String],
                    default: [],
                },

                correctAnswer: {
                    type: String,
                    required: true,
                },

                explanation: {
                    type: String,
                    default: "",
                },

                difficulty: {
                    type: String,
                    enum: ["easy", "medium", "hard"],
                    default: "medium",
                },
            },
        ],

        userAnswers: [
            {
                questionIndex: {
                    type: Number,
                    required: true,
                },

                selectedAnswer: {
                    type: String,
                    required: true,
                },

                isCorrect: {
                    type: Boolean,
                    required: true,
                },

                answeredAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        score: {
            type: Number,
            default: 0,
        },

        totalQuestions: {
            type: Number,
            required: true,
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const quizModel = mongoose.model("Quiz", quizSchema);

module.exports = quizModel;