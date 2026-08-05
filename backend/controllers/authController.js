const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/otp');

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.log('[INFO] nodemailer is not installed; email OTPs will log to console.');
}

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Normalize phone numbers to match 10-digit base or formatted strings
const normalizePhone = (p) => {
  if (!p) return '';
  const trimmed = p.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(-10); // Last 10 digits
  }
  return trimmed;
};

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role, isPhoneVerified, isEmailVerified } = req.body;

    const rawPhone = phone ? phone.trim() : '';
    const last10 = normalizePhone(rawPhone);

    const existing = await User.findOne({
      $or: [
        { phone: rawPhone },
        { phone: last10 },
        { phone: `+91${last10}` },
        { phone: `+91 ${last10}` },
      ],
    });

    if (existing) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      phone: last10, // store clean 10-digit base
      email,
      password: hashedPassword,
      role,
      isPhoneVerified: isPhoneVerified || false,
      isEmailVerified: isEmailVerified || false,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    let query = [];

    if (email) {
      query.push({ email: email.trim().toLowerCase() });
    }

    if (phone) {
      const rawPhone = phone.trim();
      const last10 = normalizePhone(rawPhone);
      query.push({ phone: rawPhone }, { phone: last10 }, { phone: `+91${last10}` }, { phone: `+91 ${last10}` });
    }

    if (query.length === 0) {
      return res.status(400).json({ message: 'Please provide phone number or email' });
    }

    const user = await User.findOne({ $or: query });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send OTP to email or phone number
exports.sendOTP = async (req, res) => {
  try {
    const { identifier, type } = req.body; // type = 'email' | 'mobile'

    if (!identifier) {
      return res.status(400).json({ message: 'Identifier is required' });
    }

    const cleanIdentifier = type === 'mobile' ? normalizePhone(identifier) : identifier.trim().toLowerCase();

    // Generate random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Upsert the OTP document
    await Otp.findOneAndUpdate(
      { identifier: cleanIdentifier, purpose: type },
      { otp, expiresAt },
      { upsert: true, returnDocument: 'after' }
    );

    if (type === 'email') {
      console.log(`[MOCK EMAIL SMTP] Send OTP ${otp} to ${identifier}`);

      // Check if SMTP settings are present in .env and nodemailer is installed
      if (nodemailer && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: `"SplitGo Support" <${process.env.SMTP_USER}>`,
            to: identifier,
            subject: 'SplitGo Verification Code',
            text: `Your SplitGo OTP code is: ${otp}. It will expire in 5 minutes.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 25px; background: #0b0f19; color: #f8fafc; border-radius: 20px;">
              <h2 style="color: #10b981; margin-bottom: 5px;">SplitGo Verification</h2>
              <p style="color: #94a3b8; font-size: 14px;">Here is your verification code to complete your security registration:</p>
              <div style="background: #1e293b; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #334155;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px;">This code is valid for 5 minutes. If you did not request this, please ignore this message.</p>
            </div>`,
          });
        } catch (mailErr) {
          console.error('Mail sending error:', mailErr.message);
        }
      }
    } else {
      // Mobile SMS Sending
      console.log(`[MOBILE SMS LOG] Send OTP ${otp} to phone: ${identifier}`);

      // 1. Fast2SMS (Popular Indian SMS API Provider)
      if (process.env.FAST2SMS_API_KEY && !process.env.FAST2SMS_API_KEY.includes('your_')) {
        try {
          const https = require('https');
          const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
          const apiKey = process.env.FAST2SMS_API_KEY.trim();
          const agent = new https.Agent({ rejectUnauthorized: false });

          const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otp}&flash=0&numbers=${cleanPhone}`;

          https.get(url, { agent }, (response) => {
            let data = '';
            response.on('data', (chunk) => (data += chunk));
            response.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                console.log(`[Fast2SMS Response for ${cleanPhone}]`, parsed);
                if (parsed.status_code === 999) {
                  console.log('[Fast2SMS Notice] Fast2SMS requires 1 wallet transaction of ₹100 to enable external API SMS sending.');
                }
              } catch (e) {
                console.log('[Fast2SMS Output]', data);
              }
            });
          }).on('error', (e) => {
            console.error('Fast2SMS HTTPS Error:', e.message);
          });
        } catch (smsErr) {
          console.error('Fast2SMS Error:', smsErr.message);
        }
      }

      // 2. Twilio SMS Integration
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
          const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID.trim(), process.env.TWILIO_AUTH_TOKEN.trim());
          const cleanSenderPhone = process.env.TWILIO_PHONE_NUMBER.replace(/[^\d+]/g, '');
          const formattedPhone = identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '').slice(-10)}`;
          
          const msgResult = await twilio.messages.create({
            body: `Your SplitGo verification code is: ${otp}`,
            from: cleanSenderPhone,
            to: formattedPhone,
          });
          console.log(`[Twilio] Sent SMS successfully to ${formattedPhone}, SID: ${msgResult.sid}`);
        } catch (twilioErr) {
          console.error('Twilio SMS Error:', twilioErr.message);
        }
      }
    }

    res.json({ message: 'Verification OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP for email or phone number
exports.verifyOTP = async (req, res) => {
  try {
    const { identifier, otp, type } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP code are required' });
    }

    const cleanIdentifier = type === 'mobile' ? normalizePhone(identifier) : identifier.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const record = await Otp.findOne({ identifier: cleanIdentifier, purpose: type });

    if (!record) {
      return res.status(400).json({ message: 'No verification request found' });
    }

    if (record.otp !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid verification OTP code' });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification OTP has expired' });
    }

    // Find the logged-in user and verify their status if token is provided
    let isPhoneVerified = type === 'mobile';
    let isEmailVerified = type === 'email';

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (tokenErr) {
        // Ignore invalid token, treat as anonymous
      }
    }

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        if (type === 'email') {
          user.isEmailVerified = true;
        } else if (type === 'mobile') {
          user.isPhoneVerified = true;
        }
        await user.save();
        isPhoneVerified = user.isPhoneVerified;
        isEmailVerified = user.isEmailVerified;
      }
    }

    // Remove the OTP record
    await Otp.deleteOne({ _id: record._id });

    res.json({
      message: 'Verified successfully',
      isPhoneVerified,
      isEmailVerified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me -> Get current user profile details
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/auth/profile -> Update user profile & vehicle details
exports.updateProfile = async (req, res) => {
  try {
    const { vehicleDetails } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (vehicleDetails) {
      user.vehicleDetails = {
        model: vehicleDetails.model || '',
        number: vehicleDetails.number || '',
      };
    }

    await user.save();
    res.json({ message: 'Profile & vehicle details updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/auth/change-password -> Change current password securely
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const bcrypt = require('bcryptjs');
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password. Please try again.' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: '✓ Password changed successfully!' });
  } catch (error) {
    console.error('[CHANGE_PASSWORD_ERROR]', error);
    const friendlyMsg = error.message.includes('ENOTFOUND') || error.message.includes('querySrv')
      ? 'Database connection temporary timeout. Please check your internet connection and try again.'
      : error.message;
    res.status(500).json({ message: friendlyMsg });
  }
};

