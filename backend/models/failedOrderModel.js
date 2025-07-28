import mongoose from "mongoose";

const failedOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true }, // Changed to String
  customerName: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: "" }
  },
  assignedDeliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPerson", required: true },
  failureReason: { type: String, required: true },
  failedAt: { type: Date, default: Date.now }
}, { timestamps: true });


const FailedOrder = mongoose.model('FailedOrder', failedOrderSchema);
export default FailedOrder;