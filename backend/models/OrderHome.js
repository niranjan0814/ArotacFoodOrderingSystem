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
    ref: "user",
    required: true,
  },
  order: [orderItemSchema],
  address: { type: String, required:false },
  phoneNumber: { type: String, required: true },
  orderType: {
    type: String,
    enum: ["delivery"],
    required: true,
    default: "delivery",
  },
  deliveryLocation: {
    type: {
      type: String,
      default: "Point"
    },
    coordinates: [Number],
    address: String
  },
  assignedDeliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryPerson",
  },
  status: {
    type: String,
    enum: [
      "pending",
      "preparing",
      "ready",
      "processing",
      "out-for-delivery",
      "delivered",
      "rejected",
      "making",
      "cancelled",
      "Pending",
      "Preparing",
      "Ready",
      "Processing Delivery",
      "Out for Delivery",
      "Delivered",
      "Rejected",
      "Accepted",
      "Failed",
      "cancelled"
    ],
    default: "pending",
    lowercase: true
  },
  paymentMethod: {
    type: String,
    enum: ["Online Pay", "Cash Pay"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Refunded"],
    default: "Pending",
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  deliveryNotes: { type: String },
  customerSignature: { type: String },
  rejectionReason: { type: String },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  preparedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  inTransitAt: { type: Date },
  completedAt: { type: Date },
  // New field to store SOrder custom _id
  mainOrderId: {
    type: String,
    ref: "SOrder",
  },
}, {
  timestamps: true,
});

// Geospatial index for delivery location queries
orderSchema.index({ deliveryLocation: "2dsphere" });

const HomeOrder = mongoose.model("HomeOrder", orderSchema);
export default HomeOrder;