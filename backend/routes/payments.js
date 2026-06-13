import crypto from 'crypto';
import express from 'express';
import Razorpay from 'razorpay';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Only instantiate real Razorpay if keys look like real test/live keys
  const isRealKey =
    keyId &&
    keySecret &&
    keyId.startsWith('rzp_') &&
    keyId !== 'rzp_test_dummykey123' &&
    keySecret !== 'dummysecret123';

  if (!isRealKey) return null;

  try {
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  } catch (error) {
    console.warn('[PAYMENT] Failed to initialize Razorpay SDK:', error.message);
    return null;
  }
};

// @desc    Create Razorpay Order (or mock order when no real keys)
// @route   POST /api/payments/create-order
router.post('/create-order', protect, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  const amountInPaise = Math.round(amount * 100);
  const rzInstance = getRazorpayInstance();

  if (!rzInstance) {
    const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`[PAYMENT] No real Razorpay keys — using mock order: ${mockOrderId} for INR ${amount}`);
    return res.status(200).json({
      success: true,
      isMock: true,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey123',
      order: {
        id: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
      },
    });
  }

  try {
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    const order = await rzInstance.orders.create(options);
    console.log(`[PAYMENT] Created Razorpay order: ${order.id} for INR ${amount}`);
    res.status(200).json({
      success: true,
      isMock: false,
      key: process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (error) {
    console.error('[PAYMENT] Razorpay order creation failed:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create payment order. Please try again.' });
  }
});

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify-order
router.post('/verify-order', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;

  // Mock verification
  if (isMock || (razorpay_order_id && razorpay_order_id.startsWith('order_mock_'))) {
    console.log(`[PAYMENT] Mock payment verified. Order: ${razorpay_order_id}`);
    return res.status(200).json({ success: true, message: 'Mock payment verified successfully!' });
  }

  // Real Razorpay signature verification
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || keySecret === 'dummysecret123') {
    return res.status(500).json({ success: false, message: 'Razorpay secret key not configured' });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment verification parameters' });
  }

  try {
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      console.log(`[PAYMENT] Signature verified for payment: ${razorpay_payment_id}`);
      res.status(200).json({ success: true, message: 'Payment verified successfully!' });
    } else {
      console.warn(`[PAYMENT] Invalid signature for payment: ${razorpay_payment_id}`);
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('[PAYMENT] Verification error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during payment verification' });
  }
});

export default router;
