const mongoose = require("mongoose");
const notificationModel = require("../Model/notificationModel");

const createNotification = async ({ userId, title, message, type = "system", relatedId = null }) => {
    try {
        if (!userId || !title || !message) {
            console.log("Notification data is missing");
            return null;
        }

        const notification = await notificationModel.create({
            userId,
            title,
            message,
            type,
            relatedId
        });

        return notification;
    } catch (error) {
        console.error("Create Notification Error:", error);
        return null;
    }
};

const getNotifications = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized user" });
        }

        const notifications = await notificationModel
            .find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await notificationModel.countDocuments({
            userId: req.user._id,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            unreadCount,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: "Notification ID is required" });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid notification ID" });

        const notification = await notificationModel.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        console.error("Mark Notification Read Error:", error);
        return res.status(500).json({ success: false, message: "Failed to mark notification as read" });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized user" });
        }

        const result = await notificationModel.updateMany(
            { userId: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Mark All Notifications Read Error:", error);
        return res.status(500).json({ success: false, message: "Failed to mark all notifications as read" });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
};