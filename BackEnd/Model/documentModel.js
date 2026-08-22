const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userSignup",
            required: true,
        },

        title: {
            type: String,
            required: [true, "Please Provide a Document Title"],
            trim: true,
        },

        fileName: {
            type: String,
            required: true,
        },

        filePath: {
            type: String,
            required: true,
        },

        fileSize: {
            type: Number,
            required: true,
        },

        extractedText: {
            type: String,
            default: "",
        },

        chunks: [
            {
                content: {
                    type: String,
                    required: true,
                },

                pageNumber: {
                    type: Number,
                    default: 0,
                },

                chunkIndex: {
                    type: Number,
                    required: true,
                },
            },
        ],

        uploadDate: {
            type: Date,
            default: Date.now,
        },

        lastAccessed: {
            type: Date,
            default: Date.now,
        },

        status: {
            type: String,
            enum: ["processing", "ready", "failed"],
            default: "processing",
        },
    },
    {
        timestamps: true,
    }
);

const documentModel = mongoose.model("Document", documentSchema);

module.exports = documentModel;