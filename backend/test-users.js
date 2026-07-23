require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'name phone email createdAt');
    console.log('Registered Users Count:', users.length);
    console.log('Users in DB:', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('DB Check Error:', err);
    process.exit(1);
  }
}

run();
