const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use IPv4 first & Google/Cloudflare public DNS for SRV resolution
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Fallback to system default DNS if setServers is restricted
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
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
      console.error('Local MongoDB also unavailable. Please check your internet connection.');
    }
  }
};

module.exports = connectDB;
