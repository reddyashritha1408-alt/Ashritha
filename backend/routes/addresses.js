import express from 'express';
import { protect } from '../middleware/auth.js';
import Address from '../models/Address.js';

const router = express.Router();

// @desc    Get all saved addresses for the logged-in user
// @route   GET /api/addresses
router.get('/', protect, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: addresses.length, data: addresses });
  } catch (error) {
    console.error('Fetch addresses error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching addresses' });
  }
});

// @desc    Save a new delivery address
// @route   POST /api/addresses
router.post('/', protect, async (req, res) => {
  const { fullName, phone, houseNo, streetAddress, landmark, city, pincode, state } = req.body;

  if (!fullName || !phone || !houseNo || !streetAddress || !city || !pincode || !state) {
    return res.status(400).json({ success: false, message: 'Please provide all required address fields' });
  }

  try {
    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      houseNo,
      streetAddress,
      landmark,
      city,
      pincode,
      state,
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ success: false, message: 'Server error saving address' });
  }
});

// @desc    Delete a saved delivery address
// @route   DELETE /api/addresses/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Verify ownership
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this address' });
    }

    await address.deleteOne();
    res.status(200).json({ success: true, message: 'Address removed successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting address' });
  }
});

export default router;
