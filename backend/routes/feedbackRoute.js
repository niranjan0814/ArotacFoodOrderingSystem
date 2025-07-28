
import express from "express";
import {
  getAllFeedback,
  getFeedbackByFoodId,
  createFeedback,
  deleteFeedback,
  updateFeedbackReply,
  getFeedbackAnalytics,
} from "../controllers/feedbackController.js";

const router = express.Router();
router.get("/analytics", getFeedbackAnalytics); 
router.get("/", getAllFeedback);
router.get("/:foodId", getFeedbackByFoodId);
router.post("/", createFeedback);
router.delete("/:id", deleteFeedback);
router.put("/reply/:id", updateFeedbackReply);


export default router;