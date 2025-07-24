import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['client', 'professional', 'admin'], default: 'client' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
