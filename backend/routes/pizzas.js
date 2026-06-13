import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Pizza from '../models/Pizza.js';

const router = express.Router();

// @desc    Get all preconfigured pizzas
// @route   GET /api/pizzas
router.get('/', async (req, res) => {
  try {
    const pizzas = await Pizza.find({});
    res.status(200).json({ success: true, count: pizzas.length, data: pizzas });
  } catch (error) {
    console.error('Fetch pizzas error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pizzas' });
  }
});

// @desc    Add a new preconfigured pizza
// @route   POST /api/pizzas
router.post('/', protect, admin, async (req, res) => {
  const { name, description, price, image, base, sauce, cheese, veggies, meats } = req.body;

  try {
    const exists = await Pizza.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Pizza with this name already exists' });
    }

    const pizza = await Pizza.create({
      name,
      description,
      price,
      image,
      base,
      sauce,
      cheese,
      veggies: veggies || [],
      meats: meats || [],
    });

    res.status(201).json({ success: true, data: pizza });
  } catch (error) {
    console.error('Create pizza error:', error);
    res.status(500).json({ success: false, message: 'Server error creating preconfigured pizza' });
  }
});

export default router;
