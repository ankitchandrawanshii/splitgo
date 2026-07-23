const crypto = require('crypto');
const User = require('../models/User');

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

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const isPlaceholder = !keyId || !keySecret || 
      keyId.includes('your_key_id_here') || 
      keySecret.includes('your_key_secret_here');

    // If Razorpay keys and SDK are present, execute real order creation
    if (Razorpay && keyId && keySecret && !isPlaceholder) {
      const instance = new Razorpay({
        key_id: keyId.trim(),
        key_secret: keySecret.trim(),
      });

      const options = {
        amount: Math.round(amount * 100), // amount in paise
        currency: 'INR',
        receipt: `receipt_splitgo_${Date.now()}`,
      };

      const order = await instance.orders.create(options);
      return res.json({
        isSandbox: false,
        keyId: keyId.trim(),
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
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
    res.status(500).json({ message: error.message });
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
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
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
    res.status(500).json({ message: error.message });
  }
};
