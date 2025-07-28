import mongoose from "mongoose";

// Function to generate custom _id (ODR1001, ODR1002, etc.)
const generateCustomOrderId = async () => {
  const lastOrder = await mongoose.model('SOrder').findOne().sort({ createdAt: -1 });
  let nextId = 1001; // Start from ODR1001
  if (lastOrder && lastOrder._id.startsWith("ODR")) {
    const lastNumber = parseInt(lastOrder._id.replace("ODR", ""));
    nextId = lastNumber + 1;
  }
  return `ODR${nextId}`;
};

const OrderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  orderType: { 
    type: String, 
    enum: ["dine-in", "takeaway", "delivery"], 
    required: true 
  },
  tableNumber: { type: Number }, 
  
  // Enhanced delivery fields
  deliveryAddress: { 
    type: String,
    required: function() { return this.orderType === "delivery"; }
  },
  deliveryLocation: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
      required: function() { 
        return this.orderType === "delivery" && this.status === "Out for Delivery"; 
      }
    },
    coordinates: {
      type: [Number],
      required: function() { 
        return this.orderType === "delivery" && this.status === "Out for Delivery";
      }
    },
    address: { type: String }
  },
  
  assignedDeliveryPerson: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "DeliveryPerson"
  },
  
  // Enhanced status tracking
  status: { 
    type: String, 
    enum: [
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
    default: "Pending" 
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  preparedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  inTransitAt: { type: Date },
  completedAt: { type: Date },
  
  // Payment information
  paymentMethod: { 
    type: String, 
    enum: ["Online Pay", "Cash Pay"], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Paid", "Refunded"], 
    default: "Pending" 
  },
  
  // Order items
  items: [
    { 
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 }
    }
  ],
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  deliveryFee: { 
    type: Number,
    default: 0,
    min: 0
  },
  
  // Additional fields for delivery tracking
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  deliveryNotes: { type: String },
  customerSignature: { type: String }, // For proof of delivery
  rejectionReason: { type: String },
  
  // Current location tracking (legacy - consider using deliveryLocation)
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Pre-save hook to generate custom _id
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this._id) {
    this._id = await generateCustomOrderId();
  }
  next();
});

// Geospatial index for delivery location queries
OrderSchema.index({ "deliveryLocation": "2dsphere" });

// Indexes for faster queries
OrderSchema.index({ status: 1 });
OrderSchema.index({ assignedDeliveryPerson: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderType: 1, status: 1 });

// Add a virtual for order total (price + delivery fee)
OrderSchema.virtual("orderTotal").get(function() {
  return this.totalPrice + this.deliveryFee;
});

const SOrder = mongoose.model('SOrder', OrderSchema);
export default SOrder;