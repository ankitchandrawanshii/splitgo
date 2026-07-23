require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  console.log('Twilio credentials check:');
  console.log('SID:', sid ? sid.substr(0, 10) + '...' : 'NONE');
  console.log('Token:', token ? '***' : 'NONE');
  console.log('Phone:', fromPhone);

  if (!sid || !token || !fromPhone) {
    console.log('Missing Twilio credentials in .env');
    return;
  }

  try {
    const client = require('twilio')(sid, token);
    console.log('Attempting to send test SMS...');
    
    // Test OTP message to registered number
    const message = await client.messages.create({
      body: 'SplitGo Test OTP code: 998877',
      from: fromPhone,
      to: '+918989776132', // User's phone number
    });

    console.log('Twilio Success! Message SID:', message.sid);
  } catch (err) {
    console.error('Twilio Error:', err.message);
  }
}

testTwilio();
