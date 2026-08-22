const express = require('express');
const router = express.Router();

const userController = require('../Controller/userController');
// const upload = require('../Middleware/multer')
const profileUpload = require('../Middleware/profileMulter')
const auth = require('../Middleware/authMiddleware')

router.post('/sendOTP', profileUpload.single("profileImage"), userController.sendOTP);

router.post('/verifyOTP', userController.verifyOTP);

router.post('/login', userController.loginUser);

router.post('/forgotPassword', userController.forgotPassword);

router.post('/verifyForgotPassword', userController.verifyForgotOTP);

router.post('/resetPassword', userController.resetPassword);

router.get('/profile', auth, userController.getProfile)

router.patch('/updateProfile', auth, profileUpload.single("profileImage"), userController.updateProfile)

router.patch("/changePassword", auth, userController.changePassword);

module.exports = router;