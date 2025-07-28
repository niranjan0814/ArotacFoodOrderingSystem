import mongoose from "mongoose";

const ProcessedOrderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  customerName: String,
  phone: String,
  orderType: { type: String, enum: ["dine-in", "takeaway", "delivery"], required: true },
  tableNumber: Number, // For dine-in/takeaway
  deliveryAddress: String, // For delivery
  assignedDeliveryPerson: String, // For delivery
  items: [
    { name: String, quantity: Number, price: Number }
  ],
  totalPrice: Number,
  status: { type: String, enum: ["Closed"], default: "Closed" },
  paymentMethod: { type: String, enum: ["Online Pay", "Cash Pay"], required: true },
  paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});
const ProcessedOrder = mongoose.model('ProcessedOrder', ProcessedOrderSchema);
export default ProcessedOrder;

