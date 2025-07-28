import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

// Fetch all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().distinct("name");
    console.log("Sending categories:", categories); 
    res.json(categories); 
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message || "Error fetching categories" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const categories = await Category.find(); // Remove .distinct("name")
    console.log("Sending categories:", categories); 
    res.json(categories); 
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message || "Error fetching categories" });
  }
});

// Add a new category
router.post("/add", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const normalizedCategory = name.trim().toLowerCase();

    const existingCategory = await Category.findOne({ name: { $regex: new RegExp("^" + normalizedCategory + "$", "i") } });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const newCategory = new Category({ name: normalizedCategory });
    await newCategory.save();

    res.status(201).json({ message: "Category added successfully", category: newCategory });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: error.message || "Error adding category" });
  }
});

// Update a category
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const normalizedCategory = name.trim().toLowerCase();
    
    // Check if another category with this name already exists
    const existingCategory = await Category.findOne({ 
      _id: { $ne: id }, // Exclude current category
      name: { $regex: new RegExp(`^${normalizedCategory}$`, "i") }
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name: normalizedCategory },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ 
      message: "Category updated successfully", 
      category: updatedCategory 
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: error.message || "Error updating category" });
  }
});

// Delete a category
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ 
      message: "Category deleted successfully",
      deletedCategory 
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: error.message || "Error deleting category" });
  }
});


export default router;
