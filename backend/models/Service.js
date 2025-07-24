import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: String,
  price: Number,
  durationMinutes: Number,
  description: String,
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Service', serviceSchema);
