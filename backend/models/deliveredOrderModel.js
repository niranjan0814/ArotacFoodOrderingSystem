import mongoose from "mongoose";

const deliveredOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  customerName: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: "" }
  },
  assignedDeliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPerson", required: true },
  deliveryFee: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true }, // Added totalPrice
  deliveredAt: { type: Date, default: Date.now },
  status: { type: String, default: "Delivered" }
}, { timestamps: true });

const DeliveredOrder = mongoose.model('DeliveredOrder', deliveredOrderSchema);
export default DeliveredOrder;