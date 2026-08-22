const documentModel = require('../Model/documentModel');
const flashcardModel = require('../Model/flashcardModel');
const quizModel = require('../Model/quizModel');
const chatModel = require('../Model/chatHistory');
const { extractTextFromPDF } = require('../Utilities/pdfParse');
const { chunkText } = require('../Utilities/textChunker');
const mongoose = require('mongoose');
const path = require('path');
const { createNotification } = require('../Controller/notificationController');
const cloudinary = require('../Utilities/cloudnary'); // Aapki cloudinary config

// Helper function to upload buffer to Cloudinary using stream
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
    console.log("🔥 UPLOAD DOCUMENT CONTROLLER HIT");

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

        // 1. Upload PDF buffer directly to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        const fileUrl = cloudinaryResult.secure_url;

        const document = await documentModel.create({
            userId: req.user._id,
            title: title.trim(),
            fileName: req.file.originalname,
            filePath: fileUrl, // 👈 Permanent Cloudinary URL
            fileSize: req.file.size,
            status: "processing"
        });

        // Upload Notification
        await createNotification({
            userId: req.user._id,
            title: "Document Uploaded",
            message: `"${document.title}" has been uploaded successfully.`,
            type: "document",
            relatedId: document._id
        });

        // Note: For pdfParse library, if it requires a physical file path, 
        // you can pass the cloudinary URL directly or use pdf-parse with buffer if supported.
        // Assuming extractTextFromPDF can handle remote URLs or buffers, or we pass fileUrl.
        processPDF(document._id, fileUrl).catch(error => {
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

        // Optional: Cloudinary se bhi file delete karne ka code yahan likh sakte hain agar public_id extract karein
        // Lekin filhal database aur related models clean kar rahe hain

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