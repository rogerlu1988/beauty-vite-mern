import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get professionals, optionally filtered by service
router.get('/', async (req, res) => {
  // For demo, just return all professionals
  const professionals = await User.find({ role: 'professional' });
  res.json(professionals);
});

export default router;
