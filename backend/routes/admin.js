import express from 'express';
import User from '../models/User.js';
import Service from '../models/Service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// --- USERS CRUD ---
// Get all users
router.get('/users', protect(['admin']), async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Get a single user
router.get('/users/:id', protect(['admin']), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ msg: 'User not found' });
  res.json(user);
});

// Create user
router.post('/users', protect(['admin']), async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  // Password should be hashed in production!
  const user = await User.create({ firstName, lastName, email, password, role });
  res.json(user);
});

// Update user
router.put('/users/:id', protect(['admin']), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) return res.status(404).json({ msg: 'User not found' });
  res.json(user);
});

// Delete user
router.delete('/users/:id', protect(['admin']), async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ msg: 'User not found' });
  res.json({ msg: 'User deleted' });
});

// --- SERVICES CRUD ---
// Get all services (already exists in /services)
// Create service (already exists in /services)

// Get a single service
router.get('/services/:id', protect(['admin']), async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ msg: 'Service not found' });
  res.json(service);
});

// Update service
router.put('/services/:id', protect(['admin']), async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!service) return res.status(404).json({ msg: 'Service not found' });
  res.json(service);
});

// Delete service
router.delete('/services/:id', protect(['admin']), async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ msg: 'Service not found' });
  res.json({ msg: 'Service deleted' });
});

export default router;
