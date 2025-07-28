import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import MenuItem from "../models/MenuItem.js"; 
import Offer from "../models/Offer.js";  

dotenv.config();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Cloudinary Configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


router.get("/categories", async (req, res) => {
  try {
    const categories = await MenuItem.distinct("category");
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

// Add Menu Item
router.post("/add-menu-item", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image for the menu item." });
    }
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: "Please enter a name for the menu item." });
    }
    if (!req.body.price) {
      return res.status(400).json({ success: false, message: "Please enter a price for the menu item." });
    }
    if (isNaN(req.body.price)) {
      return res.status(400).json({ success: false, message: "Price must be a valid number." });
    }
    if (!req.body.category) {
      return res.status(400).json({ success: false, message: "Please select a category for the menu item." });
    }
    if (!req.body.description) {
      return res.status(400).json({ success: false, message: "Please enter a description for the menu item." });
    }

    // Check if menu item name is unique
    const existingItem = await MenuItem.findOne({ name: req.body.name });
    if (existingItem) {
      return res.status(400).json({ success: false, message: "A menu item with this name already exists. Please choose a different name." });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        { folder: "menu_items", resource_type: "image" },
        (error, result) => (error ? reject(error) : resolve(result))
      ).end(req.file.buffer);
    });

    const newItem = new MenuItem({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      imageUrl: result.secure_url,
      recommendedItems: req.body.recommendedItems ? JSON.parse(req.body.recommendedItems) : [],
      isVisible: req.body.isVisible || true, // Default to true if not provided
    });

    await newItem.save();
    res.json({ success: true, message: "Menu item added successfully!" });
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ success: false, message: "An error occurred while adding the menu item." });
  }
});

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items." });
  }
});

// Delete a menu item
router.delete("/:id", async (req, res) => {
  try {
   
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: "Menu item not found." 
      });
    }

    // Check if item is used in any active combo offers
    const currentDate = new Date();
    const activeComboOffers = await Offer.find({
      offerType: "combo",
      comboItems: req.params.id,
      endDate: { $gte: currentDate }
    });

    if (activeComboOffers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete menu item as it is currently used in active combo offers."
      });
    }

    
    await MenuItem.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: "Menu item deleted successfully!" 
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to delete menu item." 
    });
  }
});

// Update a menu item
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, description, isVisible, recommendedItems } = req.body;
    const updateData = { name, price, category, description, isVisible };

 
    if (recommendedItems) {
      updateData.recommendedItems = JSON.parse(recommendedItems);
    }


    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(
          { folder: "menu_items", resource_type: "image" },
          (error, result) => (error ? reject(error) : resolve(result))
        ).end(req.file.buffer);
      });
      updateData.imageUrl = result.secure_url;
    }

   
    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }
    res.json({ success: true, message: "Menu item updated successfully!", updatedItem });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ success: false, message: "Failed to update menu item." });
  }
});

// Get a single menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(menuItem);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
});

// fetching menu item recommendedItems
router.get("/:id/with-recommendations", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate("recommendedItems");
    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(menuItem);
  } catch (error) {
    console.error("Error fetching menu item with recommendations:", error);
    res.status(500).json({ error: "Failed to fetch menu item with recommendations" });
  }
});

export default router;