import express from 'express';
import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import { protect } from '../middleware/auth.js';
import { io } from '../server.js';

const router = express.Router();

// Create a booking
router.post('/', protect(['client']), async (req, res) => {
  const { client, service, slot } = req.body;
  // Mark slot as booked
  const bookedSlot = await Slot.findByIdAndUpdate(slot, { isBooked: true }, { new: true });
  const booking = await Booking.create({ client, service, slot });
  // Emit event to professional
  if (bookedSlot && bookedSlot.professional) {
    io.emit('booking:new', {
      professionalId: bookedSlot.professional.toString(),
      slotId: bookedSlot._id.toString(),
      date: bookedSlot.date,
      startTime: bookedSlot.startTime,
      endTime: bookedSlot.endTime
    });
  }
  res.json(booking);
});

// Get bookings for a client/professional
router.get('/', protect(['client', 'professional', 'admin']), async (req, res) => {
  const filter = {};
  if (req.user.role === 'client') filter.client = req.user.id;
  if (req.user.role === 'professional') filter.professional = req.user.id;
  const bookings = await Booking.find(filter).populate('service slot');
  res.json(bookings);
});

export default router;
