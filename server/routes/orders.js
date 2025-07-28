const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Food = require('../models/Food');

// @route   POST api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, paymentMethod, tableNumber, guestDetails } = req.body;
    console.log('Received order data:', JSON.stringify(req.body, null, 2));
    console.log('User ID from auth:', req.userId);

    if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
      return res.status(401).json({ success: false, message: 'Invalid or missing user ID' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid total amount' });
    }

    // if (!deliveryAddress) {
    //   return res.status(400).json({ success: false, message: 'Delivery address is required' });
    // }

    if (!['cash', 'card', 'pending'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User not found: ${req.userId}` });
    }

    for (const item of items) {
      if (!item.food || !mongoose.isValidObjectId(item.food)) {
        return res.status(400).json({ success: false, message: `Invalid food ID: ${item.food}` });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
      }
      if (!item.price || item.price < 0) {
        return res.status(400).json({ success: false, message: 'Invalid price' });
      }
      if (!['takeaway', 'dine-in'].includes(item.orderType)) {
        return res.status(400).json({ success: false, message: `Invalid order type: ${item.orderType}` });
      }

      const foodExists = await Food.findById(item.food);
      if (!foodExists) {
        return res.status(404).json({ success: false, message: `Food not found: ${item.food}` });
      }
    }

    const order = new Order({
      user: req.userId,
      items: items.map((item) => ({
        food: item.food,
        quantity: item.quantity,
        price: item.price,
        orderType: item.orderType,
      })),
      totalAmount,
      deliveryAddress: deliveryAddress || undefined, // Let schema default handle it
      paymentMethod,
      tableNumber: tableNumber || undefined,
      guestDetails: guestDetails || undefined,
      status: 'pending',
    });

    await order.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// @route   PUT api/orders/:id
// @desc    Update an order
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, paymentMethod, tableNumber, guestDetails } = req.body;
    console.log('Received update data:', JSON.stringify(req.body, null, 2)); // Debug log

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid total amount' });
    }

    // if (!deliveryAddress) {
    //   return res.status(400).json({ success: false, message: 'Delivery address is required' });
    // }

    if (!['cash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
   

    for (const item of items) {
      if (!mongoose.isValidObjectId(item.food)) {
        return res.status(400).json({ success: false, message: `Invalid food ID: ${item.food}` });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
      }
      if (!item.price || item.price < 0) {
        return res.status(400).json({ success: false, message: 'Invalid price' });
      }
      if (!['takeaway', 'dine-in'].includes(item.orderType)) {
        return res.status(400).json({ success: false, message: `Invalid order type: ${item.orderType}` });
      }
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    order.items = items.map((item) => ({
      food: item.food,
      quantity: item.quantity,
      price: item.price,
      orderType: item.orderType,
    }));

    order.totalAmount = totalAmount;
    order.deliveryAddress = deliveryAddress ||  order.deliveryAddress; // Preserve if not updated
    order.paymentMethod = paymentMethod;
    order.tableNumber = tableNumber || order.tableNumber; // Preserve existing value if new one is undefined
    order.guestDetails = guestDetails || order.guestDetails;
    order.status = 'processing';

    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// @route   GET api/orders
// @desc    Get all orders for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.food', 'name image price')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.food', 'name image price');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

module.exports = router;