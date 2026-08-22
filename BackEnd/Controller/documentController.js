const documentModel = require('../Model/documentModel');
const flashcardModel = require('../Model/flashcardModel');
const quizModel = require('../Model/quizModel');
const chatModel = require('../Model/chatHistory');
const { extractTextFromPDF } = require('../Utilities/pdfParse');
const { chunkText } = require('../Utilities/textChunker');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const path = require('path');
const { createNotification } = require('../Controller/notificationController');

// Upload Pdf Document
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please Upload a PDF File" });
        }

        const { title } = req.body;
        if (!title || !title.trim()) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ success: false, message: "Please Provide a Document Title" });
        }

        const baseUrl = `http://localhost:${process.env.PORT || 4000}`;
        const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

        const document = await documentModel.create({
            userId: req.user._id,
            title: title.trim(),
            fileName: req.file.originalname,
            filePath: fileUrl,
            fileSize: req.file.size,
            status: "processing"
        });

        // 1. Upload Notification
        await createNotification({
            userId: req.user._id,
            title: "Document Uploaded",
            message: `"${document.title}" has been uploaded successfully.`,
            type: "document",
            relatedId: document._id
        });

        // Process PDF in background
        processPDF(document._id, req.file.path).catch(error => {
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
        if (req.file?.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (fileError) {
                console.error("File Delete Error:", fileError);
            }
        }
        return res.status(500).json({ success: false, message: "Failed to upload document" });
    }
};

// Helper Function to Process PDF
const processPDF = async (documentId, filePath) => {
    try {
        const { text } = await extractTextFromPDF(filePath);
        const chunks = chunkText(text, 500, 50);

        const document = await documentModel.findByIdAndUpdate(
            documentId,
            { extractedText: text, chunks: chunks, status: "ready", lastAccessed: new Date() },
            { new: true }
        );

        console.log(`Document ${documentId} Processed Successfully`);

        // 2. Ready Notification
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

        // 3. Failed Notification
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

// Get All Documents
const getDocuments = async (req, res) => {
    try {
        const documents = await documentModel.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
            { $lookup: { from: "flashcards", localField: "_id", foreignField: "documentId", as: "flashcardSets" } },
            { $lookup: { from: "quizzes", localField: "_id", foreignField: "documentId", as: "quizzes" } },
            { $addFields: { flashcardCount: { $size: "$flashcardSets" }, quizCount: { $size: "$quizzes" } } },
            { $project: { extractedText: 0, chunks: 0, flashcardSets: 0, quizzes: 0 } },
            { $sort: { uploadDate: -1 } }
        ]);

        return res.status(200).json({ success: true, count: documents.length, data: documents });
    } catch (error) {
        console.error("Get Documents Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch documents" });
    }
};

// Get Single Document With Counts
const getSingleDocument = async (req, res) => {
    try {
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

// Delete Document
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: "Document ID is required" });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Document ID" });

        const document = await documentModel.findOne({ _id: id, userId: req.user._id });
        if (!document) return res.status(404).json({ success: false, message: "Document Not Found" });

        let fileName = null;
        try {
            const fileUrl = new URL(document.filePath);
            fileName = path.basename(fileUrl.pathname);
        } catch (error) {
            console.log("Invalid file URL:", document.filePath);
        }

        if (fileName) {
            const filePath = path.join(__dirname, "../uploads/documents", fileName);
            try {
                await fs.unlink(filePath);
                console.log(`File deleted successfully: ${fileName}`);
            } catch (fileError) {
                if (fileError.code !== "ENOENT") console.error("File Delete Error:", fileError);
            }
        }

        await Promise.all([
            flashcardModel.deleteMany({ documentId: document._id, userId: req.user._id }),
            quizModel.deleteMany({ documentId: document._id, userId: req.user._id }),
            chatModel.deleteMany({ documentId: document._id, userId: req.user._id })
        ]);

        await document.deleteOne();

        // 4. Delete Notification
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

// Update Document
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

        // 5. Update Notification
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