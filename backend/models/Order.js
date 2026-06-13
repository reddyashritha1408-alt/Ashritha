import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  address: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    houseNo: { type: String, required: true },
    streetAddress: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
  },
  type: {
    type: String,
    enum: ['custom', 'standard'],
    required: true,
  },
  pizzaName: {
    type: String,
    required: true,
  },
  details: {
    base: { type: String },
    sauce: { type: String },
    cheese: { type: String },
    veggies: [{ type: String }],
    meats: [{ type: String }],
    pizzaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza' },
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  paymentId: {
    type: String,
  },
  orderStatus: {
    type: String,
    enum: ['Order Received', 'In Kitchen', 'Sent for Delivery', 'Delivered'],
    default: 'Order Received',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
