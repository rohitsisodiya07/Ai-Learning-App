const express = require('express');

const router = express.Router();

const progressController = require('../Controller/progressController');

const auth = require('../Middleware/authMiddleware');

router.get('/dashboard', auth, progressController.getDashBoard)

router.get('/dashboard/export', auth, progressController.exportDashboard)

router.get('/weakTopics', auth, progressController.getWeakTopics)

router.post("/weakTopics/practice", auth, progressController.generateWeakTopicPractice);

router.post("/weakTopics/practiceQuiz", auth, progressController.generateWeakTopicQuiz);

router.get("/streak", auth, progressController.getStudyStreak);

router.get("/weakTopicImprovement", auth, progressController.getWeakTopicImprovement);

module.exports = router;