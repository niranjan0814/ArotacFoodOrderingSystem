import express from "express";
import {
  addDeliveryPerson,
  getAllDeliveryPersons,
  getDeliveryPersonById,
  updateDeliveryPerson,
  trackDeliveryPerson,
  loginDeliveryPerson,
  getDeliveryPersonDetails,
  getAssignedOrders,
  getDeliveryActivities,
  logoutDeliveryPerson,
  updateDeliveryPersonStatus,
  acceptOrder,
  rejectOrder,
  getDashboardData,
  updateLocation,
  completeDelivery,
  failDelivery,
  deleteDeliveryPerson,
  trackOrder,
  changePassword,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} from "../controllers/deliveryPersonController.js";

// const { authenticateDeliveryPerson } = require("../middleware/authMiddleware");
import verifyToken from "../middleware/verifyToken.js";
const router = express.Router();

// Public Routes
router.post("/add", addDeliveryPerson);
router.get("/", getAllDeliveryPersons);
router.post("/login", loginDeliveryPerson);


// Protected Routes (require verifyToken)
// Dashboard Routes - MUST COME BEFORE PARAMETERIZED ROUTES
router.get("/dashboard", verifyToken, getDashboardData);
router.put("/location", verifyToken, updateLocation);

// Delivery Person Routes
router.get("/:id", verifyToken, getDeliveryPersonById);
router.put("/:id", verifyToken, updateDeliveryPerson);
router.post("/:id/changepassword", verifyToken, changePassword);
// Order Management
router.get("/:id/assigned-orders", verifyToken, getAssignedOrders);
router.get("/:id/delivery-activities", verifyToken, getDeliveryActivities);
router.put("/:id/status", verifyToken, updateDeliveryPersonStatus);

// Order Actions
router.put("/:id/accept", verifyToken, acceptOrder);
router.put("/:id/reject", verifyToken, rejectOrder);
router.post("/orders/:orderId/complete-delivery", verifyToken, completeDelivery);
router.post("/orders/:orderId/fail", verifyToken, failDelivery); // Reverted to POST and original path

// Session Management
router.post("/logout", verifyToken, logoutDeliveryPerson);

// Tracking
router.get("/:id/track", trackDeliveryPerson);
router.delete("/:id", verifyToken, deleteDeliveryPerson);
router.get("/track/:id", verifyToken, trackOrder);
// Password Reset Routes
router.post('/forgot-password', requestPasswordReset);
router.post('/verify-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPassword);
// In deliveryPersonRoutes.js
router.put("/:id/assign-delivery", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body; // Expect deliveryPersonId from the request body

    // Find the order and update the assignedDeliveryPerson
    const order = await Order.findByIdAndUpdate(
      orderId,
      { assignedDeliveryPerson: deliveryPersonId, status: "Processing Delivery" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Delivery person assigned successfully", order });
  } catch (error) {
    console.error("Error assigning delivery person:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

export default router;