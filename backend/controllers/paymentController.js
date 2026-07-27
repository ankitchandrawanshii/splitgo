const crypto = require('crypto');
const User = require('../models/User');

// Bypass SSL certificate issues on local dev environments when requesting Razorpay API
if (process.env.NODE_ENV !== 'production' && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (err) {
  console.log('[INFO] razorpay is not installed; payments will run in local sandbox mode.');
}

// POST /api/payment/order -> Create Razorpay Order or Sandbox Order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const rawKeyId = process.env.RAZORPAY_KEY_ID || '';
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

    const keyId = rawKeyId.trim().replace(/`/g, '');
    const keySecret = rawKeySecret.trim().replace(/`/g, '');

    const isPlaceholder = !keyId || !keySecret || 
      keyId.includes('your_key_id_here') || 
      keySecret.includes('your_key_secret_here');

    // If Razorpay keys and SDK are present, execute real order creation
    if (Razorpay && keyId && keySecret && !isPlaceholder) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const options = {
          amount: Math.round(amount * 100), // amount in paise
          currency: 'INR',
          receipt: `receipt_splitgo_${Date.now()}`,
        };

        const order = await instance.orders.create(options);
        return res.json({
          isSandbox: false,
          keyId: keyId,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        });
      } catch (rzpErr) {
        console.warn('[WARNING] Razorpay order creation failed, falling back to Sandbox mode:', rzpErr.message || rzpErr);
        // Fallback to simulated Sandbox mode below if Razorpay API call fails
      }
    }

    // Otherwise, fallback to Simulated Sandbox Order
    const mockOrderId = `order_mock_${Math.random().toString(36).substr(2, 9)}`;
    res.json({
      isSandbox: true,
      orderId: mockOrderId,
      amount: amount,
      currency: 'INR',
    });
  } catch (error) {
    console.error('[CREATE_ORDER_ERROR]', error);
    res.status(500).json({ message: error.message || 'Server error creating order' });
  }
};

// POST /api/payment/verify -> Verify Payment and update wallet balance
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, amount, isSandbox } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Order details and amount are required' });
    }

    let isSuccess = false;

    if (isSandbox) {
      // In sandbox mode, verify mock payments & withdrawals instantly
      isSuccess = orderId.startsWith('order_mock_') || orderId.startsWith('withdraw_') || orderId.startsWith('sandbox_') || orderId.startsWith('order_');
    } else {
      // In real Razorpay mode, verify the HMAC signature
      const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
      const keySecret = rawKeySecret.trim().replace(/`/g, '');
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const generatedSignature = hmac.digest('hex');

      isSuccess = generatedSignature === signature;
    }

    if (!isSuccess) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Add cash to the user's walletBalance in the database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.walletBalance = (user.walletBalance || 0) + parseFloat(amount);
    await user.save();

    res.json({
      message: 'Payment verified and wallet updated successfully',
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    console.error('[VERIFY_PAYMENT_ERROR]', error);
    res.status(500).json({ message: error.message || 'Server error verifying payment' });
  }
};
