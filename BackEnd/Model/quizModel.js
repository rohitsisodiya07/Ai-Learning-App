const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userSignup",
            required: true,
        },

        // Document based quiz
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            default: null,
        },

        // Study Plan based quiz
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyPlan",
            default: null,
        },

        // Which day of the study plan
        dayNumber: {
            type: Number,
            default: null,
        },

        // Where the quiz came from
        sourceType: {
            type: String,
            enum: ["document", "study_plan", "weak_topic"],
            default: "document",
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        // ==========================================
        // Weak Topic Information
        // ==========================================

        // Accuracy when this topic was detected as weak
        weakTopicAccuracy: {
            type: Number,
            default: null,
            min: 0,
            max: 100,
        },

        questions: [
            {
                questionType: {
                    type: String,
                    enum: ["mcq", "true_false", "short_answer"],
                    default: "mcq",
                },

                question: {
                    type: String,
                    required: true,
                    trim: true,
                },

                options: {
                    type: [String],
                    default: [],
                },

                correctAnswer: {
                    type: String,
                    required: true,
                    trim: true,
                },

                explanation: {
                    type: String,
                    default: "",
                    trim: true,
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
                    trim: true,
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
            min: 0,
        },

        totalQuestions: {
            type: Number,
            required: true,
            min: 1,
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