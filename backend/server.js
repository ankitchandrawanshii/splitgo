require('dotenv').config();
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const promoRoutes = require('./routes/promoRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Attach io to req so controllers can emit events if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve built frontend static files if available
const path = require('path');
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('SplitGo API is running'));
}

// Socket.io connection for live location + chat + SOS between matched riders
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRide', (rideId) => {
    if (rideId) socket.join(rideId);
    socket.join('shared_live_room');
  });

  socket.on('locationUpdate', ({ rideId, lat, lng }) => {
    if (rideId) socket.to(rideId).emit('partnerLocation', { lat, lng });
    socket.broadcast.emit('partnerLocation', { lat, lng });
  });

  socket.on('chatMessage', ({ rideId, message, senderId }) => {
    if (rideId) socket.to(rideId).emit('chatMessage', { message, senderId });
    socket.broadcast.emit('chatMessage', { message, senderId });
  });

  socket.on('sosAlert', ({ rideId, senderName, coords }) => {
    io.emit('sosAlert', { senderName, coords });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
