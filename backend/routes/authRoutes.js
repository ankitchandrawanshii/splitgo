const express = require('express');
const router = express.Router();
const { register, login, sendOTP, verifyOTP, getMe, updateProfile, changePassword } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
