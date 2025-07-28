import express from "express";
import syncOrderToMainModel from "../utils/orderSync.js";
import HomeOrderModel from "../models/OrderHome.js"; // Home customer model
import RestaurantOrderModel from "../models/InShopOrder.js"; // In-restaurant customer model

const router = express.Router();

// Route for home customer orders
router.post("/home-orders", async (req, res) => {
  try {
    const orderData = req.body;
    // Save to home customer model
    const newOrder = await HomeOrderModel.create(orderData);
    // Sync to main SOrder model, passing the HomeOrder _id
    await syncOrderToMainModel(orderData, "home", newOrder._id);
    res.json(newOrder);
  } catch (error) {
    console.error("Error creating home order:", error);
    res.status(500).json({ error: "Failed to create home order" });
  }
});

// Route for in-restaurant customer orders
router.post("/restaurant-orders", async (req, res) => {
  try {
    const orderData = req.body;
    // Save to in-restaurant model
    const newOrder = await RestaurantOrderModel.create(orderData);
    // Sync to main SOrder model (no HomeOrder _id needed for restaurant orders)
    await syncOrderToMainModel( orderData, "in-restaurant");
    res.json(newOrder);
  } catch (error) {
    console.error("Error creating restaurant order:", error);
    res.status(500).json({ error: "Failed to create restaurant order" });
  }
});

export default router;