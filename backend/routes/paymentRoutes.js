const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const protect = require('../middleware/authMiddleware');

// Protected payment endpoints
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
