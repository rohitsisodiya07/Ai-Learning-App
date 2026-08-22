const mongoose = require('mongoose');
const flashcardModel = require('../Model/flashcardModel');
const { createNotification } = require('../Controller/notificationController');

// Get Flashcards for a specific document
const getFlashCards = async (req, res) => {
    try {
        const { documentId } = req.params;

        console.log("Document ID:", documentId);
        console.log("Logged User ID:", req.user._id);

        const flashcards = await flashcardModel.find({
            userId: req.user._id,
            documentId: documentId
        }).sort({ createdAt: -1 });

        console.log("Flashcard Sets Found:", flashcards.length);

        if (!flashcards || flashcards.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        return res.status(200).json({
            success: true,
            message: "Flashcards fetched successfully",
            count: flashcards.length,
            data: flashcards
        });
    } catch (error) {
        console.error("Get Flashcards Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch flashcards" });
    }
};

// Get All Flashcards across all documents
const getAllFlashCards = async (req, res) => {
    try {
        const flashcardSets = await flashcardModel
            .find({ userId: req.user._id })
            .populate('documentId', 'title')
            .sort({ createdAt: -1 });

        const totalCards = flashcardSets.reduce((total, set) => total + set.cards.length, 0);

        return res.status(200).json({
            success: true,
            message: "Flashcards fetched successfully",
            count: totalCards,
            data: flashcardSets
        });
    } catch (error) {
        console.error("Get All Flashcards Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch flashcards" });
    }
};

// Review Flashcard
const reviewFlashCard = async (req, res) => {
    try {
        const { cardId } = req.params;

        if (!cardId) return res.status(400).json({ success: false, message: "Card ID is required" });
        if (!mongoose.Types.ObjectId.isValid(cardId)) return res.status(400).json({ success: false, message: "Invalid Card ID" });

        const flashcardSet = await flashcardModel.findOne({
            "cards._id": cardId,
            userId: req.user._id
        });

        if (!flashcardSet) return res.status(404).json({ success: false, message: "Flashcard not found" });

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === cardId);
        if (cardIndex === -1) return res.status(404).json({ success: false, message: "Card not found in set" });

        flashcardSet.cards[cardIndex].lastReviewed = new Date();
        flashcardSet.cards[cardIndex].reviewCount = (flashcardSet.cards[cardIndex].reviewCount || 0) + 1;

        await flashcardSet.save();

        return res.status(200).json({
            success: true,
            message: "Flashcard reviewed successfully",
            data: flashcardSet.cards[cardIndex]
        });
    } catch (error) {
        console.error("Review Flashcard Error:", error);
        return res.status(500).json({ success: false, message: "Failed to review flashcard" });
    }
};

// Toggle Star/Favorite Flashcard
const toggleStarFlashCard = async (req, res) => {
    try {
        const { cardId } = req.params;

        if (!cardId) return res.status(400).json({ success: false, message: "Card ID is required" });
        if (!mongoose.Types.ObjectId.isValid(cardId)) return res.status(400).json({ success: false, message: "Invalid Card ID" });

        const flashcardSet = await flashcardModel.findOne({
            "cards._id": cardId,
            userId: req.user._id
        });

        if (!flashcardSet) return res.status(404).json({ success: false, message: "Flashcard not found" });

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === cardId);
        if (cardIndex === -1) return res.status(404).json({ success: false, message: "Card not found in set" });

        flashcardSet.cards[cardIndex].isStarred = !flashcardSet.cards[cardIndex].isStarred;

        await flashcardSet.save();

        return res.status(200).json({
            success: true,
            message: flashcardSet.cards[cardIndex].isStarred ? "Flashcard added to favorites" : "Flashcard removed from favorites",
            data: flashcardSet.cards[cardIndex]
        });
    } catch (error) {
        console.error("Toggle Star Flashcard Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update flashcard favorite" });
    }
};

// Delete Flashcard Set
const deleteFlashCardSet = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) return res.status(400).json({ success: false, message: "Document ID is required" });
        if (!mongoose.Types.ObjectId.isValid(documentId)) return res.status(400).json({ success: false, message: "Invalid Document ID" });

        const flashcardSet = await flashcardModel.findOne({
            documentId,
            userId: req.user._id
        });

        if (!flashcardSet) return res.status(404).json({ success: false, message: "Flashcard Set not found" });

        const relatedDocumentId = flashcardSet.documentId;
        await flashcardSet.deleteOne();

        // Create Notification
        await createNotification({
            userId: req.user._id,
            title: "Flashcards Deleted",
            message: "Flashcard set was deleted successfully.",
            type: "flashcard",
            relatedId: relatedDocumentId
        });

        return res.status(200).json({ success: true, message: "Flashcard Set deleted successfully" });
    } catch (error) {
        console.error("Delete Flashcard Set Error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete flashcard set" });
    }
};

module.exports = {
    getFlashCards,
    getAllFlashCards,
    reviewFlashCard,
    toggleStarFlashCard,
    deleteFlashCardSet
};