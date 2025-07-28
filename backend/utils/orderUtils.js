// utils/orderUtils.js
import mongoose from "mongoose";

export const generateCustomOrderId = async () => {
  const lastOrder = await mongoose.model('SOrder').findOne().sort({ createdAt: -1 });
  let nextId = 1001; // Start from ODR1001
  if (lastOrder && lastOrder._id.startsWith("ODR")) {
    const lastNumber = parseInt(lastOrder._id.replace("ODR", ""));
    nextId = lastNumber + 1;
  }
  return `ODR${nextId}`;
};