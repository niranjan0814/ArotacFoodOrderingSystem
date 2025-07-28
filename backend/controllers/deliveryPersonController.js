import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");
import DeliveryPerson from "../models/deliveryPersonModel.js";
import Order from "../models/orderModel.js";
import DeliveredOrder from "../models/deliveredOrderModel.js"; 
import FailedOrder from "../models/failedOrderModel.js";   
import dotenv from "dotenv";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
  // New model
dotenv.config();

// Fetch all delivery persons
export const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPerson.find();
    res.json(deliveryPersons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get delivery person by ID
export const getDeliveryPersonById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Delivery person ID is required" });
    }

    const deliveryPerson = await DeliveryPerson.findById(id);

    if (!deliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    res.status(200).json(deliveryPerson);
  } catch (error) {
    console.error("Error fetching delivery person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Add a new delivery person
export const addDeliveryPerson = async (req, res) => {
  try {
    const { name, email, password, phone, vehicleNumber, vehicleType } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDeliveryPerson = new DeliveryPerson({
      name,
      email,
      password: hashedPassword,
      phone,
      vehicleNumber,
      vehicleType,
    });

    const savedDeliveryPerson = await newDeliveryPerson.save();
    res.status(201).json(savedDeliveryPerson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a delivery person
export const updateDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status, profilePicture, vehicleNumber, vehicleType } = req.body;

    console.log("Received update data:", req.body); // Log incoming data

    // Build the update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (status) updateFields.status = status;
    if (profilePicture) updateFields.profilePicture = profilePicture;
    if (vehicleNumber) updateFields.vehicleNumber = vehicleNumber;
    if (vehicleType) updateFields.vehicleType = vehicleType;

    const updatedDeliveryPerson = await DeliveryPerson.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true } // Return updated doc
    );

    if (!updatedDeliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    console.log("Updated delivery person:", updatedDeliveryPerson); // Log result
    res.json(updatedDeliveryPerson);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Track delivery person by ID
export const trackDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Delivery person ID is required" });
    }

    const deliveryPerson = await DeliveryPerson.findById(id);

    if (!deliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    res.status(200).json({
      success: true,
      deliveryPerson: {
        name: deliveryPerson.name,
        currentLocation: deliveryPerson.currentLocation,
      },
    });
  } catch (error) {
    console.error("Error tracking delivery person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login delivery person
export const loginDeliveryPerson = async (req, res) => {
  const { email, password } = req.body;

  try {
    const deliveryPerson = await DeliveryPerson.findOne({ email });
    if (!deliveryPerson) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, deliveryPerson.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: deliveryPerson._id, email: deliveryPerson.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: deliveryPerson._id,
        name: deliveryPerson.name,
        email: deliveryPerson.email,
        phone: deliveryPerson.phone,
        vehicleNumber: deliveryPerson.vehicleNumber,
        vehicleType: deliveryPerson.vehicleType,
        status: deliveryPerson.status,
        currentLocation: deliveryPerson.currentLocation,
        profilePicture: deliveryPerson.profilePicture,
        rating: deliveryPerson.rating,
        totalDeliveries: deliveryPerson.totalDeliveries,
        assignedOrders: deliveryPerson.assignedOrders,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Login failed" });
  }
};


// Get delivery person details
export const getDeliveryPersonDetails = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(req.user.id).select("-password");
    if (!deliveryPerson) {
      return res.status(404).json({ error: "Delivery person not found" });
    }
    res.json(deliveryPerson);
  } catch (err) {
    console.error("Error fetching delivery person:", err);
    res.status(500).json({ error: "Failed to fetch delivery person details" });
  }
};

//Fetch assigned orders for the logged-in delivery person
export const getAssignedOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({ assignedDeliveryPerson: id });
    res.status(200).json(orders);
    console.log("orders fetched");
  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const MgetAssignedOrders = async (req, res) => {
  try {
    const deliveryPersonId = req.params.id;
    const orders = await Order.find({ assignedDeliveryPerson: deliveryPersonId, status: "assigned" }).populate("orderDetails");
    const ordersWithFallback = orders.map(order => ({
      ...order._doc,
      deliveryLocation: order.deliveryLocation && order.deliveryLocation.coordinates && order.deliveryLocation.coordinates.some(coord => coord !== 0)
        ? order.deliveryLocation
        : { type: "Point", coordinates: [80.1771, 9.6705], address: order.deliveryAddress || "Default Address" }, // Fallback to a valid location
      deliveryAddress: order.deliveryAddress || "Default Address",
    }));
    res.status(200).json(ordersWithFallback);
  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    res.status(500).json({ message: "Failed to fetch assigned orders" });
  }
};
// Fetch delivery activities (completed or failed orders)
// export const getDeliveryActivities = async (req, res) => {
//   try {
//     const deliveryPersonId = req.user.id;
//     const deliveredOrders = await DeliveredOrder.find({ assignedDeliveryPerson: deliveryPersonId }).lean();
//     const failedOrders = await FailedOrder.find({ assignedDeliveryPerson: deliveryPersonId }).lean();
//     const activities = [...deliveredOrders, ...failedOrders];
//     res.status(200).json(activities);
//   } catch (error) {
//     console.error("Error fetching delivery activities:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// Update delivery person's current location
export const updateCurrentLocation = async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;
    const { latitude, longitude } = req.body;

    const updatedDeliveryPerson = await DeliveryPerson.findByIdAndUpdate(
      deliveryPersonId,
      { currentLocation: { latitude, longitude } },
      { new: true }
    );

    if (!updatedDeliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    res.status(200).json(updatedDeliveryPerson);
  } catch (error) {
    console.error("Error updating current location:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout delivery person
// export const logoutDeliveryPerson = async (req, res) => {
//   try {
//     res.status(200).json({ message: "Logout successful" });
//   } catch (error) {
//     console.error("Error during logout:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// Update delivery person status
export const updateDeliveryPersonStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["available", "busy", "offline"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value", validStatuses });
    }

    const deliveryPerson = await DeliveryPerson.findById(id);
    if (!deliveryPerson) {
      return res.status(404).json({ success: false, message: "Delivery person not found" });
    }

    // If currently "busy", prevent manual status change unless explicitly allowed
    if (deliveryPerson.status === "busy" && status !== "busy") {
      return res.status(403).json({
        success: false,
        message: "Cannot change status while busy with an order",
      });
    }

    const updated = await DeliveryPerson.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({ success: true, deliveryPerson: updated });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// Accept an order
export const acceptOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { status = "accepted" } = req.body;
    console.log("Received request body:", req.body); // Add this
    console.log("Status value:", status); // Add this

    const validStatuses = ["accepted", "picked_up", "on_the_way", "delivered"];
    if (!validStatuses.includes(status)) {
      console.log("Invalid status received:", status); // Add this
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, assignedDeliveryPerson: req.user.id },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found or not assigned to you" });
    }

    if (status === "accepted") {
      await DeliveryPerson.findByIdAndUpdate(req.user.id, { status: "busy" });
    } else if (status === "delivered") {
      const deliveredOrder = new DeliveredOrder({
        orderId: order._id,
        customerName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        deliveryLocation: order.deliveryLocation,
        assignedDeliveryPerson: req.user.id,
        deliveryFee: order.deliveryFee || 0,
        deliveredAt: new Date()
      });
      await deliveredOrder.save();

      await DeliveryPerson.findByIdAndUpdate(req.user.id, {
        status: "available",
        $inc: { totalDeliveries: 1 },
        $pull: { assignedOrders: orderId }
      });

      await Order.deleteOne({ _id: orderId });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Reject an order
export const rejectOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, assignedDeliveryPerson: req.user.id },
      { status: "Rejected" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found or not assigned to you" });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Error rejecting order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Enhanced Logout (assuming BlacklistedToken model exists)
export const logoutDeliveryPerson = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Assuming BlacklistedToken model exists; if not, remove this part
    await BlacklistedToken.create({
      token: token,
      expiresAt: new Date(decoded.exp * 1000)
    });

    await DeliveryPerson.findByIdAndUpdate(decoded.id, {
      lastLogoutAt: new Date()
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;

    // 1. Get delivery person details
    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId)
      .select('-password')
      .lean();
    if (!deliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    // 2. Calculate today's date range (UTC to match deliveredAt)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // 3. Get today's delivered orders
    const deliveredOrders = await DeliveredOrder.find({
      assignedDeliveryPerson: deliveryPersonId,
      deliveredAt: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    // 4. Get active assigned orders
    const assignedOrders = await Order.find({
      assignedDeliveryPerson: deliveryPersonId,
      status: { $nin: ["Delivered", "Rejected", "Failed"] }
    }).lean();

    // 5. Filter orders for "Next Delivery" and "Pending Orders"
    const unacceptedOrders = assignedOrders.filter(o => o.status === "Processing Delivery");
    const acceptedOrders = assignedOrders.filter(o => o.status === "accepted");

    // 6. Calculate metrics
    const completedToday = deliveredOrders.length; // Today’s completed deliveries
    const earningsToday = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0); // Use totalPrice

    // 7. Prepare response
    const dashboardData = {
      status: deliveryPerson.status || "offline",
      earningsToday: earningsToday,
      location: {
        longitude: deliveryPerson.currentLocation?.longitude || deliveryPerson.currentLocation?.coordinates?.[0] || 70.2215,
        latitude: deliveryPerson.currentLocation?.latitude || deliveryPerson.currentLocation?.coordinates?.[1] || 8.729583
      },
      deliveries: {
        completed: completedToday, // Today’s count, not lifetime
        pending: acceptedOrders.length,
        total: deliveryPerson.totalDeliveries || 0, // Lifetime total kept separately
        nextDelivery: unacceptedOrders[0] ? {
          id: unacceptedOrders[0]._id,
          customerName: unacceptedOrders[0].customerName,
          distance: calculateDistance(
            deliveryPerson.currentLocation || { coordinates: [70.2215, 8.729583] },
            unacceptedOrders[0].deliveryLocation || { coordinates: [70.2215, 8.729583] }
          ),
          time: calculateEstimatedTime(
            deliveryPerson.currentLocation || { coordinates: [70.2215, 8.729583] },
            unacceptedOrders[0].deliveryLocation || { coordinates: [70.2215, 8.729583] }
          ),
          address: unacceptedOrders[0].deliveryAddress || "N/A",
          deliveryBy: unacceptedOrders[0].estimatedDeliveryTime || "ASAP",
          status: unacceptedOrders[0].status
        } : null,
        pendingOrders: acceptedOrders.map(order => ({
          id: order._id,
          customerName: order.customerName,
          distance: calculateDistance(
            deliveryPerson.currentLocation || { coordinates: [70.2215, 8.729583] },
            order.deliveryLocation || { coordinates: [70.2215, 8.729583] }
          ),
          address: order.deliveryAddress || "N/A",
          location: {
            longitude: order.deliveryLocation?.coordinates?.[0] || 70.2215,
            latitude: order.deliveryLocation?.coordinates?.[1] || 8.729583
          },
          status: order.status
        }))
      },
      alerts: []
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Dashboard error details:", {
      message: error.message,
      stack: error.stack,
      deliveryPersonId: req.user.id
    });
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// Helper functions
function calculateDistance(location1, location2) {
  if (!location1 || !location2) return "N/A";
  const lat1 = location1.latitude || location1.coordinates?.[1] || 0;
  const lon1 = location1.longitude || location1.coordinates?.[0] || 0;
  const lat2 = location2.latitude || location2.coordinates?.[1] || 0;
  const lon2 = location2.longitude || location2.coordinates?.[0] || 0;
  const latDiff = Math.abs(lat1 - lat2);
  const lonDiff = Math.abs(lon1 - lon2);
  const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Approx km
  return `${distance.toFixed(1)} km`;
}

function calculateEstimatedTime(location1, location2) {
  if (!location1 || !location2) return "N/A";
  const lat1 = location1.latitude || location1.coordinates?.[1] || 0;
  const lon1 = location1.longitude || location1.coordinates?.[0] || 0;
  const lat2 = location2.latitude || location2.coordinates?.[1] || 0;
  const lon2 = location2.longitude || location2.coordinates?.[0] || 0;
  const latDiff = Math.abs(lat1 - lat2);
  const lonDiff = Math.abs(lon1 - lon2);
  const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;
  const time = distance * 3; // Approx minutes (assuming 20km/h average speed)
  return `${Math.round(time)} mins`;
}

// NEW: Update Location
export const updateLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    const deliveryPersonId = req.user.id;

    const updatedPerson = await DeliveryPerson.findByIdAndUpdate(
      deliveryPersonId,
      { 
        currentLocation: {
          type: "Point",
          coordinates: [longitude, latitude],
          address: req.body.address || ""
        },
        lastActive: new Date()
      },
      { new: true }
    );

    req.app.get('io').emit('locationUpdate', {
      deliveryPersonId,
      location: updatedPerson.currentLocation
    });

    res.status(200).json(updatedPerson);
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Complete Delivery
export const completeDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deliveryPersonId = req.user.id;

    console.log("Completing delivery:", { orderId, deliveryPersonId });

    // Find the order using string ID
    const order = await Order.findOne({ _id: orderId, assignedDeliveryPerson: deliveryPersonId });
    if (!order) {
      return res.status(404).json({ message: "Order not found or not assigned to you" });
    }
    console.log("Found order:", order);

    // Calculate totalPrice if not directly available in Order schema
    const totalPrice = (order.totalPrice || 0) + (order.deliveryFee || 0);

    // Create a new DeliveredOrder entry with totalPrice
    const deliveredOrder = new DeliveredOrder({
      orderId: order._id,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: order.deliveryLocation || { type: "Point", coordinates: [0, 0] },
      assignedDeliveryPerson: deliveryPersonId,
      deliveryFee: order.deliveryFee || 0,
      totalPrice: totalPrice, // Added totalPrice
      deliveredAt: new Date()
    });
    await deliveredOrder.save();
    console.log("Saved delivered order:", deliveredOrder);

    // Update DeliveryPerson
    await DeliveryPerson.findByIdAndUpdate(
      deliveryPersonId,
      {
        $set: { status: "available" },
        $pull: { assignedOrders: orderId },
        $inc: { totalDeliveries: 1 }
      },
      { new: true }
    );
    console.log("Updated delivery person");

    // Remove from Order collection
    await Order.deleteOne({ _id: orderId });
    console.log("Deleted order from Order collection");

    res.status(200).json({ success: true, message: "Delivery completed" });
  } catch (error) {
    console.error("Delivery completion error:", {
      message: error.message,
      stack: error.stack,
      orderId: req.body.orderId,
      deliveryPersonId: req.user?.id
    });
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// Mark order as in-transit
export const markInTransit = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const deliveryPersonId = req.user.id;

    const order = await Order.findOneAndUpdate(
      { 
        _id: orderId, 
        assignedDeliveryPerson: deliveryPersonId,
        status: { $in: ["accepted", "picked_up"] }
      },
      { 
        status: "in_transit",
        inTransitAt: new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found, not assigned to you, or cannot be marked as in-transit"
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("In-transit error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Mark order as failed
export const failDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const deliveryPersonId = req.user.id;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide a valid reason (minimum 10 characters)"
      });
    }

    const order = await Order.findOne({ 
      _id: orderId, 
      assignedDeliveryPerson: deliveryPersonId,
      status: { $in: ["accepted", "picked_up", "on_the_way"] } // Reverted to yesterday's statuses
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found, not assigned to you, or cannot be marked as failed"
      });
    }

    const failedOrder = new FailedOrder({
      orderId: order._id,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: order.deliveryLocation || { type: "Point", coordinates: [0, 0] },
      assignedDeliveryPerson: deliveryPersonId,
      failureReason: reason,
      failedAt: new Date()
    });
    await failedOrder.save();

    await DeliveryPerson.findByIdAndUpdate(
      deliveryPersonId,
      { 
        status: "available",
        $pull: { assignedOrders: orderId }
      }
    );

    await Order.deleteOne({ _id: orderId });

    res.status(200).json({
      success: true,
      message: "Order marked as failed"
    });
  } catch (error) {
    console.error("Delivery failure error:", {
      message: error.message,
      stack: error.stack,
      orderId: req.params.orderId,
      deliveryPersonId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getDeliveryActivities = async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;
    const deliveredOrders = await DeliveredOrder.find({ assignedDeliveryPerson: deliveryPersonId }).lean();
    const failedOrders = await FailedOrder.find({ assignedDeliveryPerson: deliveryPersonId }).lean();
    
    res.status(200).json({
      completed: deliveredOrders,
      failed: failedOrders
    });
  } catch (error) {
    console.error("Error fetching delivery activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// In controllers/deliveryPersonController.js
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log("Change password request:", { id, currentPassword, newPassword });

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    // Find the delivery person
    const deliveryPerson = await DeliveryPerson.findById(id);
    if (!deliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    console.log("Current hashed password:", deliveryPerson.password);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, deliveryPerson.password || "");
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    console.log("New hashed password:", hashedNewPassword);

    // Update only the password field, bypassing full validation
    await DeliveryPerson.updateOne(
      { _id: id },
      { $set: { password: hashedNewPassword } }
    );

    console.log("Password updated successfully for:", id);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const deleteDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the delivery person exists
    const deliveryPerson = await DeliveryPerson.findById(id);
    if (!deliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    // Delete the delivery person
    await DeliveryPerson.findByIdAndDelete(id);

    res.status(200).json({ message: "Delivery person deleted successfully" });
  } catch (error) {
    console.error("Error deleting delivery person:", error);
    res.status(500).json({ message: "Server error while deleting delivery person" });
  }
};
// Track an order by ID
export const trackOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Check if the order exists in the active orders
    let order = await Order.findById(orderId).populate("assignedDeliveryPerson");
    let status = "active";
    let deliveryPerson = null;
    let deliveredAt = null;
    let failedAt = null;
    let failureReason = null;

    // If not found in active orders, check delivered or failed orders
    if (!order) {
      const deliveredOrder = await DeliveredOrder.findOne({ orderId });
      if (deliveredOrder) {
        status = "delivered";
        deliveryPerson = await DeliveryPerson.findById(deliveredOrder.assignedDeliveryPerson);
        deliveredAt = deliveredOrder.deliveredAt;
      } else {
        const failedOrder = await FailedOrder.findOne({ orderId });
        if (failedOrder) {
          status = "failed";
          deliveryPerson = await DeliveryPerson.findById(failedOrder.assignedDeliveryPerson);
          failedAt = failedOrder.failedAt;
          failureReason = failedOrder.failureReason;
        } else {
          return res.status(404).json({ message: "Order not found" });
        }
      }
    } else {
      deliveryPerson = order.assignedDeliveryPerson;
    }

    if (!deliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found for this order" });
    }

    // Prepare the response with all required fields
    const trackingData = {
      _id: orderId, // Matches frontend expectation
      status: order ? order.status : status,
      customerName: order ? order.customerName : (status === "delivered" ? deliveredOrder.customerName : failedOrder.customerName),
      customerEmail: order?.customerEmail || "Not provided", // Fallback as per frontend
      phone: order ? order.phone : (status === "delivered" ? deliveredOrder.phone : failedOrder.phone),
      orderType: order ? order.orderType : (status === "delivered" ? deliveredOrder.orderType : failedOrder.orderType),
      deliveryAddress: order ? order.deliveryAddress : (status === "delivered" ? deliveredOrder.deliveryAddress : failedOrder.deliveryAddress),
      deliveryLocation: order ? order.deliveryLocation : (status === "delivered" ? deliveredOrder.deliveryLocation : failedOrder.deliveryLocation),
      deliveryFee: order ? order.deliveryFee : (status === "delivered" ? deliveredOrder.deliveryFee : failedOrder.deliveryFee) || 0,
      deliveryNotes: order ? order.deliveryNotes : (status === "delivered" ? deliveredOrder.deliveryNotes : failedOrder.deliveryNotes),
      items: order ? order.items : (status === "delivered" ? deliveredOrder.items : failedOrder.items) || [],
      totalPrice: order ? order.totalPrice : (status === "delivered" ? deliveredOrder.totalPrice : failedOrder.totalPrice) || 0,
      currentLocation: {
        latitude: deliveryPerson.currentLocation?.coordinates?.[1] || 6.9271, // Fallback to default as per frontend
        longitude: deliveryPerson.currentLocation?.coordinates?.[0] || 79.8612,
      },
      deliveredAt: deliveredAt || undefined,
      failedAt: failedAt || undefined,
      failureReason: failureReason || undefined,
      deliveryPerson: {
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        vehicleNumber: deliveryPerson.vehicleNumber,
        vehicleType: deliveryPerson.vehicleType,
      },
    };

    res.status(200).json(trackingData);
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const updateDeliveryLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    const deliveryPersonId = req.user.id;

    // Update the delivery person's location
    const updatedPerson = await DeliveryModel.findByIdAndUpdate(
      deliveryPersonId,
      {
        currentLocation: {
          type: "Point",
          coordinates: [longitude, latitude],
          address: req.body.address || "",
        },
        lastActive: new Date(),
      },
      { new: true }
    );

    if (!updatedPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    // Use the HTTP Socket.IO instance to emit location updates
    const ioHttp = req.app.get("ioHttp");
    if (ioHttp) {
      ioHttp.emit("locationUpdate", {
        deliveryPersonId,
        location: updatedPerson.currentLocation,
      });
      console.log("Location update emitted via HTTP Socket.IO:", {
        deliveryPersonId,
        location: updatedPerson.currentLocation,
      });
    } else {
      console.error("HTTP Socket.IO instance (ioHttp) not found");
    }

    res.status(200).json(updatedPerson);
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const MgetDeliveryPersonById = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryModel.findById(req.params.id);
    if (!deliveryPerson) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    const isInvalidLocation =
      !deliveryPerson.currentLocation ||
      !deliveryPerson.currentLocation.coordinates ||
      (deliveryPerson.currentLocation.coordinates[0] === 0 && deliveryPerson.currentLocation.coordinates[1] === 0);

    const deliveryPersonWithFallback = {
      ...deliveryPerson._doc,
      currentLocation: isInvalidLocation
        ? { type: "Point", coordinates: [79.8612, 6.9271], address: "Colombo" }
        : deliveryPerson.currentLocation,
    };
    res.status(200).json(deliveryPersonWithFallback);
  } catch (error) {
    console.error("Error fetching delivery person:", error);
    res.status(500).json({ message: "Failed to fetch delivery person" });
  }
};
export const getDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryModel.find();
    const deliveryPersonsWithFallback = deliveryPersons.map(person => {
      const isInvalidLocation =
        !person.currentLocation ||
        !person.currentLocation.coordinates ||
        (person.currentLocation.coordinates[0] === 0 && person.currentLocation.coordinates[1] === 0);

      return {
        ...person._doc,
        currentLocation: isInvalidLocation
          ? { type: "Point", coordinates: [79.8612, 6.9271], address: "Colombo" } // Default to Colombo
          : person.currentLocation,
      };
    });
    res.status(200).json(deliveryPersonsWithFallback);
  } catch (error) {
    console.error("Error fetching delivery persons:", error);
    res.status(500).json({ message: "Failed to fetch delivery persons" });
  }
};



// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY
  },
  tls: {
    rejectUnauthorized: false // For development only
  }
});


// Password Reset Functions
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  console.log("Password reset requested for:", email); // Debug log

  try {
    // 1. Find delivery person with error handling
    const deliveryPerson = await DeliveryPerson.findOne({ email })
      .maxTimeMS(5000) // 5 second timeout
      .catch(err => {
        console.error("DB Query Error:", err);
        throw new Error("Database operation failed");
      });

    if (!deliveryPerson) {
      console.log("No user found for email:", email);
      return res.status(404).json({ error: "No account with that email exists" });
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 15 * 60 * 1000;
    console.log("Generated OTP:", otp); // Debug log

    // 3. Update document
    deliveryPerson.resetPasswordOTP = otp;
    deliveryPerson.resetPasswordExpires = new Date(otpExpiry);
    
    await deliveryPerson.save({ validateBeforeSave: false })
      .catch(err => {
        console.error("Save Error:", err);
        throw new Error("Failed to save OTP");
      });

    // 4. Send email with error handling
    const mailOptions = {
      from: `"Delivery Hub" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `Your OTP code is: <strong>${otp}</strong> (valid for 15 minutes)`
    };

    console.log("Attempting to send email..."); // Debug log
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully"); // Debug log

    res.status(200).json({ 
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV === 'development' ? otp : null
    });

  } catch (error) {
    console.error("Full Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to process request",
      debug: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
};
export const verifyPasswordResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const deliveryPerson = await DeliveryPerson.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!deliveryPerson) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const tempToken = jwt.sign(
      { 
        id: deliveryPerson._id, 
        email: deliveryPerson.email,
        otp: otp // Include OTP in the token for additional verification
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({ 
      message: "OTP verified",
      tempToken 
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};
export const resetPassword = async (req, res) => {
  const { tempToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const deliveryPerson = await DeliveryPerson.findById(decoded.id);

    if (!deliveryPerson) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    deliveryPerson.password = hashedPassword;
    deliveryPerson.resetPasswordOTP = undefined;
    deliveryPerson.resetPasswordExpires = undefined;
    await deliveryPerson.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ 
      error: error.name === 'TokenExpiredError' ? "Token expired" : "Failed to reset password"
    });
  }
};