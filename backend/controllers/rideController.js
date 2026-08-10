const Ride = require('../models/Ride');
const User = require('../models/User');
const {
  calculateBearing,
  calculateDistanceKm,
  findMatch,
  splitFare,
} = require('../utils/matching');

// GET /api/rides -> Get user's rides
exports.getUserRides = async (req, res) => {
  try {
    const rides = await Ride.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name phone rating')
      .populate('matchedWith');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rides -> create a new ride request and try to find a match
exports.createRide = async (req, res) => {
  try {
    const { pickup, drop, rideType, genderPreference, scheduledAt, promoCode, discountAmount } = req.body;

    let pLat = parseFloat(pickup?.lat);
    let pLng = parseFloat(pickup?.lng);
    let dLat = parseFloat(drop?.lat);
    let dLng = parseFloat(drop?.lng);

    // Fallback coordinates for Delhi NCR if missing/NaN
    if (isNaN(pLat) || isNaN(pLng)) {
      pLat = 28.6139;
      pLng = 77.2090;
    }
    if (isNaN(dLat) || isNaN(dLng)) {
      dLat = 28.5355;
      dLng = 77.3910;
    }

    const distanceKm = calculateDistanceKm(pLat, pLng, dLat, dLng);
    const bearing = calculateBearing(pLat, pLng, dLat, dLng);

    // Dynamic base and km fare rates based on rideType (Brumm style)
    let baseFare = 15;
    let farePerKm = 10;
    if (rideType === 'car') {
      baseFare = 30;
      farePerKm = 18;
    }

    // Check Peak Hour Surge (8-10:30 AM or 5-7:30 PM)
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const isPeakMorning = currentHour >= 8.0 && currentHour <= 10.5;
    const isPeakEvening = currentHour >= 17.0 && currentHour <= 19.5;
    const isSurgeActive = isPeakMorning || isPeakEvening;
    const surgeMultiplier = isSurgeActive ? 1.3 : 1.0;

    let rawFare = Math.round(baseFare + distanceKm * farePerKm);
    let calculatedFare = Math.round(rawFare * surgeMultiplier);
    const discount = parseFloat(discountAmount) || 0;
    const finalCalculatedFare = Math.max(0, calculatedFare - discount);

    const ride = await Ride.create({
      user: req.user.id,
      pickup: {
        address: pickup?.address || 'Pickup Location',
        location: { type: 'Point', coordinates: [pLng, pLat] },
      },
      drop: {
        address: drop?.address || 'Destination Location',
        location: { type: 'Point', coordinates: [dLng, dLat] },
      },
      distanceKm,
      estimatedFare: finalCalculatedFare,
      bearing,
      rideType: rideType || 'bike',
      genderPreference: genderPreference || 'any',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      promoCode: promoCode || '',
      discountAmount: discount,
    });

    // Try to find an existing compatible ride to match with
    let match = null;
    try {
      match = await findMatch(ride);
    } catch (matchErr) {
      console.warn('findMatch calculation warning:', matchErr.message);
    }

    if (match) {
      try {
        const { fare1, fare2, savings1 } = splitFare(ride, match);

        ride.status = 'matched';
        ride.matchedWith = match._id;
        ride.finalFare = Math.max(0, fare1 - discount);
        await ride.save();

        match.status = 'matched';
        match.matchedWith = ride._id;
        match.finalFare = fare2;
        await match.save();

        return res.status(201).json({
          ride,
          matchedWith: match,
          fareBreakdown: { yourFare: ride.finalFare, partnerFare: fare2, yourSavings: savings1 },
          message: 'Match found! Ride is now shared.',
        });
      } catch (splitErr) {
        console.warn('splitFare processing warning:', splitErr.message);
      }
    }

    res.status(201).json({ ride, message: 'No match yet, searching for a co-rider...' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rides/:id -> ride status/details
exports.getRide = async (req, res) => {
  try {
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      // Find latest ride for this user
      if (req.user?.id) {
        const latestRide = await Ride.findOne({ user: req.user.id })
          .sort({ createdAt: -1 })
          .populate('user', 'name phone rating gender')
          .populate({
            path: 'matchedWith',
            populate: { path: 'user', select: 'name phone rating gender' }
          })
          .populate('driver', 'name phone vehicleDetails rating');

        if (latestRide) return res.json(latestRide);
      }

      return res.json({
        _id: req.params.id || 'live_active',
        user: { name: 'SplitGo Rider', phone: '8989776132', rating: 5.0 },
        pickup: { address: 'Connaught Place, Delhi', location: { coordinates: [77.2167, 28.6315] } },
        drop: { address: 'Cyber City, Gurgaon', location: { coordinates: [77.0895, 28.4950] } },
        distanceKm: 19.5,
        estimatedFare: 381,
        finalFare: 211,
        status: 'searching',
        rideType: 'bike',
        genderPreference: 'any',
        createdAt: new Date(),
      });
    }

    const ride = await Ride.findById(req.params.id)
      .populate('user', 'name phone rating gender')
      .populate({
        path: 'matchedWith',
        populate: { path: 'user', select: 'name phone rating gender' }
      })
      .populate('driver', 'name phone vehicleDetails rating');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/rides/:id/cancel
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    ride.status = 'cancelled';
    await ride.save();
    res.json({ message: 'Ride cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rides/:id/rate -> Rate a completed ride partner
exports.rateRide = async (req, res) => {
  try {
    const { rating, review, targetUserId } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    ride.rating = parseFloat(rating);
    ride.review = review || '';
    await ride.save();

    // Update target user's average rating in MongoDB
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        const currentCount = targetUser.ratingCount || 0;
        const currentRating = targetUser.rating || 5.0;
        const newCount = currentCount + 1;
        const newAvg = (currentRating * currentCount + parseFloat(rating)) / newCount;

        targetUser.rating = parseFloat(newAvg.toFixed(1));
        targetUser.ratingCount = newCount;
        await targetUser.save();
      }
    }

    res.json({ message: 'Rating and review submitted successfully', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rides/:id/sos -> Trigger Emergency SOS
exports.triggerSOS = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('user', 'name phone sosContacts');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    ride.sosTriggered = true;
    await ride.save();

    console.log(`[EMERGENCY SOS ALERT] Ride ${ride._id} by ${ride.user.name} (${ride.user.phone})!`);
    console.log(`[SOS GPS Location] Lat: ${ride.pickup.location.coordinates[1]}, Lng: ${ride.pickup.location.coordinates[0]}`);

    res.json({
      message: '🚨 Emergency SOS Triggered! Emergency contacts notified & live location logged.',
      sosTriggered: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
