import Order from "../models/orderModel.js";
import ProcessedOrder from "../models/processedOrderModel.js";
import DeliveryPerson from "../models/deliveryPersonModel.js";
import mongoose from "mongoose";
import HomeOrder from "../models/OrderHome.js";

// Fetch all orders with filters
export const getAllOrders = async (req, res) => {
  try {
    const { orderType, paymentStatus, startDate, endDate } = req.query;
    let filter = {};

    // Filter by order type
    if (orderType) {
      filter.orderType = { $in: orderType.split(",") };
    }

    // Filter by payment status
    if (paymentStatus) {
      filter.paymentStatus = { $in: paymentStatus.split(",") };
    }

    // Filter by date range
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate), // Greater than or equal to start date
        $lte: new Date(endDate),   // Less than or equal to end date
      };
    }

    // Fetch orders from the database
    const orders = await Order.find(filter);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id; // This is the custom _id from Order (e.g., "ODR1001")
    const newStatus = req.body.status;

    // Validate the status for Order
    const validOrderStatuses = [
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
    ];
    if (!validOrderStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status value for Order. Valid statuses are: ${validOrderStatuses.join(", ")}` });
    }

    // Map Order status to HomeOrder status
    const statusMap = {
      "Pending": "pending",
      "Preparing": "preparing",
      "Ready": "ready",
      "Processing Delivery": "processing",
      "Out for Delivery": "out-for-delivery",
      "Delivered": "delivered",
      "Rejected": "rejected",
      "Accepted": "accepted",
      "Failed": "rejected", // Map "Failed" to "rejected" for HomeOrder
      "cancelled": "cancelled"
    };

    const homeOrderStatus = statusMap[newStatus];
    if (!homeOrderStatus) {
      return res.status(400).json({ error: `No mapping found for status "${newStatus}" in HomeOrder` });
    }

    // Validate the status for HomeOrder
    const validHomeOrderStatuses = [
      "pending",
      "preparing",
      "ready",
      "processing",
      "out-for-delivery",
      "delivered",
      "rejected",
      "making",
      "cancelled"
    ];
    if (!validHomeOrderStatuses.includes(homeOrderStatus)) {
      return res.status(400).json({ error: `Invalid status value for HomeOrder: ${homeOrderStatus}` });
    }

    // Update Order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update the corresponding HomeOrder using mainOrderId
    const updatedHomeOrder = await HomeOrder.findOneAndUpdate(
      { mainOrderId: orderId },
      { status: homeOrderStatus },
      { new: true }
    );

    if (!updatedHomeOrder) {
      return res.status(404).json({ error: "HomeOrder not found for this Order" });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
      homeOrder: updatedHomeOrder
    });
  } catch (err) {
    console.error("Error updating order status:", err.stack);
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Update payment status (only for cash payments)
export const updatePaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentMethod === "Online Pay") {
      return res.status(400).json({ message: "Cannot update payment status for online payments" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: req.body.paymentStatus },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign delivery person
export const assignDeliveryPerson = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { assignedDeliveryPerson } = req.body;

    // Find order by either _id or orderNumber
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderNumber: orderId }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate delivery person ID
    if (!mongoose.Types.ObjectId.isValid(assignedDeliveryPerson)) {
      return res.status(400).json({ error: "Invalid delivery person ID format" });
    }

    // Check if delivery person exists
    const deliveryPerson = await DeliveryPerson.findById(assignedDeliveryPerson);
    if (!deliveryPerson) {
      return res.status(404).json({ error: "Delivery person not found" });
    }

    // Only require location for delivery orders
    if (order.orderType === "delivery") {
      // Set default location if not provided
      if (!order.deliveryLocation?.coordinates) {
        order.deliveryLocation = {
          type: "Point",
          coordinates: [0, 0], // Default coordinates
          address: order.deliveryAddress || "Address not specified"
        };
      }
    }

    // Update order
    order.assignedDeliveryPerson = assignedDeliveryPerson;
    order.status = "Processing Delivery";
    await order.save();

    // Update the corresponding HomeOrder using mainOrderId
    const updatedHomeOrder = await HomeOrder.findOneAndUpdate(
      { mainOrderId: orderId },
      { 
        status: "processing",
        assignedDeliveryPerson: assignedDeliveryPerson
      },
      { new: true }
    );

    if (!updatedHomeOrder) {
      return res.status(404).json({ error: "HomeOrder not found for this Order" });
    }

    // Update delivery person
    await DeliveryPerson.findByIdAndUpdate(
      assignedDeliveryPerson,
      { $addToSet: { assignedOrders: order._id } }
    );

    res.json({
      message: "Delivery person assigned successfully",
      updatedOrder: order,
      updatedHomeOrder: updatedHomeOrder
    });
  } catch (err) {
    console.error("Error in assignDeliveryPerson:", err);
    res.status(500).json({ 
      error: "Server error during assignment",
      details: err.message 
    });
  }
};

// Reject an order
export const rejectOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Update Order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "Rejected" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update HomeOrder
    const updatedHomeOrder = await HomeOrder.findOneAndUpdate(
      { mainOrderId: orderId },
      { status: "rejected" },
      { new: true }
    );

    if (!updatedHomeOrder) {
      return res.status(404).json({ error: "HomeOrder not found for this Order" });
    }

    res.json({
      success: true,
      message: "Order rejected successfully",
      order: updatedOrder,
      homeOrder: updatedHomeOrder
    });
  } catch (err) {
    console.error("Error rejecting order:", err.stack);
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Close an order
export const closeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("Order not found with ID:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }

    // Create a new processed order with the status set to "Closed"
    const processedOrder = new ProcessedOrder({
      ...order.toObject(), // Copy all fields from the original order
      status: "Closed", // Override the status to "Closed"
    });

    await processedOrder.save();
    console.log("Processed Order created:", processedOrder);

    // Update the corresponding HomeOrder using mainOrderId
    const updatedHomeOrder = await HomeOrder.findOneAndUpdate(
      { mainOrderId: orderId },
      { status: "delivered" },
      { new: true }
    );

    if (!updatedHomeOrder) {
      console.error("HomeOrder not found for Order ID:", orderId);
      return res.status(404).json({ error: "HomeOrder not found for this Order" });
    }

    // Delete the order from the Order collection
    await Order.findByIdAndDelete(orderId);
    console.log("Order deleted from Order collection:", orderId);

    res.json({ 
      message: "Order closed successfully", 
      processedOrder,
      updatedHomeOrder
    });
  } catch (err) {
    console.error("Error closing order:", err.stack);
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Fetch home orders with filters
export const getHomeOrders = async (req, res) => {
  try {
    const { paymentStatus, startDate, endDate } = req.query;
    let filter = { orderType: "delivery" }; // Only fetch delivery orders

    // Filter by payment status
    if (paymentStatus) {
      filter.paymentStatus = { $in: paymentStatus.split(",") };
    }

    // Filter by date range
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch home orders from the database
    const homeOrders = await Order.find(filter);
    res.json(homeOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch in-restaurant orders with filters
export const getInRestaurantOrders = async (req, res) => {
  try {
    const { orderType, paymentStatus, startDate, endDate } = req.query;
    let filter = { orderType: { $in: ["dine-in", "takeaway"] } }; // Only fetch dine-in and takeaway orders

    // Filter by order type
    if (orderType) {
      filter.orderType = { $in: orderType.split(",") };
    }

    // Filter by payment status
    if (paymentStatus) {
      filter.paymentStatus = { $in: paymentStatus.split(",") };
    }

    // Filter by date range
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch in-restaurant orders from the database
    const inRestaurantOrders = await Order.find(filter);
    res.json(inRestaurantOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch all processed orders with filtering
export const getProcessedOrders = async (req, res) => {
  try {
    const { orderType, paymentStatus, startDate, endDate } = req.query;
    let filter = {};

    // Filter by order type
    if (orderType) {
      filter.orderType = { $in: orderType.split(",") };
    }

    // Filter by payment status
    if (paymentStatus) {
      filter.paymentStatus = { $in: paymentStatus.split(",") };
    }

    // Filter by date range
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate), // Greater than or equal to start date
        $lte: new Date(endDate),   // Less than or equal to end date
      };
    }

    // Fetch processed orders from the database
    const processedOrders = await ProcessedOrder.find(filter);
    res.json(processedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get assigned orders for a delivery person
export const getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPersonId: req.user.id });
    res.json(orders); // Ensure this is an array
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned orders", error });
  }
};

// import Order from "../models/orderModel.js";
// import ProcessedOrder from "../models/processedOrderModel.js";
// import DeliveryPerson from "../models/deliveryPersonModel.js";
// import mongoose from "mongoose";
// import HomeOrder from "../models/OrderHome.js";

// // Fetch all orders with filters
// export const getAllOrders = async (req, res) => {
//     try {
//       const { orderType, paymentStatus, startDate, endDate } = req.query;
//       let filter = {};
  
//       // Filter by order type
//       if (orderType) {
//         filter.orderType = { $in: orderType.split(",") };
//       }
  
//       // Filter by payment status
//       if (paymentStatus) {
//         filter.paymentStatus = { $in: paymentStatus.split(",") };
//       }
  
//       // Filter by date range
//       if (startDate && endDate) {
//         filter.createdAt = {
//           $gte: new Date(startDate), // Greater than or equal to start date
//           $lte: new Date(endDate),   // Less than or equal to end date
//         };
//       }
  
//       // Fetch orders from the database
//       const orders = await Order.find(filter);
//       res.json(orders);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   };

// // Fetch order by ID
// export const getOrderById = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: "Order not found" });
//     res.json(order);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Update order status
// export const updateOrderStatus = async (req, res) => {
//   try {
//     const orderId = req.params.id; // This is the custom _id from SOrder (e.g., "ODR1001")
//     const newStatus = req.body.status;

//     // Validate the status (optional, based on your schema)
//     const validStatuses = [
//       "Pending",
//       "Preparing",
//       "Ready",
//       "Processing Delivery",
//       "Out for Delivery",
//       "Delivered",
//       "Rejected",
//       "Accepted",
//       "Failed",
//       "cancelled"
//     ];
//     if (!validStatuses.includes(newStatus)) {
//       return res.status(400).json({ error: "Invalid status value" });
//     }

//     // Update SOrder
//     const updatedSOrder = await SOrder.findByIdAndUpdate(
//       orderId,
//       { status: newStatus },
//       { new: true }
//     );

//     if (!updatedSOrder) {
//       return res.status(404).json({ error: "SOrder not found" });
//     }

//     // Update the corresponding HomeOrder using mainOrderId
//     const updatedHomeOrder = await HomeOrder.findOneAndUpdate(
//       { mainOrderId: orderId },
//       { status: newStatus.toLowerCase() }, // HomeOrder uses lowercase status
//       { new: true }
//     );

//     if (!updatedHomeOrder) {
//       return res.status(404).json({ error: "HomeOrder not found for this SOrder" });
//     }

//     res.json({
//       success: true,
//       message: "Order status updated successfully",
//       sOrder: updatedSOrder,
//       homeOrder: updatedHomeOrder
//     });
//   } catch (err) {
//     console.error("Error updating order status:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Update payment status (only for cash payments)
// export const updatePaymentStatus = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     if (order.paymentMethod === "Online Pay") {
//       return res.status(400).json({ message: "Cannot update payment status for online payments" });
//     }

//     const updatedOrder = await Order.findByIdAndUpdate(
//       req.params.id,
//       { paymentStatus: req.body.paymentStatus },
//       { new: true }
//     );
//     res.json(updatedOrder);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // orderController.js
// // orderController.js
// export const assignDeliveryPerson = async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const { assignedDeliveryPerson } = req.body;

//     // Find order by either _id or orderNumber
//     const order = await Order.findOne({
//       $or: [
//         { _id: orderId },
//         { orderNumber: orderId }
//       ]
//     });

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Validate delivery person ID
//     if (!mongoose.Types.ObjectId.isValid(assignedDeliveryPerson)) {
//       return res.status(400).json({ error: "Invalid delivery person ID format" });
//     }

//     // Check if delivery person exists
//     const deliveryPerson = await DeliveryPerson.findById(assignedDeliveryPerson);
//     if (!deliveryPerson) {
//       return res.status(404).json({ error: "Delivery person not found" });
//     }

//     // Only require location for delivery orders
//     if (order.orderType === "delivery") {
//       // Set default location if not provided
//       if (!order.deliveryLocation?.coordinates) {
//         order.deliveryLocation = {
//           type: "Point",
//           coordinates: [0, 0], // Default coordinates
//           address: order.deliveryAddress || "Address not specified"
//         };
//       }
//     }

//     // Update order
//     order.assignedDeliveryPerson = assignedDeliveryPerson;
//     order.status = "Processing Delivery";
//     await order.save();

//     // Update delivery person
//     await DeliveryPerson.findByIdAndUpdate(
//       assignedDeliveryPerson,
//       { $addToSet: { assignedOrders: order._id } }
//     );

//     res.json({
//       message: "Delivery person assigned successfully",
//       updatedOrder: order
//     });
//   } catch (err) {
//     console.error("Error in assignDeliveryPerson:", err);
//     res.status(500).json({ 
//       error: "Server error during assignment",
//       details: err.message 
//     });
//   }
// };
// // Reject an order
// export const rejectOrder = async (req, res) => {
//   try {
//     const updatedOrder = await Order.findByIdAndUpdate(
//       req.params.id,
//       { status: "Rejected" },
//       { new: true }
//     );
//     res.json(updatedOrder);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Close an order
// // export const closeOrder = async (req, res) => {
// //   try {
// //     const order = await Order.findById(req.params.id);
// //     if (!order) return res.status(404).json({ message: "Order not found" });

// //     // Create a new processed order
// //     const processedOrder = new ProcessedOrder(order.toObject());
// //     await processedOrder.save();

// //     // Delete the order from the Order collection
// //     await Order.findByIdAndDelete(req.params.id);

// //     res.json({ message: "Order closed successfully", processedOrder });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // };
// // Fetch home orders with filters
// export const getHomeOrders = async (req, res) => {
//     try {
//       const { paymentStatus, startDate, endDate } = req.query;
//       let filter = { orderType: "delivery" }; // Only fetch delivery orders
  
//       // Filter by payment status
//       if (paymentStatus) {
//         filter.paymentStatus = { $in: paymentStatus.split(",") };
//       }
  
//       // Filter by date range
//       if (startDate && endDate) {
//         filter.createdAt = {
//           $gte: new Date(startDate),
//           $lte: new Date(endDate),
//         };
//       }
  
//       // Fetch home orders from the database
//       const homeOrders = await Order.find(filter);
//       res.json(homeOrders);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   };
  
//   // Fetch in-restaurant orders with filters
//   export const getInRestaurantOrders = async (req, res) => {
//     try {
//       const { orderType, paymentStatus, startDate, endDate } = req.query;
//       let filter = { orderType: { $in: ["dine-in", "takeaway"] } }; // Only fetch dine-in and takeaway orders
  
//       // Filter by order type
//       if (orderType) {
//         filter.orderType = { $in: orderType.split(",") };
//       }
  
//       // Filter by payment status
//       if (paymentStatus) {
//         filter.paymentStatus = { $in: paymentStatus.split(",") };
//       }
  
//       // Filter by date range
//       if (startDate && endDate) {
//         filter.createdAt = {
//           $gte: new Date(startDate),
//           $lte: new Date(endDate),
//         };
//       }
  
//       // Fetch in-restaurant orders from the database
//       const inRestaurantOrders = await Order.find(filter);
//       res.json(inRestaurantOrders);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   };
  

// // Fetch all processed orders with filtering
// export const getProcessedOrders = async (req, res) => {
//   try {
//     const { orderType, paymentStatus, startDate, endDate } = req.query;
//     let filter = {};

//     // Filter by order type
//     if (orderType) {
//       filter.orderType = { $in: orderType.split(",") };
//     }

//     // Filter by payment status
//     if (paymentStatus) {
//       filter.paymentStatus = { $in: paymentStatus.split(",") };
//     }

//     // Filter by date range
//     if (startDate && endDate) {
//       filter.createdAt = {
//         $gte: new Date(startDate), // Greater than or equal to start date
//         $lte: new Date(endDate),   // Less than or equal to end date
//       };
//     }

//     // Fetch processed orders from the database
//     const processedOrders = await ProcessedOrder.find(filter);
//     res.json(processedOrders);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// export const closeOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       console.error("Order not found with ID:", req.params.id);
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Create a new processed order with the status set to "Closed"
//     const processedOrder = new ProcessedOrder({
//       ...order.toObject(), // Copy all fields from the original order
//       status: "Closed", // Override the status to "Closed"
//     });

//     await processedOrder.save();
//     console.log("Processed Order created:", processedOrder);

//     // Delete the order from the Order collection
//     await Order.findByIdAndDelete(req.params.id);
//     console.log("Order deleted from Order collection:", req.params.id);

//     res.json({ message: "Order closed successfully", processedOrder });
//   } catch (err) {
//     console.error("Error closing order:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
// // Get assigned orders for a delivery person
// export const getAssignedOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ deliveryPersonId: req.user.id });
//     res.json(orders); // Ensure this is an array
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching assigned orders", error });
//   }
// };