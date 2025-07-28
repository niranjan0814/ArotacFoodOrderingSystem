 import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
 user: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "user",
     required: true,
   },
  items: [{
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
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
    trim: true,
    default: 'N/A', // Optional default value

  },
  tableNumber: {
    type: String, // Allow string for flexibility (e.g., "5")
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'delivered', 'cancelled'],
    default: 'pending',
  },
  guestDetails: {
    name: String,
    phone: String,
    address: String,
    tableNumber: String,
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

export default mongoose.model('Order', orderSchema);