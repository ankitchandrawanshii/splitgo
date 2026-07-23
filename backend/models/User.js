const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: ['rider', 'driver'], default: 'rider' },
    gender: { type: String, enum: ['female', 'male', 'other'], default: 'male' },
    rating: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0.0 },
    sosContacts: [{ type: String }],
    referralCode: { type: String, default: '' },
    referredBy: { type: String, default: '' },
    vehicleDetails: {
      model: { type: String, default: '' },
      number: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
