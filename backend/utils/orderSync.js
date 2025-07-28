// import mongoose from "mongoose";
// import SOrder from "../models/orderModel.js"; // Corrected path based on your structure

// const syncOrderToMainModel = async (orderData, customerType) => {
//   try {
//     const mainOrderData = {
//       customerName: "Unknown",
//       phone: "N/A",
//       orderType: "delivery",
//       status: "Pending",
//       paymentMethod: "Cash Pay",
//       paymentStatus: "Pending",
//       items: [],
//       totalPrice: 0,
//       deliveryFee: 0,
//       createdAt: new Date(),
//     };

//     if (customerType === "home") {
//       mainOrderData.customerName = orderData.userId ? `User_${orderData.userId}` : "Unknown";
//       mainOrderData.phone = orderData.phoneNumber || "N/A"; // Corrected phone logic
//       mainOrderData.orderType = "delivery";
//       mainOrderData.deliveryAddress = orderData.address;
//       mainOrderData.status = orderData.status === "delivered" ? "Delivered" :
//                             orderData.status === "cancelled" ? "Rejected" :
//                             orderData.status === "making" ? "Preparing" : "Pending";
//       mainOrderData.items = orderData.order.map(item => ({
//         name: item.name,
//         quantity: item.quantity,
//         // price: item.price,
//       }));
//       mainOrderData.totalPrice = orderData.order.reduce((sum, item) => sum + item.price * item.quantity, 0);
//       mainOrderData.deliveryFee = 5;
//     } else if (customerType === "in-restaurant") {
//       mainOrderData.customerName = orderData.user ? `User_${orderData.user}` : "Unknown";
//       mainOrderData.phone = "N/A";
//       mainOrderData.orderType = orderData.items[0]?.orderType || "dine-in";
//       mainOrderData.tableNumber = orderData.tableNumber || null;
//       mainOrderData.status = orderData.status === "delivered" ? "Delivered" :
//                             orderData.status === "cancelled" ? "Rejected" :
//                             orderData.status === "processing" ? "Preparing" : "Pending";
//       mainOrderData.paymentMethod = orderData.paymentMethod === "card" ? "Online Pay" : "Cash Pay";
//       mainOrderData.items = orderData.items.map(item => ({
//         name: item.food ? `Food_${item.food}` : "Unknown",
//         quantity: item.quantity,
//         price: item.price,
//       }));
//       mainOrderData.totalPrice = orderData.totalAmount;
//     }

//     const newOrder = await SOrder.create(mainOrderData);
//     console.log("Order synced to SOrder:", newOrder._id);
//     return newOrder;
//   } catch (error) {
//     console.error("Error syncing order to SOrder:", error);
//     throw error;
//   }
// };

// export default syncOrderToMainModel;

// utils/orderSync.js
import SOrder from "../models/orderModel.js";
import HomeOrder from "../models/OrderHome.js"; // Import HomeOrder model
import { generateCustomOrderId } from "./orderUtils.js";
import mongoose from "mongoose";

export const syncOrderToMainModel = async (orderData, orderType, homeOrderId) => {
  try {
    // Parse order items
    let orderItems;
    try {
      orderItems = typeof orderData.order === 'string' 
        ? JSON.parse(orderData.order) 
        : orderData.order;
      
      if (!Array.isArray(orderItems)) {
        throw new Error('Order items must be an array');
      }
    } catch (error) {
      console.error('Error parsing order items:', error);
      throw new Error('Invalid order format');
    }

    // Create main order data
    const mainOrderData = {
      _id: await generateCustomOrderId(),
      customerName: "Home Customer",
      phone: orderData.phoneNumber,
      orderType: "delivery",
      deliveryAddress: orderData.address,
      items: orderItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: orderItems.reduce((total, item) => total + (item.price * item.quantity), 0),
      paymentMethod: orderData.paymentMethod || "Online Pay",
      status: "Pending",
      paymentStatus: "Pending",
      deliveryFee: orderData.deliveryFee || 0
    };

    // Only add deliveryLocation if coordinates exist
    if (orderData.deliveryLocation?.coordinates) {
      mainOrderData.deliveryLocation = {
        type: "Point",
        coordinates: orderData.deliveryLocation.coordinates,
        address: orderData.address
      };
    }

    // Create SOrder within a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const mainOrder = await SOrder.create([mainOrderData], { session });

      // Update HomeOrder with mainOrderId
      if (homeOrderId && orderType === "home") {
        await HomeOrder.findByIdAndUpdate(
          homeOrderId,
          { mainOrderId: mainOrder[0]._id },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return mainOrder[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error syncing order:', error);
    throw error;
  }
};

export default syncOrderToMainModel;