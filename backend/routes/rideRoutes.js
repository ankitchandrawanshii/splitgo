const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createRide, getRide, cancelRide, getUserRides, rateRide, triggerSOS } = require('../controllers/rideController');

router.get('/', protect, getUserRides);
router.post('/', protect, createRide);
router.get('/:id', protect, getRide);
router.patch('/:id/cancel', protect, cancelRide);
router.post('/:id/rate', protect, rateRide);
router.post('/:id/sos', protect, triggerSOS);

module.exports = router;
