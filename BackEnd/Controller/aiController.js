const mongoose = require("mongoose");
const documentModel = require('../Model/documentModel');
const flashcardModel = require('../Model/flashcardModel');
const quizModel = require('../Model/quizModel');
const chatModel = require('../Model/chatHistory');
const { generateFlashcards, generateQuiz, generateSummary, chatWithContext, explainConcept } = require('../Utilities/geminiService');
const { findRelevantChunks } = require('../Utilities/textChunker');
const { createNotification } = require('./notificationController');

const generateFlashcardsFromDocument = async (req, res) => {
    try {
        const { documentId, count = 10 } = req.body;

        if (!documentId) {
            return res.status(400).json({ success: false, message: "Document ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({ success: false, message: "Invalid Document ID format" });
        }

        const parsedCount = parseInt(count, 10);
        if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50) {
            return res.status(400).json({ success: false, message: "Count must be a valid number between 1 and 50" });
        }

        const document = await documentModel.findOne({ _id: documentId, userId: req.user._id, status: "ready" });
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found or not ready" });
        }

        const cards = await generateFlashcards(document.extractedText, parsedCount);

        const flashcardSet = await flashcardModel.create({
            userId: req.user._id,
            documentId: document._id,
            cards: cards.map((card) => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount: 0,
                isStarred: false
            }))
        });

        await createNotification({
            userId: req.user._id,
            title: "Flashcards Generated",
            message: "New flashcards have been generated from your document.",
            type: "flashcard",
            relatedId: document._id
        });

        return res.status(201).json({
            success: true,
            message: "Flashcards generated successfully",
            data: flashcardSet
        });
    } catch (error) {
        console.error("Generate Flashcards Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to generate flashcards" });
    }
};

const generateQuizFromDocuments = async (req, res) => {
    try {
        const { documentId, numQuestions = 5, title, questionType = "mixed" } = req.body;

        if (!documentId) {
            return res.status(400).json({ success: false, message: "Document ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({ success: false, message: "Invalid Document ID format" });
        }
        if (title && typeof title !== 'string') {
            return res.status(400).json({ success: false, message: "Title must be a valid string" });
        }

        const allowedTypes = ["mcq", "true_false", "short_answer", "mixed"];
        if (!allowedTypes.includes(questionType)) {
            return res.status(400).json({ success: false, message: "Invalid question type provided" });
        }

        const questionCount = parseInt(numQuestions, 10);
        if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
            return res.status(400).json({ success: false, message: "Number of questions must be a valid number between 1 and 50" });
        }

        const document = await documentModel.findOne({ _id: documentId, userId: req.user._id, status: "ready" });
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found or not ready" });
        }

        const questions = await generateQuiz(document.extractedText, questionCount, questionType);
        if (!questions || questions.length === 0) {
            return res.status(400).json({ success: false, message: "Failed to generate questions from document" });
        }

        const quiz = await quizModel.create({
            userId: req.user._id,
            documentId: document._id,
            title: title?.trim() || `${document.title} - Quiz`,
            questions,
            totalQuestions: questions.length,
            userAnswers: [],
            score: 0,
            questionType
        });

        await createNotification({
            userId: req.user._id,
            title: "Quiz Generated",
            message: `"${quiz.title}" has been generated successfully.`,
            type: "quiz",
            relatedId: document._id
        });

        return res.status(201).json({
            success: true,
            message: "Quiz generated successfully",
            data: quiz
        });
    } catch (error) {
        console.error("Generate Quiz Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to generate quiz" });
    }
};

const generateDocumentSummary = async (req, res) => {
    try {
        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({ success: false, message: "Document ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({ success: false, message: "Invalid Document ID format" });
        }

        const document = await documentModel.findOne({ _id: documentId, userId: req.user._id, status: "ready" });
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found or not ready" });
        }

        if (!document.extractedText || document.extractedText.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Document does not contain any extracted text" });
        }

        const summary = await generateSummary(document.extractedText);

        await createNotification({
            userId: req.user._id,
            title: "Summary Generated",
            message: "Your document summary has been generated successfully.",
            type: "summary",
            relatedId: document._id
        });

        return res.status(200).json({
            success: true,
            message: "Document summary generated successfully",
            documentId: document._id,
            title: document.title,
            summary
        });
    } catch (error) {
        console.error("Generate Summary Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to generate summary" });
    }
};

const chat = async (req, res) => {
    try {
        const { documentId, question } = req.body;

        if (!documentId) {
            return res.status(400).json({ success: false, message: "Document ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({ success: false, message: "Invalid document ID format" });
        }
        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, message: "A valid question string is required" });
        }

        const document = await documentModel.findOne({ _id: documentId, userId: req.user._id });
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        if (document.status !== "ready") {
            return res.status(400).json({ success: false, message: `Document is not ready. Current status: ${document.status}` });
        }

        if (!document.chunks || document.chunks.length === 0) {
            return res.status(400).json({ success: false, message: "Document does not contain any text chunks" });
        }

        const relevantChunks = findRelevantChunks(document.chunks, question, 3);
        const chunkIndices = relevantChunks.map(chunk => chunk.chunkIndex);

        let chatHistory = await chatModel.findOne({ userId: req.user._id, documentId: document._id });
        if (!chatHistory) {
            chatHistory = await chatModel.create({
                userId: req.user._id,
                documentId: document._id,
                messages: []
            });
        }

        const answer = await chatWithContext(question.trim(), relevantChunks);

        chatHistory.messages.push({
            role: "user",
            content: question.trim(),
            timestamp: new Date(),
            relevantChunks: []
        });

        chatHistory.messages.push({
            role: "assistant",
            content: answer,
            timestamp: new Date(),
            relevantChunks: chunkIndices
        });

        await chatHistory.save();

        return res.status(200).json({
            success: true,
            message: "Answer generated successfully",
            data: {
                question: question.trim(),
                answer,
                relevantChunks: chunkIndices
            }
        });
    } catch (error) {
        console.error("Chat Error:", error);
        return res.status(500).json({ success: false, message: "Failed to process chat request", error: error.message });
    }
};

const explainDocumentConcept = async (req, res) => {
    try {
        const { documentId, concept } = req.body;

        if (!documentId) {
            return res.status(400).json({ success: false, message: "Document ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({ success: false, message: "Invalid Document ID format" });
        }
        if (!concept || typeof concept !== 'string' || !concept.trim()) {
            return res.status(400).json({ success: false, message: "A valid concept string is required" });
        }

        const document = await documentModel.findOne({ _id: documentId, userId: req.user._id, status: "ready" });
        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found or not ready" });
        }

        if (!document.chunks || document.chunks.length === 0) {
            return res.status(400).json({ success: false, message: "Document does not contain any text chunks" });
        }

        const relevantChunks = findRelevantChunks(document.chunks, concept, 3);
        if (relevantChunks.length === 0) {
            return res.status(404).json({ success: false, message: "Could not find relevant information about this concept" });
        }

        const context = relevantChunks.map(chunk => chunk.content).join("\n\n");
        const explanation = await explainConcept(concept, context);

        return res.status(200).json({
            success: true,
            message: "Concept explained successfully",
            data: {
                concept,
                explanation,
                relevantChunks: relevantChunks.map(chunk => chunk.chunkIndex)
            }
        });
    } catch (error) {
        console.error("Explain Concept Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to explain concept" });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({ success: false, message: "Document ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({ success: false, message: "Invalid Document ID format" });
        }

        const chatHistory = await chatModel
            .findOne({ userId: req.user._id, documentId: documentId })
            .select("messages");

        if (!chatHistory) {
            return res.status(200).json({ success: true, message: "No chat history found", data: [] });
        }

        return res.status(200).json({
            success: true,
            message: "Chat history fetched successfully",
            data: chatHistory.messages
        });
    } catch (error) {
        console.error("Get Chat History Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch chat history" });
    }
};

module.exports = {
    generateFlashcardsFromDocument,
    generateQuizFromDocuments,
    generateDocumentSummary,
    chat,
    explainDocumentConcept,
    getChatHistory
};