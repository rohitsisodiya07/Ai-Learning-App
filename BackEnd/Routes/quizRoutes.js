const express = require('express');
const router = express.Router();
const quizController = require('../Controller/quizController');
const auth = require('../Middleware/authMiddleware');

// Get all quizzes for a document
router.get('/document/:documentId', auth, quizController.getQuizzes);

// Get quiz by ID
router.get('/:id', auth, quizController.getQuizId);

// Submit quiz
router.post('/:id/submit', auth, quizController.submitQuiz);

// Get quiz results
router.get('/:id/results', auth, quizController.getQuizResults);

// Delete quiz
router.delete('/:id', auth, quizController.deleteQuiz);

module.exports = router;