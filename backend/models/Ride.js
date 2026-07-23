const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickup: {
      address: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },
    drop: {
      address: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },
    distanceKm: { type: Number, required: true },
    estimatedFare: { type: Number, required: true },
    finalFare: { type: Number },
    status: {
      type: String,
      enum: ['searching', 'matched', 'driver_assigned', 'ongoing', 'completed', 'cancelled'],
      default: 'searching',
    },
    matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bearing: { type: Number }, // direction angle pickup -> drop, used for matching
    rideType: { type: String, enum: ['bike', 'car'], default: 'bike' },
    genderPreference: { type: String, enum: ['any', 'female_only'], default: 'any' },
    scheduledAt: { type: Date, default: null },
    promoCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    rating: { type: Number, default: null },
    review: { type: String, default: '' },
    sosTriggered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Geospatial indexes for location-based queries
rideSchema.index({ 'pickup.location': '2dsphere' });
rideSchema.index({ 'drop.location': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
