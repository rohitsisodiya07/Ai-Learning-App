const mongoose = require("mongoose");

const studyActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userSignup",
            required: true,
            index: true,
        },

        // Date on which user studied
        activityDate: {
            type: Date,
            required: true,
        },

        // Number of activities completed that day
        quizCount: {
            type: Number,
            default: 0,
        },

        flashcardCount: {
            type: Number,
            default: 0,
        },

        studyPlanCount: {
            type: Number,
            default: 0,
        },

        weakTopicQuizCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// One activity document per user per day
studyActivitySchema.index(
    { userId: 1, activityDate: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "StudyActivity",
    studyActivitySchema
);