const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            trim: true
        },

        profileImage: {
            type: String,
            default: null
        },
        otp: {
            type: String,
            default: null
        },
        otpExpireAt: {
            type: Date,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const userModel = mongoose.model('userSignup', userSchema);

module.exports = userModel;