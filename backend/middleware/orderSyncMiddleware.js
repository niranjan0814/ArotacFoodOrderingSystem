import { syncOrderToMainModel } from "../utils/orderSync.js";

export const autoSyncOrder = (modelType) => {
  return async (req, res, next) => {
    try {
      res.on('finish', async () => {
        if (res.statusCode === 201 && req.method === 'POST') {
          try {
            // Pass the HomeOrder _id if available (from response locals or body)
            const homeOrderId = res.locals.newOrderId || null; // Adjust based on how you store the new order ID
            await syncOrderToMainModel(req.body, modelType, homeOrderId);
          } catch (syncError) {
            console.error("Non-critical sync error:", syncError);
            // Don't crash - just log the error
          }
        }
      });
      next();
    } catch (error) {
      console.error("Sync middleware setup error:", error);
      next();
    }
  };
};