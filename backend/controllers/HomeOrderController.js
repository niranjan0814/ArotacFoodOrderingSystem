import HomeOrder from "../models/OrderHome.js";
import SOrder from "../models/orderModel.js";
import MenuItem from "../models/MenuItem.js";
import {
  getCoordinatesNominatim,
  getDistanceInKm,
} from "../utils/locationUtils.js";
import mongoose from 'mongoose';

// Hotel coordinates (Northern Uni, Kantharmadam)
const HOTEL_LAT = 9.677825;
const HOTEL_LNG = 80.021281;

// Default address and coordinates
const DEFAULT_ADDRESS = "kokuvil";
const DEFAULT_COORDINATES = { lat: 9.6717, lon: 89.11794 }; // From your earlier request

export const createOrder = async (req, res) => {
  try {
    const { userId, address: providedAddress, phoneNumber, order, paymentMethod } = req.body;

    // Validate required fields
    if (!userId || !phoneNumber || !order) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Parse order items
    let orderItems;
    try {
      orderItems = typeof order === 'string' ? JSON.parse(order) : order;
      if (!Array.isArray(orderItems)) {
        throw new Error('Order items must be an array');
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid order format"
      });
    }

    // Geolocation check with default address fallback
    let userLocation;
    let finalAddress = providedAddress || DEFAULT_ADDRESS; // Use default address if none provided

    try {
      if (providedAddress) {
        userLocation = await getCoordinatesNominatim(providedAddress);
      }

      if (!userLocation) {
        // If no address provided or geocoding fails, use default address and coordinates
        finalAddress = DEFAULT_ADDRESS;
        userLocation = DEFAULT_COORDINATES;
      }

      const distance = getDistanceInKm(
        HOTEL_LAT, HOTEL_LNG,
        userLocation.lat, userLocation.lon
      );

      if (distance > 10) {
        return res.status(400).json({
          success: false,
          message: "Delivery beyond 10km not available"
        });
      }
    } catch (geoError) {
      console.error("Geocoding error:", geoError);
      // Fallback to default address and coordinates on geocoding error
      finalAddress = DEFAULT_ADDRESS;
      userLocation = DEFAULT_COORDINATES;

      const distance = getDistanceInKm(
        HOTEL_LAT, HOTEL_LNG,
        userLocation.lat, userLocation.lon
      );

      if (distance > 10) {
        return res.status(400).json({
          success: false,
          message: "Delivery beyond 10km not available (using default location)"
        });
      }
    }

    // Generate custom order ID for SOrder
    const customOrderId = await generateCustomOrderId();

    // Create HomeOrder with mainOrderId set directly
    const homeOrderData = {
      userId: new mongoose.Types.ObjectId(userId),
      order: orderItems,
      address: finalAddress, // Use the final address (either provided or default)
      phoneNumber,
      orderType: "delivery",
      paymentMethod: paymentMethod || "Online Pay",
      status: "pending",
      deliveryLocation: {
        type: "Point",
        coordinates: [parseFloat(userLocation.lon), parseFloat(userLocation.lat)],
        address: finalAddress
      },
      deliveryFee: calculateDeliveryFee(userLocation.lat, userLocation.lon),
      mainOrderId: customOrderId // Set the custom SOrder ID here
    };

    const newHomeOrder = await HomeOrder.create(homeOrderData);

    // Create SOrder with proper GeoJSON format
    const mainOrderData = {
      _id: customOrderId,
      customerName: "Home Customer",
      phone: phoneNumber,
      orderType: "delivery",
      deliveryAddress: finalAddress, // Use the final address
      items: orderItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: orderItems.reduce((total, item) => total + (item.price * item.quantity), 0),
      paymentMethod: paymentMethod || "Online Pay",
      status: "Pending",
      paymentStatus: "Pending",
      deliveryFee: homeOrderData.deliveryFee,
      deliveryLocation: {
        type: "Point",
        coordinates: homeOrderData.deliveryLocation.coordinates,
        address: finalAddress
      }
    };

    const mainOrder = await SOrder.create(mainOrderData);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newHomeOrder,
      mainOrderId: mainOrder._id
    });

  } catch (error) {
    console.error("Order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ... (rest of the code remains unchanged)
export const cancelOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
    // Update both HomeOrder and SOrder
    const homeOrder = await HomeOrder.findById(orderId);
    if (!homeOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Check cancellation window (10 minutes)
    const now = new Date();
    const diffMinutes = (now - homeOrder.createdAt) / (1000 * 60);

    if (diffMinutes > 10) {
      return res.status(400).json({
        success: false,
        message: "Cancellation window expired (10 minutes)"
      });
    }

    if (homeOrder.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order already processed"
      });
    }

    // Update HomeOrder
    homeOrder.status = "cancelled";
    await homeOrder.save();

    // Update corresponding SOrder using mainOrderId
    const updatedSOrder = await SOrder.findByIdAndUpdate(
      homeOrder.mainOrderId, // Use mainOrderId to find the SOrder
      { status: "cancelled" }, // Updated to use "cancelled" for consistency with SOrder schema
      { new: true }
    );

    if (!updatedSOrder) {
      return res.status(404).json({
        success: false,
        message: "Corresponding SOrder not found"
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Order cancelled",
      homeOrder,
      sOrder: updatedSOrder // Return updated SOrder for confirmation
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getOrdersByUserId = async (req, res) => {
  const { id } = req.params; // Get userId from URL parameter

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    // Fetch orders for the user, sorted by creation date (newest first)
    const orders = await HomeOrder.find({
      userId: new mongoose.Types.ObjectId(id),
    }).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    // Process each order to fetch MenuItem details
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        let orderItems = [];
        try {
          // Parse the order field (string) into an array
          orderItems =
            typeof order.order === "string"
              ? JSON.parse(order.order)
              : Array.isArray(order.order)
              ? order.order
              : [];
        } catch (e) {
          console.error(`Error parsing order items for order ${order._id}:`, e);
          orderItems = [];
        }

        // Fetch MenuItem details for each item in the order
        const enrichedItems = await Promise.all(
          orderItems.map(async (item) => {
            try {
              // Fetch the MenuItem using the menuItem ID
              const menuItem = await MenuItem.findById(item.menuItem);
              if (!menuItem) {
                console.warn(`Menu item ${item.menuItem} not found for order ${order._id}`);
                return {
                  ...item,
                  image: item.image || null,
                  price: parseFloat(item.price) || 0, // Convert to number
                  quantity: parseInt(item.quantity, 10) || 1, // Convert to number
                };
              }

              // Return the item with the updated image URL from MenuItem
              return {
                ...item,
                image: menuItem.imageUrl || item.image,
                price: parseFloat(item.price) || 0, // Convert to number
                quantity: parseInt(item.quantity, 10) || 1, // Convert to number
              };
            } catch (error) {
              console.error(`Error fetching menu item ${item.menuItem}:`, error);
              return {
                ...item,
                image: item.image || null,
                price: parseFloat(item.price) || 0, // Convert to number
                quantity: parseInt(item.quantity, 10) || 1, // Convert to number
              };
            }
          })
        );

        // Return the enriched order with updated items
        return {
          ...order._doc, // Use _doc to get the plain object from Mongoose
          order: enrichedItems, // Replace the order field with enriched items
        };
      })
    );

    return res.status(200).json({
      success: true,
      orders: enrichedOrders,
    });
  } catch (error) {
    console.error("Error in getOrdersByUserId:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Helper functions
const generateCustomOrderId = async () => {
  const lastOrder = await SOrder.findOne().sort({ createdAt: -1 });
  let nextId = 1001;
  if (lastOrder && lastOrder._id.startsWith("ODR")) {
    const lastNumber = parseInt(lastOrder._id.replace("ODR", ""));
    nextId = lastNumber + 1;
  }
  return `ODR${nextId}`;
};

const calculateDeliveryFee = (lat, lng) => {
  const distance = getDistanceInKm(HOTEL_LAT, HOTEL_LNG, lat, lng);
  if (distance <= 2) return 0;
  if (distance <= 5) return 100;
  if (distance <= 10) return 200;
  return 0;
};