const express = require('express');

const router = express.Router();

const flashcardController = require('../Controller/flashcardController');
const auth = require('../Middleware/authMiddleware');

// Get all flashcard sets
router.get(
    '/',
    auth,
    flashcardController.getAllFlashCards
);

// Get flashcards of a particular document
router.get(
    '/document/:documentId',
    auth,
    flashcardController.getFlashCards
);

// Review a flashcard
router.patch(
    '/:cardId/review',
    auth,
    flashcardController.reviewFlashCard
);

// Toggle favorite/star
router.patch(
    '/:cardId/star',
    auth,
    flashcardController.toggleStarFlashCard
);

// Delete complete flashcard set
router.delete(
    '/:documentId',
    auth,
    flashcardController.deleteFlashCardSet
);
module.exports = router;