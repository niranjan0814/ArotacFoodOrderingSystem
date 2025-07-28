
import Feedback from "../models/Feedback.js";
import MenuItem from "../models/MenuItem.js";
import multer from "multer";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedbackByFoodId = async (req, res) => {
  try {
    const feedback = await Feedback.find({ foodId: req.params.foodId }).sort({
      createdAt: -1,
    });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createFeedback = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { foodId, rating, comment, name } = req.body;

      const foodItem = await MenuItem.findById(foodId);
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }

      let imageUrl = null;
      if (req.file) {
        const result = await new Promise((resolve, reply) => {
          cloudinary.v2.uploader.upload_stream(
            { folder: "feedback_images", resource_type: "image" },
            (error, result) => (error ? reject(error) : resolve(result))
          ).end(req.file.buffer);
        });
        imageUrl = result.secure_url;
      }

      const feedback = new Feedback({
        foodId,
        rating: Number(rating),
        comment,
        name,
        imageUrl,
      });

      const savedFeedback = await feedback.save();
      res.status(201).json(savedFeedback);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
];

export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFeedbackReply = async (req, res) => {
  try {
    const { reply } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { reply },
      { new: true }
    );
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getFeedbackAnalytics = async (req, res) => {
  try {
    console.log("Step 1: Fetching feedback analytics...");

    // Fetch all feedback
    const feedbacks = await Feedback.find();
    console.log("Step 2: Feedbacks fetched:", feedbacks.length);

    // Total number of feedbacks
    const totalFeedbacks = feedbacks.length;
    console.log("Step 3: Total feedbacks:", totalFeedbacks);

    // Overall average rating
    const overallAverageRating =
      feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / totalFeedbacks || 0;
    console.log("Step 4: Overall average rating:", overallAverageRating);

    // Average rating per food item
    const feedbackByFoodId = {};
    feedbacks.forEach((feedback) => {
      if (!feedbackByFoodId[feedback.foodId]) {
        feedbackByFoodId[feedback.foodId] = [];
      }
      feedbackByFoodId[feedback.foodId].push(feedback.rating);
    });
    console.log("Step 5: Feedback grouped by foodId:", Object.keys(feedbackByFoodId).length);

    // Fetch all menu items
    const menuItems = await MenuItem.find();
    console.log("Step 6: Menu items fetched:", menuItems.length);

    // Average ratings per item
    const averageRatingsPerItem = Object.keys(feedbackByFoodId).map((foodId) => {
      const ratings = feedbackByFoodId[foodId];
      const menuItem = menuItems.find((item) => item._id.toString() === foodId);
      return {
        foodId,
        name: menuItem ? menuItem.name : "Unknown Item",
        averageRating: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      };
    });
    console.log("Step 7: Average ratings per item:", averageRatingsPerItem);

    // Feedbacks per food item
    const feedbacksPerItem = Object.keys(feedbackByFoodId).map((foodId) => {
      const menuItem = menuItems.find((item) => item._id.toString() === foodId);
      return {
        foodId,
        name: menuItem ? menuItem.name : "Unknown Item",
        count: feedbackByFoodId[foodId].length,
      };
    });
    console.log("Step 8: Feedbacks per item:", feedbacksPerItem);

    // Ratings breakdown
    const ratingsBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach((feedback) => {
      ratingsBreakdown[feedback.rating] = (ratingsBreakdown[feedback.rating] || 0) + 1;
    });
    console.log("Step 9: Ratings breakdown:", ratingsBreakdown);

    // Recent feedback (top 5 by createdAt descending)
    const recentFeedbacks = [...feedbacks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    console.log("Step 10: Recent feedbacks:", recentFeedbacks);

    // Most reviewed items (top 5)
    const feedbackCountByFoodId = {};
    feedbacks.forEach((feedback) => {
      feedbackCountByFoodId[feedback.foodId] = (feedbackCountByFoodId[feedback.foodId] || 0) + 1;
    });
    const mostReviewedItems = Object.keys(feedbackCountByFoodId)
      .map((foodId) => {
        const menuItem = menuItems.find((item) => item._id.toString() === foodId);
        return {
          foodId,
          name: menuItem ? menuItem.name : "Unknown Item",
          count: feedbackCountByFoodId[foodId],
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    console.log("Step 11: Most reviewed items:", mostReviewedItems);

    // Feedbacks with/without reply
    const pendingReplies = feedbacks.filter((feedback) => !feedback.reply).length;
    console.log("Step 12: Pending replies:", pendingReplies);

    // Construct the response
    const analytics = {
      overallAverageRating,
      averageRatingsPerItem,
      totalFeedbacks,
      feedbacksPerItem,
      ratingsBreakdown,
      recentFeedbacks,
      mostReviewedItems,
      pendingReplies,
    };

    console.log("Step 13: Sending response...");
    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error in getFeedbackAnalytics:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ message: error.message });
  }
};