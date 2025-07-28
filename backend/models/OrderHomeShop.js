// models/Order.js
import mongoose from "mongoose";

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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
    required: true,
  },
  order: [orderItemSchema],
  deliveryAddress: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "making", "delivered", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;