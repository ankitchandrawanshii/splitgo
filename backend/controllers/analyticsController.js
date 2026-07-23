const Ride = require('../models/Ride');
const User = require('../models/User');

// GET /api/analytics/stats -> Get user's earnings, fuel savings, and environmental stats
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const completedRides = await Ride.find({
      $or: [{ user: userId }, { driver: userId }],
      status: { $in: ['matched', 'completed', 'ongoing'] },
    });

    let totalKm = 0;
    let totalFareSaved = 0;
    let totalRidesCount = completedRides.length;

    completedRides.forEach((r) => {
      totalKm += r.distanceKm || 0;
      if (r.estimatedFare && r.finalFare) {
        totalFareSaved += Math.max(0, r.estimatedFare - r.finalFare);
      } else {
        totalFareSaved += Math.round((r.estimatedFare || 30) * 0.4);
      }
    });

    // Approximate eco calculations:
    // Average vehicle fuel consumption: 1 Liter per 18 km
    const fuelSavedLiters = parseFloat((totalKm / 18).toFixed(1));
    // Carbon footprint offset: ~2.3 kg CO2 saved per liter of fuel saved
    const co2SavedKg = parseFloat((fuelSavedLiters * 2.3).toFixed(1));

    res.json({
      totalRidesCount,
      totalKm: parseFloat(totalKm.toFixed(1)),
      totalFareSaved: Math.round(totalFareSaved),
      fuelSavedLiters,
      co2SavedKg,
      currency: 'INR',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
