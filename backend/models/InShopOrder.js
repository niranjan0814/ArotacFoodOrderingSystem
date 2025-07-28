import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    orderType: {
      type: String,
      enum: ['takeaway', 'dine-in'],
      required: true,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  deliveryAddress: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'pending'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const InShopOrder = mongoose.model('InShopOrder', orderSchema);
export default InShopOrder;
