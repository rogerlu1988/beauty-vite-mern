import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
