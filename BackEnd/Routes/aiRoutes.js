const express = require('express');

const router = express.Router();

const aiController = require('../Controller/aiController');
const auth = require('../Middleware/authMiddleware')

router.post('/generate', auth, aiController.generateFlashcardsFromDocument)

router.post('/generateQuiz', auth, aiController.generateQuizFromDocuments)

router.post('/summary', auth, aiController.generateDocumentSummary)

router.post('/chat', auth, aiController.chat)

router.post('/explain', auth, aiController.explainDocumentConcept)

router.get("/chat/:documentId", auth, aiController.getChatHistory);

module.exports = router;