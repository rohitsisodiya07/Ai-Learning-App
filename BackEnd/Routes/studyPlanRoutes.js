const express = require("express");

const router = express.Router();

const studyPlanController = require("../Controller/studyPlanController");
const auth = require("../Middleware/authMiddleware");

// ==========================================
// GENERATE STUDY PLAN
// ==========================================

router.post(
    "/generate",
    auth,
    studyPlanController.createStudyPlan
);

// ==========================================
// GET ALL MY STUDY PLANS
// ==========================================

router.get(
    "/",
    auth,
    studyPlanController.getMyStudyPlans
);

// ==========================================
// STUDY DASHBOARD
// IMPORTANT: MUST BE BEFORE /:id
// ==========================================

router.get(
    "/dashboard",
    auth,
    studyPlanController.studyDashboard
);

router.get(
    "/dashboard/export",
    auth,
    studyPlanController.exportStudyDashboard
);
// ==========================================
// GET SINGLE STUDY PLAN
// ==========================================

router.get(
    "/:id",
    auth,
    studyPlanController.getStudyPlanById
);

// ==========================================
// COMPLETE STUDY DAY
// ==========================================

router.patch(
    "/:planId/day/:dayNumber",
    auth,
    studyPlanController.completeStudyDay
);

// ==========================================
// GENERATE STUDY PLAN FLASHCARDS
// ==========================================

router.post(
    "/:planId/day/:dayNumber/flashcards",
    auth,
    studyPlanController.generateStudyPlanFlashcards
);

// ==========================================
// GENERATE STUDY PLAN QUIZ
// ==========================================

router.post(
    "/:planId/day/:dayNumber/quiz",
    auth,
    studyPlanController.generateStudyPlanQuiz
);

// ==========================================
// SUBMIT STUDY PLAN QUIZ
// ==========================================

router.patch(
    "/quiz/:quizId/submit",
    auth,
    studyPlanController.submitStudyPlanQuiz
);

// ==========================================
// GET STUDY PLAN QUIZ RESULT
// ==========================================

router.get(
    "/quiz/:quizId/results",
    auth,
    studyPlanController.getStudyPlanQuizResult
);

// ==========================================
// REVIEW STUDY PLAN FLASHCARD
// ==========================================

router.patch(
    "/flashcards/:flashcardId/review/:cardId",
    auth,
    studyPlanController.reviewStudyPlanFlashcard
);

module.exports = router;