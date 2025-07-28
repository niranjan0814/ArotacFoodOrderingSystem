// orderRoutes.js
import express from 'express';
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  assignDeliveryPerson,
  rejectOrder,
  closeOrder,
  getProcessedOrders,
  getHomeOrders,
  getInRestaurantOrders,
  getAssignedOrders
} from "../controllers/orderController.js";

const router = express.Router();

// Order Management Routes
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.put("/:id/payment-status", updatePaymentStatus);
router.put("/:id/assign-delivery", assignDeliveryPerson);
router.put("/:id/reject", rejectOrder);
router.put("/:id/close", closeOrder);

// Processed Orders Route
router.get("/processed-orders", getProcessedOrders);

// Home Orders Route
router.get("/home-orders", getHomeOrders);

// In-Restaurant Orders Route
router.get("/in-restaurant-orders", getInRestaurantOrders);
router.get("/Sorders/assigned", getAssignedOrders);

export default router;