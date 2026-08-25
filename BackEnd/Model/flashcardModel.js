const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userSignup",
            required: true,
        },

        // Document based flashcards
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            default: null,
        },

        // Study Plan based flashcards
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

        // Where the flashcards came from
        sourceType: {
            type: String,
            enum: ["document", "study_plan"],
            default: "document",
        },

        cards: [
            {
                question: {
                    type: String,
                    required: true,
                    trim: true,
                },

                answer: {
                    type: String,
                    required: true,
                    trim: true,
                },

                difficulty: {
                    type: String,
                    enum: ["easy", "medium", "hard"],
                    default: "medium",
                },

                lastReviewed: {
                    type: Date,
                    default: null,
                },

                reviewCount: {
                    type: Number,
                    default: 0,
                },

                isStarred: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const flashcardModel = mongoose.model(
    "FlashCard",
    flashcardSchema
);

module.exports = flashcardModel;