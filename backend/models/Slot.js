import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  startTime: String,
  endTime: String,
  isBooked: { type: Boolean, default: false }
});

export default mongoose.model('Slot', slotSchema);
