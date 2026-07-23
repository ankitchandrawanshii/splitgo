require('dotenv').config();
const Razorpay = require('razorpay');

async function test() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log('Keys loaded:', { keyId: keyId ? keyId.substr(0, 10) + '...' : 'none', keySecret: keySecret ? '***' : 'none' });

  if (!keyId || !keySecret) {
    console.log('No keys configured!');
    process.exit(0);
  }

  try {
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    console.log('Creating test order...');
    const order = await instance.orders.create({
      amount: 1000,
      currency: 'INR',
      receipt: 'receipt_test_123',
    });

    console.log('Success!', order);
  } catch (err) {
    console.error('Razorpay Error Stack:', err);
  }
}

test();
