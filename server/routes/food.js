const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();
const Food = require('../models/Food');
const upload = require('../config/imageUpload');
const auth = require('../middleware/auth');

// @route   GET api/food
// @desc    Get all food items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const foods = await Food.find();
    console.log('Foods with image and quantity:', foods.map(f => ({
      name: f.name,
      image: f.image,
      quantityAvailable: f.quantityAvailable
    })));
    res.json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET api/food/:id
// @desc    Get food by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const foodId = req.params.id;
    if (!mongoose.isValidObjectId(foodId)) {
      console.error('Invalid food ID', { foodId });
      return res.status(400).json({ success: false, message: 'Invalid food ID' });
    }
    const food = await Food.findById(foodId);
    if (!food) {
      console.error('Food not found', { foodId });
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    res.json({ success: true, data: food });
  } catch (error) {
    console.error('Error fetching food:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST api/food
// @desc    Add a new food item
// @access  Private
router.post('/', upload.single('image'), async (req, res) => {
  const { name, description, price, category, quantityAvailable } = req.body;

  if (!name || !description || !price || !category || quantityAvailable === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  try {
    const qty = parseInt(quantityAvailable);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity available must be a non-negative number'
      });
    }

    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const newFood = new Food({
      name,
      description,
      price: parseFloat(price),
      category,
      image,
      quantityAvailable: qty
    });

    const food = await newFood.save();
    res.json({ success: true, data: food });
  } catch (error) {
    console.error('Error creating food item:', error.stack);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// @route   PUT api/food/:id
// @desc    Update a food item
// @access  Private
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, quantityAvailable } = req.body;
    console.log('PUT received:', { name, description, price, category, quantityAvailable, file: !!req.file });
    let food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }

    if (name) food.name = name;
    if (description) food.description = description;
    if (price) food.price = parseFloat(price);
    if (category) food.category = category;
    if (quantityAvailable !== undefined && quantityAvailable !== '') {
      const qty = parseInt(quantityAvailable);
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity available must be a non-negative number'
        });
      }
      food.quantityAvailable = qty;
    }

    if (req.file) {
      if (food.image) {
        const oldImagePath = path.join(__dirname, '..', food.image);
        fs.unlink(oldImagePath, (err) => {
          if (err && err.code !== 'ENOENT') console.error('Failed to delete old image:', err);
        });
      }
      food.image = `/uploads/${req.file.filename}`;
    }

    food = await food.save();
    console.log('Saved food:', {
      name: food.name,
      quantityAvailable: food.quantityAvailable
    });
    res.json({ success: true, message: 'Food updated successfully', data: food });
  } catch (error) {
    console.error('Error updating food item:', error.stack);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// @route   DELETE api/food/:id
// @desc    Delete a food item
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }

    if (food.image) {
      const imagePath = path.join(__dirname, '..', food.image);
      fs.unlink(imagePath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Failed to delete image:', err);
      });
    }

    await food.deleteOne();
    res.json({ success: true, message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;