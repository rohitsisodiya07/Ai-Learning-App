const express = require("express");

const router = express.Router();

const notificationController = require("../Controller/notificationController");

const auth = require("../Middleware/authMiddleware");


// Get notifications
router.get(
    "/",
    auth,
    notificationController.getNotifications
);


// Mark single notification as read
router.patch(
    "/:id/read",
    auth,
    notificationController.markAsRead
);


// Mark all notifications as read
router.patch(
    "/read-all",
    auth,
    notificationController.markAllAsRead
);


module.exports = router;