const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userSignup",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        level: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            required: true,
        },

        duration: {
            type: Number,
            required: true,
            min: 1,
        },

        dailyHours: {
            type: Number,
            required: true,
            min: 0.5,
        },

        goal: {
            type: String,
            required: true,
            trim: true,
        },

        days: [
            {
                dayNumber: Number,
                topic: String,
                description: String,
                tasks: [String],

                quizId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Quiz",
                    default: null,
                },

                quizCompleted: {
                    type: Boolean,
                    default: false,
                },

                flashcardsCompleted: {
                    type: Boolean,
                    default: false,
                },

                completed: {
                    type: Boolean,
                    default: false,
                },

                completedAt: {
                    type: Date,
                    default: null,
                },
            },
        ],

        status: {
            type: String,
            enum: ["active", "completed", "paused"],
            default: "active",
        },

        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
    },
    {
        timestamps: true,
    }
);

const studyPlanModel = mongoose.model("StudyPlan", studyPlanSchema);

module.exports = studyPlanModel;