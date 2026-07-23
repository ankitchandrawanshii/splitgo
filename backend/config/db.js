const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Atlas Connection Warning: ${error.message}`);
    console.log('Attempting local MongoDB fallback connection (mongodb://127.0.0.1:27017/splitgo)...');
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/splitgo');
      console.log(`Local MongoDB Connected: ${localConn.connection.host}`);
    } catch (localErr) {
      console.error('Local MongoDB also unavailable. Please ensure MongoDB is running or whitelist 0.0.0.0/0 in MongoDB Atlas Network Access.');
    }
  }
};

module.exports = connectDB;
