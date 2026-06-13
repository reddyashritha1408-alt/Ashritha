import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'],
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 50,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  threshold: {
    type: Number,
    required: true,
    default: 20,
    min: 0,
  },
  alertSent: {
    type: Boolean,
    default: false,
  },
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
