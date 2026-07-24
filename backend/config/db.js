const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Atlas Connection Warning: ${error.message}`);
    console.log('Attempting local MongoDB fallback connection (mongodb://127.0.0.1:27017/splitgo)...');
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/splitgo', {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`Local MongoDB Connected: ${localConn.connection.host}`);
    } catch (localErr) {
      console.error('Local MongoDB also unavailable. Please check your internet connection or whitelist 0.0.0.0/0 in MongoDB Atlas.');
    }
  }
};

module.exports = connectDB;
