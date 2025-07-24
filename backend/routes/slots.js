import express from 'express';
import Slot from '../models/Slot.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Professional creates slots
router.post('/', protect(['professional']), async (req, res) => {
  const { date, startTime, endTime } = req.body;
  const slot = await Slot.create({ professional: req.user.id, date, startTime, endTime });
  res.json(slot);
});

// Public: get available slots
router.get('/', async (req, res) => {
  const { professional, date } = req.query;
  const filter = { professional, isBooked: false };
  if (date) filter.date = date;
  const slots = await Slot.find(filter);
  res.json(slots);
});

// Edit a slot (professional only, not booked)
router.put('/:id', protect(['professional']), async (req, res) => {
  const slot = await Slot.findById(req.params.id);
  if (!slot) return res.status(404).json({ msg: 'Slot not found' });
  if (slot.professional.toString() !== req.user.id) return res.status(403).json({ msg: 'Not allowed' });
  if (slot.isBooked) return res.status(400).json({ msg: 'Cannot edit a booked slot' });
  const { date, startTime, endTime } = req.body;
  slot.date = date;
  slot.startTime = startTime;
  slot.endTime = endTime;
  await slot.save();
  res.json(slot);
});

// Delete a slot (professional only, not booked)
router.delete('/:id', protect(['professional']), async (req, res) => {
  const slot = await Slot.findById(req.params.id);
  if (!slot) return res.status(404).json({ msg: 'Slot not found' });
  if (slot.professional.toString() !== req.user.id) return res.status(403).json({ msg: 'Not allowed' });
  if (slot.isBooked) return res.status(400).json({ msg: 'Cannot delete a booked slot' });
  await slot.deleteOne();
  res.json({ msg: 'Slot deleted' });
});

export default router;
