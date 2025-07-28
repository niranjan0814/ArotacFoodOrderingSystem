import express  from "express";
import Message from "../models/Message.js";
const router = express.Router();
import {
    getDeliveredOrders,
    getFailedOrders,
  } from "../controllers/deliveryController.js";


// Route to get all delivered orders
router.get("/", getDeliveredOrders);

// Route to get all failed orders
router.get("/fail", getFailedOrders);

router.get('/conversation', async (req, res) => {
  const { userId, recipientId, recipientType } = req.query;
  const messages = await Message.find({
    $or: [
      { senderId: userId, recipientId, recipientType },
      { senderId: recipientId, recipientId: userId, recipientType },
    ],
  }).sort({ timestamp: 1 });
  res.json(messages);
});

export default router;