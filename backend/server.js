const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',  require('./routes/authRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));

// Socket.io — Real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('passengerJoined',  (data) => io.emit('rideUpdated',        data));
  socket.on('newRideCreated',   (data) => io.emit('newRideAvailable',    data));
  socket.on('locationUpdate',   (data) => io.emit('riderLocationUpdated',data));

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

// ─── MongoDB Atlas Connection ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected Successfully'))
  .catch(err => {
    console.log('❌ Atlas Connection Failed:', err.message);
    console.log('👉 Check your MONGO_URI in .env file');
  });

server.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
