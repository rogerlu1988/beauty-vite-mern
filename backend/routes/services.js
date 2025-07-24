import express from 'express';
import Service from '../models/Service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Admin or professional creates a service
router.post('/', protect(['admin', 'professional']), async (req, res) => {
  const { name, price, durationMinutes, description } = req.body;
  const professional = req.user.id;
  const service = await Service.create({ name, price, durationMinutes, description, professional });
  res.json(service);
});

// Public: get all services
router.get('/', async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

export default router;
