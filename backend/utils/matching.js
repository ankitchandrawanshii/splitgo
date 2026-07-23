const Ride = require('../models/Ride');

/**
 * Calculate bearing (direction angle) between two lat/lng points.
 * Returns angle in degrees (0-360).
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

/**
 * Haversine distance in km between two coordinates.
 */
function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Smallest angle difference between two bearings (0-180).
 */
function bearingDifference(b1, b2) {
  const diff = Math.abs(b1 - b2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Calculate route match score percentage (e.g. 75% - 98%)
 */
function calculateRouteMatchScore(pickupDist, dropDist, bDiff) {
  const pickupPenalty = Math.min(25, pickupDist * 10);
  const dropPenalty = Math.min(25, dropDist * 8);
  const bearingPenalty = Math.min(20, bDiff * 0.8);
  const score = Math.max(65, Math.min(98, Math.round(100 - pickupPenalty - dropPenalty - bearingPenalty)));
  return score;
}

/**
 * Find a compatible ride to match with the given ride.
 */
async function findMatch(newRide, options = {}) {
  const {
    bearingThresholdDeg = 25,
    pickupRadiusKm = 2,
    dropRadiusKm = 3,
  } = options;

  const newRidePopulated = await Ride.findById(newRide._id).populate('user', 'gender');
  const newRideGender = newRidePopulated?.user?.gender || 'female';

  const candidates = await Ride.find({
    status: 'searching',
    _id: { $ne: newRide._id },
    rideType: newRide.rideType,
  }).populate('user', 'name rating phone gender');

  let bestMatch = null;
  let bestScore = Infinity;
  let bestMatchScore = 85;

  for (const candidate of candidates) {
    // Gender Preference Filter Checks
    const candidateGender = candidate.user?.gender || 'male';

    if (newRide.genderPreference === 'female_only' && candidateGender !== 'female') {
      continue;
    }
    if (candidate.genderPreference === 'female_only' && newRideGender !== 'female') {
      continue;
    }

    const [newPickupLng, newPickupLat] = newRide.pickup.location.coordinates;
    const [candPickupLng, candPickupLat] = candidate.pickup.location.coordinates;
    const [newDropLng, newDropLat] = newRide.drop.location.coordinates;
    const [candDropLng, candDropLat] = candidate.drop.location.coordinates;

    const pickupDist = calculateDistanceKm(newPickupLat, newPickupLng, candPickupLat, candPickupLng);
    const dropDist = calculateDistanceKm(newDropLat, newDropLng, candDropLat, candDropLng);
    const bDiff = bearingDifference(newRide.bearing, candidate.bearing);

    if (pickupDist <= pickupRadiusKm && dropDist <= dropRadiusKm && bDiff <= bearingThresholdDeg) {
      const score = pickupDist * 1.5 + dropDist * 1 + bDiff * 0.1;
      const routeMatchPercent = calculateRouteMatchScore(pickupDist, dropDist, bDiff);
      if (score < bestScore) {
        bestScore = score;
        bestMatch = candidate;
        bestMatchScore = routeMatchPercent;
      }
    }
  }

  if (bestMatch) {
    bestMatch.routeMatchScore = bestMatchScore;
  }

  return bestMatch;
}

/**
 * Split fare between two matched rides based on their individual distances.
 */
function splitFare(ride1, ride2, sharedRatio = 0.7) {
  const totalFare = ride1.estimatedFare + ride2.estimatedFare;
  const sharedPortion = totalFare * sharedRatio;
  const individualPortion = totalFare - sharedPortion;

  const fare1 = sharedPortion / 2 + (individualPortion * (ride1.estimatedFare / totalFare));
  const fare2 = sharedPortion / 2 + (individualPortion * (ride2.estimatedFare / totalFare));

  return {
    fare1: Math.round(fare1),
    fare2: Math.round(fare2),
    savings1: Math.round(ride1.estimatedFare - fare1),
    savings2: Math.round(ride2.estimatedFare - fare2),
  };
}

module.exports = {
  calculateBearing,
  calculateDistanceKm,
  bearingDifference,
  calculateRouteMatchScore,
  findMatch,
  splitFare,
};
