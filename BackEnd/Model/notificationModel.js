const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        // Notification kis user ki hai
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userSignup",
            required: true,
            index: true
        },

        // Notification title
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Notification description
        message: {
            type: String,
            required: true,
            trim: true
        },

        // Notification kis activity se related hai
        type: {
            type: String,
            enum: [
                "document",
                "summary",
                "flashcard",
                "quiz",
                "profile",
                "password",
                "system"
            ],
            default: "system"
        },

        // Related document/quiz/flashcard ki ID
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        // Read / Unread
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const notificationModel = mongoose.model('Notification', notificationSchema);

module.exports = notificationModel