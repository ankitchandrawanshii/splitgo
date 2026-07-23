require('dotenv').config();
const https = require('https');

function sendFast2SMS(apiKey, phone, otp) {
  return new Promise((resolve, reject) => {
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey.trim()}&route=q&message=Your%20SplitGo%20OTP%20code%20is%20${otp}&language=english&flash=0&numbers=${phone}`;
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    https.get(url, { agent }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  const apiKey = process.env.FAST2SMS_API_KEY;
  console.log('Testing Fast2SMS with key:', apiKey ? apiKey.substr(0, 10) + '...' : 'NONE');

  try {
    const result = await sendFast2SMS(apiKey, '9876543210', '123456');
    console.log('Fast2SMS Result:', result);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
