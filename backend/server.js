import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth.js';
import slotRoutes from './routes/slots.js';
import serviceRoutes from './routes/services.js';
import professionalRoutes from './routes/professionals.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
});

httpServer.listen(process.env.PORT, () => console.log(`Backend + Socket.io on ${process.env.PORT}`));

export { io };
