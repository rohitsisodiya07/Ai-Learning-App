const mongoose = require("mongoose");
const documentModel = require('../Model/documentModel');
const flashcardModel = require('../Model/flashcardModel');
const quizModel = require('../Model/quizModel');
const chatModel = require('../Model/chatHistory');
const { extractTextFromPDF } = require('../Utilities/pdfParse');
const { chunkText } = require('../Utilities/textChunker');
const path = require('path');
const { createNotification } = require('../Controller/notificationController');
const cloudinary = require('../Utilities/cloudnary');

const uploadToCloudinary = (fileBuffer, originalName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'ai-learning-documents',
                resource_type: 'auto',
                public_id: `${Date.now()}-${path.parse(originalName).name}`
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

const uploadDocument = async (req, res) => {
    console.log("UPLOAD DOCUMENT CONTROLLER HIT");

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please Upload a PDF File"
            });
        }

        console.log("UPLOADED FILE (Memory Buffer):", req.file.originalname);

        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please Provide a Document Title"
            });
        }

        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        const fileUrl = cloudinaryResult.secure_url;

        const document = await documentModel.create({
            userId: req.user._id,
            title: title.trim(),
            fileName: req.file.originalname,
            filePath: fileUrl,
            fileSize: req.file.size,
            status: "processing"
        });

        await createNotification({
            userId: req.user._id,
            title: "Document Uploaded",
            message: `"${document.title}" has been uploaded successfully.`,
            type: "document",
            relatedId: document._id
        });

        processPDF(document._id, req.file.buffer).catch(error => {
            console.error("PDF Processing Error:", error);
        });

        return res.status(201).json({
            success: true,
            message: "Document uploaded successfully. Processing started.",
            data: {
                id: document._id,
                title: document.title,
                fileName: document.fileName,
                fileSize: document.fileSize,
                status: document.status
            }
        });

    } catch (error) {
        console.error("Upload Document Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload document"
        });
    }
};

const processPDF = async (documentId, fileBuffer) => {
    try {
        const { text } = await extractTextFromPDF(fileBuffer);
        const chunks = chunkText(text, 500, 50);

        const document = await documentModel.findByIdAndUpdate(
            documentId,
            { extractedText: text, chunks: chunks, status: "ready", lastAccessed: new Date() },
            { new: true }
        );

        console.log(`Document ${documentId} Processed Successfully`);

        if (document) {
            await createNotification({
                userId: document.userId,
                title: "Document Ready",
                message: `"${document.title}" has been processed successfully.`,
                type: "document",
                relatedId: document._id
            });
        }
    } catch (error) {
        console.error(`PDF Processing Error for ${documentId}:`, error);

        const document = await documentModel.findByIdAndUpdate(
            documentId,
            { status: "failed" },
            { new: true }
        );

        if (document) {
            await createNotification({
                userId: document.userId,
                title: "Document Processing Failed",
                message: `"${document.title}" could not be processed.`,
                type: "document",
                relatedId: document._id
            });
        }
    }
};

const getDocuments = async (req, res) => {
    try {
        const {
            search = "",
            sortBy = "newest",
            page = 1,
            limit = 10,
        } = req.query;

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
        const skip = (pageNumber - 1) * limitNumber;
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const matchStage = { userId };

        if (search.trim()) {
            matchStage.title = {
                $regex: search.trim(),
                $options: "i",
            };
        }

        let sortStage = {};
        if (sortBy === "oldest") {
            sortStage = { createdAt: 1 };
        } else if (sortBy === "name") {
            sortStage = { title: 1 };
        } else {
            sortStage = { createdAt: -1 };
        }

        const total = await documentModel.countDocuments(matchStage);

        const documents = await documentModel.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "flashcards",
                    localField: "_id",
                    foreignField: "documentId",
                    as: "flashcardSets",
                },
            },
            {
                $lookup: {
                    from: "quizzes",
                    localField: "_id",
                    foreignField: "documentId",
                    as: "quizzes",
                },
            },
            {
                $addFields: {
                    flashcardCount: {
                        $reduce: {
                            input: "$flashcardSets",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    {
                                        $cond: [
                                            { $isArray: "$$this.cards" },
                                            { $size: "$$this.cards" },
                                            0
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    quizCount: { $size: "$quizzes" },
                },
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcardSets: 0,
                    quizzes: 0,
                },
            },
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limitNumber },
        ]);

        const statsResult = await documentModel.aggregate([
            { $match: { userId } },
            {
                $lookup: {
                    from: "flashcards",
                    localField: "_id",
                    foreignField: "documentId",
                    as: "flashcards",
                },
            },
            {
                $lookup: {
                    from: "quizzes",
                    localField: "_id",
                    foreignField: "documentId",
                    as: "quizzes",
                },
            },
            {
                $group: {
                    _id: null,
                    totalDocuments: { $sum: 1 },
                    totalFlashcards: {
                        $sum: {
                            $reduce: {
                                input: "$flashcards",
                                initialValue: 0,
                                in: {
                                    $add: [
                                        "$$value",
                                        {
                                            $cond: [
                                                { $isArray: "$$this.cards" },
                                                { $size: "$$this.cards" },
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    totalQuizzes: { $sum: { $size: "$quizzes" } },
                    totalStorage: { $sum: { $ifNull: ["$fileSize", 0] } },
                },
            },
        ]);

        const stats = statsResult[0] || {
            totalDocuments: 0,
            totalFlashcards: 0,
            totalQuizzes: 0,
            totalStorage: 0,
        };

        const totalPages = Math.ceil(total / limitNumber);

        return res.status(200).json({
            success: true,
            data: documents,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
            },
            stats,
        });
    } catch (error) {
        console.error("Get Documents Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch documents",
        });
    }
};

const getSingleDocument = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Document ID" });
        }

        const document = await documentModel.findOne({ _id: req.params.id, userId: req.user._id });
        if (!document) return res.status(404).json({ success: false, message: "Document Not Found" });

        const [flashcardCount, quizCount] = await Promise.all([
            flashcardModel.countDocuments({ documentId: document._id, userId: req.user._id }),
            quizModel.countDocuments({ documentId: document._id, userId: req.user._id })
        ]);

        document.lastAccessed = new Date();
        await document.save();

        const documentData = document.toObject();
        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;

        return res.status(200).json({ success: true, message: "Document fetched successfully", data: documentData });
    } catch (error) {
        console.error("Get Single Document Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch document" });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: "Document ID is required" });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Document ID" });

        const document = await documentModel.findOne({ _id: id, userId: req.user._id });
        if (!document) return res.status(404).json({ success: false, message: "Document Not Found" });

        await Promise.all([
            flashcardModel.deleteMany({ documentId: document._id, userId: req.user._id }),
            quizModel.deleteMany({ documentId: document._id, userId: req.user._id }),
            chatModel.deleteMany({ documentId: document._id, userId: req.user._id })
        ]);

        await document.deleteOne();

        await createNotification({
            userId: req.user._id,
            title: "Document Deleted",
            message: `"${document.title}" was deleted successfully.`,
            type: "document",
            relatedId: document._id
        });

        return res.status(200).json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
        console.error("Delete Document Error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete document" });
    }
};

const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!req.user || !req.user._id) return res.status(401).json({ success: false, message: "Unauthorized user" });
        if (!id) return res.status(400).json({ success: false, message: "Document ID is required" });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid document ID" });

        if (title === undefined || typeof title !== "string") {
            return res.status(400).json({ success: false, message: "Valid document title is required" });
        }

        const trimmedTitle = title.trim();
        if (trimmedTitle.length < 3) {
            return res.status(400).json({ success: false, message: "Document title must be at least 3 characters" });
        }

        const document = await documentModel.findOne({ _id: id, userId: req.user._id });
        if (!document) return res.status(404).json({ success: false, message: "Document not found" });

        const oldTitle = document.title;
        document.title = trimmedTitle;
        await document.save();

        await createNotification({
            userId: req.user._id,
            title: "Document Updated",
            message: `"${oldTitle}" has been renamed to "${document.title}".`,
            type: "document",
            relatedId: document._id
        });

        return res.status(200).json({
            success: true,
            message: "Document updated successfully",
            data: {
                id: document._id,
                title: document.title,
                fileName: document.fileName,
                filePath: document.filePath,
                fileSize: document.fileSize,
                status: document.status,
                updatedAt: document.updatedAt
            }
        });
    } catch (error) {
        console.error("Update Document Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update document" });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getSingleDocument,
    deleteDocument,
    updateDocument
};