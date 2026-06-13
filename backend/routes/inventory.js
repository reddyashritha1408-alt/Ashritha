import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// @desc    Get all inventory items (bases, sauces, cheese, veggies, meats)
// @route   GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find({});
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching inventory' });
  }
});

// @desc    Update stock/price/threshold of an inventory item
// @route   PUT /api/inventory/:id
router.put('/:id', protect, admin, async (req, res) => {
  const { stock, price, threshold } = req.body;

  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    if (stock !== undefined) {
      item.stock = stock;
      // Reset alertSent if stock goes above the threshold
      const targetThreshold = threshold !== undefined ? threshold : item.threshold;
      if (stock >= targetThreshold) {
        item.alertSent = false;
      }
    }
    if (price !== undefined) item.price = price;
    if (threshold !== undefined) item.threshold = threshold;

    const updatedItem = await item.save();

    // Emit live inventory update to all connected clients
    const io = req.app.get('socketio');
    if (io) {
      io.emit('inventoryUpdated', updatedItem);
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error updating inventory' });
  }
});

// @desc    Create a new inventory item
// @route   POST /api/inventory
router.post('/', protect, admin, async (req, res) => {
  const { category, name, stock, price, threshold } = req.body;

  try {
    const exists = await Inventory.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Item with this name already exists' });
    }

    const item = await Inventory.create({
      category,
      name,
      stock: stock !== undefined ? stock : 50,
      price: price !== undefined ? price : 0,
      threshold: threshold !== undefined ? threshold : 20,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('inventoryAdded', item);
    }

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ success: false, message: 'Server error creating inventory item' });
  }
});

export default router;
