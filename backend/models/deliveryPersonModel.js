import mongoose from "mongoose";

const DeliveryPersonSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Vehicle Information
  vehicleNumber: { type: String, required: true },
  vehicleType: { 
    type: String, 
    enum: ["bike", "car", "scooter", "truck"], 
    required: true 
  },
  vehicleCapacity: { type: Number, default: 10 }, // kg

  // Work Status
  status: { 
    type: String, 
    enum: ["available", "busy", "offline", "on_break"], 
    default: "offline" 
  },
  lastActive: { type: Date },

  // Location Data
  currentLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: "" }
  },

  // Delivery Metrics
  assignedOrders: [{ 
    type: String, 
    ref: "Order" 
  }],
  completedOrders: { type: Number, default: 0 },
  failedDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  todayEarnings: { type: Number, default: 0 },
  averageDeliveryTime: { type: Number, default: 30 }, // minutes

  // Rating System
  rating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 10 
  },
  ratingCount: { type: Number, default: 0 },

  // Profile Information
  profilePicture: { type: String, default: "" },
  identification: {
    type: { type: String, default: "driving_license" },
    number: { type: String, default: "" },
    image: { type: String, default: "" }
  },

  // Account Status
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Timestamps
  joiningDate: { type: Date, default: Date.now },
  lastDeliveryDate: { type: Date },

  // Password Reset
  resetPasswordOTP: {
    type: Number,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },

  // Device Information
  deviceToken: { type: String, default: "" },
  platform: { type: String, enum: ["android", "ios", "web"], default: "android" },

  // Dashboard Fields
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  dailyTarget: { type: Number, default: 10 },
  incentives: { type: Number, default: 0 },
  zones: [{ type: String }],
  shiftTimings: {
    start: { type: String, default: "09:00" },
    end: { type: String, default: "18:00" }
  }
});

// Geospatial index
DeliveryPersonSchema.index({ "currentLocation": "2dsphere" });

const DeliveryPerson = mongoose.model('DeliveryPerson', DeliveryPersonSchema);
export default DeliveryPerson;