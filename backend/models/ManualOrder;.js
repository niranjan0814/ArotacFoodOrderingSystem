import mongoose from "mongoose";
import AutoIncrement from "mongoose-sequence"; 
const AutoIncrementFactory = AutoIncrement(mongoose); 

const orderItemSchema = new mongoose.Schema({
  menuItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenuItem',
    required: true 
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { 
    type: Number,
    unique: true,
  },
  tableNumber: {
    type: String,
    required: function() {
      return this.orderType === 'dine-in';
    }
  },
  customerName: {
    type: String,
    default: 'Guest'
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway'],
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed','canceled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


orderSchema.plugin(AutoIncrementFactory, { inc_field: 'orderNumber' });

const ManualOrder = mongoose.model('ManualOrder', orderSchema);

export default ManualOrder;
