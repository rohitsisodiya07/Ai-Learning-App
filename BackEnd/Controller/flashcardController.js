const mongoose = require('mongoose');
const flashcardModel = require('../Model/flashcardModel');
const { createNotification } = require('../Controller/notificationController');

const getFlashCards = async (req, res) => {
    try {
        const { documentId } = req.params;

        const {
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 6
        } = req.query;

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        const filter = {
            userId: new mongoose.Types.ObjectId(req.user._id),
            documentId: new mongoose.Types.ObjectId(documentId)
        };

        if (search.trim()) {
            filter.$or = [
                { "cards.question": { $regex: search.trim(), $options: "i" } },
                { "cards.answer": { $regex: search.trim(), $options: "i" } }
            ];
        }

        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const stats = await flashcardModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalSets: { $sum: 1 },
                    totalCards: {
                        $sum: {
                            $cond: [{ $isArray: "$cards" }, { $size: "$cards" }, 0]
                        }
                    }
                }
            }
        ]);

        const totalSets = stats.length > 0 ? stats[0].totalSets : 0;
        const totalCards = stats.length > 0 ? stats[0].totalCards : 0;

        const flashcards = await flashcardModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean();

        const totalPages = Math.ceil(totalSets / limitNumber);

        return res.status(200).json({
            success: true,
            message: "Flashcards fetched successfully",
            data: flashcards,
            totalCards,
            pagination: {
                total: totalSets,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        });
    } catch (error) {
        console.error("Get Flashcards Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch flashcards" });
    }
};

const getAllFlashCards = async (req, res) => {
    try {
        const { sortBy = "createdAt", sortOrder = "desc", page = 1, limit = 6 } = req.query;

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        const filter = { userId: new mongoose.Types.ObjectId(req.user._id) };
        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const stats = await flashcardModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalSets: { $sum: 1 },
                    totalCards: {
                        $sum: {
                            $cond: [{ $isArray: "$cards" }, { $size: "$cards" }, 0]
                        }
                    }
                }
            }
        ]);

        const totalSets = stats.length > 0 ? stats[0].totalSets : 0;
        const totalCards = stats.length > 0 ? stats[0].totalCards : 0;

        const flashcardSets = await flashcardModel
            .find({ userId: req.user._id })
            .populate('documentId', 'title fileName')
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean();

        const totalPages = Math.ceil(totalSets / limitNumber);

        return res.status(200).json({
            success: true,
            message: "Flashcards fetched successfully",
            data: flashcardSets,
            totalCards,
            pagination: {
                total: totalSets,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        });
    } catch (error) {
        console.error("Get All Flashcards Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch flashcards" });
    }
};

const reviewFlashCard = async (req, res) => {
    try {
        const { cardId } = req.params;

        if (!cardId) return res.status(400).json({ success: false, message: "Card ID is required" });
        if (!mongoose.Types.ObjectId.isValid(cardId)) return res.status(400).json({ success: false, message: "Invalid Card ID" });

        const flashcardSet = await flashcardModel.findOne({ "cards._id": cardId, userId: req.user._id });
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

const toggleStarFlashCard = async (req, res) => {
    try {
        const { cardId } = req.params;

        if (!cardId) return res.status(400).json({ success: false, message: "Card ID is required" });
        if (!mongoose.Types.ObjectId.isValid(cardId)) return res.status(400).json({ success: false, message: "Invalid Card ID" });

        const flashcardSet = await flashcardModel.findOne({ "cards._id": cardId, userId: req.user._id });
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

const deleteFlashCardSet = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId) return res.status(400).json({ success: false, message: "Document ID is required" });
        if (!mongoose.Types.ObjectId.isValid(documentId)) return res.status(400).json({ success: false, message: "Invalid Document ID" });

        const flashcardSet = await flashcardModel.findOne({ documentId, userId: req.user._id });
        if (!flashcardSet) return res.status(404).json({ success: false, message: "Flashcard Set not found" });

        const relatedDocumentId = flashcardSet.documentId;
        await flashcardSet.deleteOne();

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