import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Inventory from '../models/Inventory.js';
import Order from '../models/Order.js';
import Pizza from '../models/Pizza.js';
import User from '../models/User.js';
import { sendStockAlertEmail } from '../utils/mailer.js';

const router = express.Router();

// Helper to check stock and deduct
const deductStock = async (orderDetails) => {
  const { type, details } = orderDetails;
  const ingredientsToDeduct = []; // Array of ingredient names

  if (type === 'custom') {
    if (details.base) ingredientsToDeduct.push({ name: details.base, category: 'base' });
    if (details.sauce) ingredientsToDeduct.push({ name: details.sauce, category: 'sauce' });
    if (details.cheese) ingredientsToDeduct.push({ name: details.cheese, category: 'cheese' });
    if (details.veggies && details.veggies.length > 0) {
      details.veggies.forEach(v => ingredientsToDeduct.push({ name: v, category: 'veggie' }));
    }
    if (details.meats && details.meats.length > 0) {
      details.meats.forEach(m => ingredientsToDeduct.push({ name: m, category: 'meat' }));
    }
  } else if (type === 'standard') {
    const pizza = await Pizza.findById(details.pizzaId);
    if (!pizza) {
      throw new Error('Preconfigured pizza not found');
    }
    if (pizza.base) ingredientsToDeduct.push({ name: pizza.base, category: 'base' });
    if (pizza.sauce) ingredientsToDeduct.push({ name: pizza.sauce, category: 'sauce' });
    if (pizza.cheese) ingredientsToDeduct.push({ name: pizza.cheese, category: 'cheese' });
    if (pizza.veggies && pizza.veggies.length > 0) {
      pizza.veggies.forEach(v => ingredientsToDeduct.push({ name: v, category: 'veggie' }));
    }
    if (pizza.meats && pizza.meats.length > 0) {
      pizza.meats.forEach(m => ingredientsToDeduct.push({ name: m, category: 'meat' }));
    }
  }

  // 1. Check stock availability first
  for (const item of ingredientsToDeduct) {
    const invItem = await Inventory.findOne({ name: item.name });
    if (!invItem) {
      throw new Error(`Ingredient "${item.name}" not found in inventory`);
    }
    if (invItem.stock <= 0) {
      throw new Error(`Ingredient "${item.name}" is out of stock!`);
    }
  }

  // 2. Perform deductions
  const updatedItems = [];
  for (const item of ingredientsToDeduct) {
    const invItem = await Inventory.findOne({ name: item.name });
    invItem.stock -= 1;
    await invItem.save();
    updatedItems.push(invItem);
  }

  return updatedItems;
};

// Helper to check stock levels and trigger alerts
const checkThresholdsAndNotify = async (updatedItems, app) => {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    const adminEmail = adminUser ? adminUser.email : 'admin@pizza.com';

    for (const item of updatedItems) {
      if (item.stock < item.threshold && !item.alertSent) {
        console.log(`[ALERT] Stock of "${item.name}" is ${item.stock}, which is below threshold of ${item.threshold}. Sending alert email to ${adminEmail}...`);
        
        // Trigger email notification
        await sendStockAlertEmail(adminEmail, item.name, item.stock, item.threshold);
        
        // Mark alert as sent
        item.alertSent = true;
        await item.save();
      }
    }
  } catch (error) {
    console.error('Error in threshold checks:', error);
  }
};

// @desc    Place a new order (deducts stock and checks thresholds)
// @route   POST /api/orders
router.post('/', protect, async (req, res) => {
  const { type, pizzaName, details, totalPrice, paymentId, paymentStatus, address } = req.body;

  try {
    // 1. Validate inputs
    if (!type || !pizzaName || !totalPrice || !address) {
      return res.status(400).json({ success: false, message: 'Invalid order request parameters. Type, pizzaName, totalPrice, and address are required.' });
    }

    const { fullName, phone, houseNo, streetAddress, city, pincode, state } = address;
    if (!fullName || !phone || !houseNo || !streetAddress || !city || !pincode || !state) {
      return res.status(400).json({ success: false, message: 'Invalid delivery address fields' });
    }

    // 2. Deduct stock (will throw error if item out of stock)
    let updatedInventoryItems;
    try {
      updatedInventoryItems = await deductStock({ type, details });
    } catch (stockError) {
      return res.status(400).json({ success: false, message: stockError.message });
    }

    // 3. Create the order
    const order = await Order.create({
      user: req.user._id,
      type,
      pizzaName,
      details,
      totalPrice,
      address,
      paymentId: paymentId || `pay_mock_${Date.now()}`,
      paymentStatus: paymentStatus || 'success',
      orderStatus: 'Order Received',
    });

    // 4. Check inventory thresholds and send email alerts
    await checkThresholdsAndNotify(updatedInventoryItems, req.app);

    // 5. Broadcast real-time notifications
    const io = req.app.get('socketio');
    if (io) {
      // Notify admin page that a new order is received
      io.emit('newOrderReceived', order);
      // Notify all clients of new inventory levels
      updatedInventoryItems.forEach(item => {
        io.emit('inventoryUpdated', item);
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Server error placing order' });
  }
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user orders' });
  }
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/all-orders
router.get('/all-orders', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Fetch all orders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
});

// @desc    Get a single order detail
// @route   GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Secure checking: only the owner user or admin can check
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving order' });
  }
});

// @desc    Update order delivery status (Admin only)
// @route   PUT /api/orders/:id/status
router.put('/:id/status', protect, admin, async (req, res) => {
  const { orderStatus } = req.body;
  const allowedStatuses = ['Order Received', 'In Kitchen', 'Sent for Delivery', 'Delivered'];

  if (!allowedStatuses.includes(orderStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid order status' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    // Realtime broadcast to the specific order status page
    const io = req.app.get('socketio');
    if (io) {
      console.log(`[SOCKET] Emitting order status update for Order: ${order._id} -> Status: ${orderStatus}`);
      io.to(order._id.toString()).emit('orderStatusUpdated', orderStatus);
      // Also general update for dashboard
      io.emit('orderListUpdated', order);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
});

export default router;
