const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
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

        messages: [
            {
                role: {
                    type: String,
                    enum: ["user", "assistant"],
                    required: true,
                },

                content: {
                    type: String,
                    required: true,
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },

                relevantChunks: {
                    type: [Number],
                    default: [],
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const chatModel = mongoose.model("ChatHistory", chatSchema);

module.exports = chatModel;