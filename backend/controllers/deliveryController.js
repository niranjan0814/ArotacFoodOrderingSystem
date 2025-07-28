import DeliveredOrder from "../models/deliveredOrderModel.js";
import FailedOrder from "../models/failedOrderModel.js";

// Get all delivered orders
export const getDeliveredOrders = async (req, res) => {
  try {
    const deliveredOrders = await DeliveredOrder.find()
      .populate("assignedDeliveryPerson", "name") // Populate delivery person name (assuming DeliveryPerson model has a 'name' field)
      .sort({ deliveredAt: -1 }); // Sort by delivery date, newest first
    res.status(200).json(deliveredOrders);
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
    res.status(500).json({ message: "Server error while fetching delivered orders" });
  }
};

// Get all failed orders
export const getFailedOrders = async (req, res) => {
  try {
    const failedOrders = await FailedOrder.find()
      .populate("assignedDeliveryPerson", "name") // Populate delivery person name
      .sort({ failedAt: -1 }); // Sort by failure date, newest first
    res.status(200).json(failedOrders);
  } catch (error) {
    console.error("Error fetching failed orders:", error);
    res.status(500).json({ message: "Server error while fetching failed orders" });
  }
};