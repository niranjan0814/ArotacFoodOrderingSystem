import express from "express";
import {
  createOrder,
  cancelOrder,
  getOrdersByUserId,
} from "../controllers/HomeOrderController.js";
import userAuth from "../middleware/userAuth.js";
import upload from "../middleware/uploadMiddleware.js";
import { autoSyncOrder } from "../middleware/orderSyncMiddleware.js";

const orderRouter = express.Router();

orderRouter.post("/create", userAuth, upload.single('orderPhoto'), autoSyncOrder("home"), createOrder);
orderRouter.get("/:id",getOrdersByUserId);
orderRouter.put("/:id/cancel", cancelOrder);

export default orderRouter;