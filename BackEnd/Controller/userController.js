const userModel = require('../Model/userModel');
const cloudinary = require('../Utilities/cloudnary');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../Utilities/sendEmail');
const { createNotification } = require('./notificationController');

const secretKey = process.env.JWT_SECRET;

// Send OTP for Registration
const sendOTP = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        if (!userName || !email || !password) {
            return res.status(400).json({ message: "UserName, email and password are required" });
        }

        const trimUserName = userName.trim();
        const trimEmail = email.trim().toLowerCase();

        if (trimUserName.length < 3 || trimUserName.length > 30) {
            return res.status(400).json({ message: "UserName must be between 3 and 30 characters" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimEmail)) {
            return res.status(400).json({ message: "Please enter a valid email" });
        }

        if (password.length < 6 || password.length > 50) {
            return res.status(400).json({ message: "Password must be between 6 and 50 characters" });
        }

        const existUser = await userModel.findOne({ email: trimEmail });
        if (existUser) {
            if (existUser.isVerified) {
                return res.status(409).json({ message: "Email already exists" });
            }
            await userModel.findByIdAndDelete(existUser._id);
        }

        let profileImage = null;
        if (req.file) {

            const allowedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp'
            ];

            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    message: "Only JPG, JPEG, PNG and WEBP images are allowed"
                });
            }

            if (req.file.size > 512 * 1024) {
                return res.status(400).json({
                    message: "Image size must not exceed 512 KB"
                });
            }

            const uploadResult = await cloudinary.uploader.upload(
                req.file.path,
                {
                    folder: 'users',
                    resource_type: 'image'
                }
            );

            profileImage = uploadResult.secure_url;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpireAt = new Date(Date.now() + 5 * 60 * 1000);
        const hashPassword = await bcrypt.hash(password, 10);

        await userModel.create({
            userName: trimUserName,
            email: trimEmail,
            password: hashPassword,
            profileImage,
            otp,
            otpExpireAt,
            isVerified: false
        });

        const htmlTemplate = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a; margin: 0;">
            <div style="max-width: 450px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="background-color: #ecfdf5; color: #059669; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; border: 1px solid #d1fae5; display: inline-block;">
                        ✨ AI Learning Platform
                    </span>
                </div>
                <h1 style="font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 8px; color: #0f172a;">Verify your email</h1>
                <p style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 32px; line-height: 1.5;">
                    Hello <strong>${trimUserName}</strong>,<br>Enter the code below to complete your registration.
                </p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                    <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 0; margin-bottom: 12px;">Your OTP Code</p>
                    <div style="font-size: 22px; font-weight: 700; letter-spacing: 8px; color: #10b981;">${otp}</div>
                </div>
                <div style="text-align: center; color: #64748b; font-size: 14px;">
                    <p style="margin-bottom: 8px;">This code will expire in <strong style="color: #0f172a;">5 minutes</strong>.</p>
                    <p style="font-size: 12px; margin-top: 24px; color: #94a3b8;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>
        </div>`;

        await sendEmail(trimEmail, "Verify your email - AI Learning Platform", htmlTemplate);

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.log("Send OTP Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });
        if (!/^\d{6}$/.test(otp.toString())) return res.status(400).json({ message: "OTP must be 6 digits" });

        const trimEmail = email.trim().toLowerCase();
        const user = await userModel.findOne({ email: trimEmail, isVerified: false });

        if (!user) return res.status(404).json({ message: "User not found or already verified" });

        if (user.otpExpireAt < new Date()) {
            await userModel.findByIdAndDelete(user._id);
            return res.status(400).json({ message: "OTP expired. Please signup again." });
        }

        if (user.otp !== otp.toString()) return res.status(400).json({ message: "Invalid OTP" });

        user.isVerified = true;
        user.otp = null;
        user.otpExpireAt = null;
        await user.save();

        const userData = user.toObject();
        delete userData.password;

        return res.status(200).json({ message: "Email verified successfully", data: userData });
    } catch (error) {
        console.log("Verify OTP Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const trimEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) return res.status(400).json({ message: "Please enter a valid email" });
        if (password.length < 6 || password.length > 50) return res.status(400).json({ message: "Password length is invalid" });

        const checkEmail = await userModel.findOne({ email: trimEmail });
        if (!checkEmail) return res.status(404).json({ message: "Email Not Found" });

        const match = await bcrypt.compare(password, checkEmail.password);
        if (!match) return res.status(401).json({ message: "Invalid Email or Password" });

        const token = jwt.sign({ id: checkEmail._id, email: checkEmail.email }, secretKey, { expiresIn: '7d' });

        const userData = checkEmail.toObject();
        delete userData.password;

        return res.status(200).json({ message: "Login successfully", token, data: userData });
    } catch (error) {
        console.log("Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const trimEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) return res.status(400).json({ message: "Please enter a valid email" });

        const user = await userModel.findOne({ email: trimEmail, isVerified: true });
        if (!user) return res.status(404).json({ message: "Email not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpireAt = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        const resetHtmlTemplate = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a; margin: 0;">
            <div style="max-width: 450px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="background-color: #ecfdf5; color: #059669; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; border: 1px solid #d1fae5; display: inline-block;">
                        🔒 Password Reset
                    </span>
                </div>
                <h1 style="font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 8px; color: #0f172a;">Reset your password</h1>
                <p style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 32px; line-height: 1.5;">
                    We received a request to reset your password. Use the code below to proceed.
                </p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                    <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 0; margin-bottom: 12px;">Your OTP Code</p>
                    <div style="font-size: 22px; font-weight: 700; letter-spacing: 8px; color: #10b981;">${otp}</div>
                </div>
                <div style="text-align: center; color: #64748b; font-size: 14px;">
                    <p style="margin-bottom: 8px;">This code will expire in <strong style="color: #0f172a;">5 minutes</strong>.</p>
                    <p style="font-size: 12px; margin-top: 24px; color: #94a3b8;">If you didn't request a password reset, you can safely ignore this email.</p>
                </div>
            </div>
        </div>`;

        await sendEmail(trimEmail, "Password Reset Request - AI Learning Platform", resetHtmlTemplate);
        return res.status(200).json({ message: "Password reset OTP sent successfully" });
    } catch (error) {
        console.log("Forgot Password Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Verify Forgot Password OTP
const verifyForgotOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });
        if (!/^\d{6}$/.test(otp.toString())) return res.status(400).json({ message: "OTP must be 6 digits" });

        const user = await userModel.findOne({ email: email.trim().toLowerCase(), isVerified: true });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.otp || !user.otpExpireAt) return res.status(400).json({ message: "OTP not found. Please request a new OTP." });
        if (user.otpExpireAt < new Date()) {
            user.otp = null;
            user.otpExpireAt = null;
            await user.save();
            return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
        }
        if (user.otp !== otp.toString()) return res.status(400).json({ message: "Invalid OTP" });

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.log("Verify Forgot OTP Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) return res.status(400).json({ message: "Email, password and confirm password are required" });
        if (password.length < 6 || password.length > 50) return res.status(400).json({ message: "Password must be between 6 and 50 characters" });
        if (password !== confirmPassword) return res.status(400).json({ message: "Password and confirm password do not match" });

        const user = await userModel.findOne({ email: email.trim().toLowerCase(), isVerified: true });
        if (!user) return res.status(404).json({ message: "User not found" });

        user.password = await bcrypt.hash(password, 10);
        user.otp = null;
        user.otpExpireAt = null;
        await user.save();

        // Send Notification
        await createNotification({
            userId: user._id,
            title: "Password Reset",
            message: "Your account password was reset successfully.",
            type: "password"
        });

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.log("Reset Password Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get Profile
const getProfile = async (req, res) => {
    try {
        if (!req.user || !req.user._id) return res.status(401).json({ success: false, message: "Unauthorized user" });

        const user = await userModel.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { userName, email } = req.body;

        if (!req.user || !req.user._id) return res.status(401).json({ success: false, message: "Unauthorized user" });
        if (userName === undefined && email === undefined && !req.file) {
            return res.status(400).json({ success: false, message: "Please provide at least one field to update" });
        }

        const user = await userModel.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (userName !== undefined) {
            if (typeof userName !== "string") return res.status(400).json({ success: false, message: "Username must be a string" });
            const trimmedUserName = userName.trim();
            if (!trimmedUserName || trimmedUserName.length < 3) return res.status(400).json({ success: false, message: "Username must be at least 3 characters" });
            user.userName = trimmedUserName;
        }

        if (email !== undefined) {
            if (typeof email !== "string") return res.status(400).json({ success: false, message: "Email must be a string" });
            const trimmedEmail = email.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return res.status(400).json({ success: false, message: "Please provide a valid email" });

            const existingUser = await userModel.findOne({ email: trimmedEmail, _id: { $ne: req.user._id } });
            if (existingUser) return res.status(409).json({ success: false, message: "Email already exists" });

            user.email = trimmedEmail;
        }

        if (req.file) user.profileImage = `/uploads/profile/${req.file.filename}`;

        await user.save();

        // Send Notification
        await createNotification({
            userId: req.user._id,
            title: "Profile Updated",
            message: "Your profile information was updated successfully.",
            type: "profile"
        });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                profileImage: user.profileImage,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        if (error.code === 11000) return res.status(409).json({ success: false, message: "Email already exists" });
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!req.user || !req.user._id) return res.status(401).json({ success: false, message: "Unauthorized user" });
        if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Current password and new password are required" });
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

        const user = await userModel.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ success: false, message: "Current password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        // Send Notification
        await createNotification({
            userId: req.user._id,
            title: "Password Changed",
            message: "Your account password was changed successfully.",
            type: "password"
        });

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    loginUser,
    forgotPassword,
    verifyForgotOTP,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword
};