import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Service from './models/Service.js';
import Slot from './models/Slot.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // Clear existing
  await User.deleteMany({});
  await Service.deleteMany({});
  await Slot.deleteMany({});

  // Create demo professionals
  const password = await bcrypt.hash('propass123', 10);
  const pro1 = await User.create({ firstName: 'Alice', lastName: 'Smith', email: 'alice@pro.com', password, role: 'professional' });
  const pro2 = await User.create({ firstName: 'Bob', lastName: 'Lee', email: 'bob@pro.com', password, role: 'professional' });

  // Create demo client
  const clientPass = await bcrypt.hash('clientpass', 10);
  await User.create({ firstName: 'Jane', lastName: 'Doe', email: 'jane@client.com', password: clientPass, role: 'client' });

  // Create services
  const service1 = await Service.create({ name: 'Haircut', price: 40, durationMinutes: 45, description: 'Professional haircut', professional: pro1._id });
  const service2 = await Service.create({ name: 'Facial', price: 60, durationMinutes: 60, description: 'Relaxing facial', professional: pro2._id });

  // Create slots for each professional
  const today = new Date();
  today.setHours(9,0,0,0);
  for (let i = 0; i < 3; i++) {
    await Slot.create({ professional: pro1._id, date: today, startTime: `${9+i}:00`, endTime: `${10+i}:00` });
    await Slot.create({ professional: pro2._id, date: today, startTime: `${13+i}:00`, endTime: `${14+i}:00` });
  }

  console.log('Seeded demo data!');
  process.exit();
}

seed();
