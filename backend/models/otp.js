
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email or mobile
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['email', 'mobile'], required: true },
  expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('Otp', otpSchema);