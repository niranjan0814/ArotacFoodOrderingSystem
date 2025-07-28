import express from 'express';
import Order from '../models/ManualOrder;.js';
import MenuItem from '../models/MenuItem.js';
const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const { tableNumber, customerName, orderType, items } = req.body;
    
    // Validate required fields
    if (!orderType || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: orderType and items array required' 
      });
    }

    // Validate dine-in orders have table number
    if (orderType === 'dine-in' && !tableNumber) {
      return res.status(400).json({ 
        message: 'Table number is required for dine-in orders' 
      });
    }

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      if (!item.menuItemId || !item.quantity) {
        return res.status(400).json({ 
          message: 'Each item must have menuItemId and quantity' 
        });
      }

      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ 
          message: `Menu item ${item.menuItemId} not found` 
        });
      }
      
      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      });
    }
    
    const order = new Order({
      tableNumber,
      customerName: customerName || 'Guest',
      orderType,
      items: orderItems,
      totalAmount,
      status: 'pending'
    });
    
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      message: 'Server error creating order',
      error: error.message 
    });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name price'); 
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this to your orders.js router
router.put('/:id', async (req, res) => {
  try {
    const { tableNumber, customerName, orderType, items, status } = req.body;
    
    // Validate required fields
    if (!orderType || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Transform items to match schema
    const transformedItems = await Promise.all(items.map(async item => {
      // Accept either menuItem or menuItemId
      const menuItemId = item.menuItem || item.menuItemId;
      const menuItem = await MenuItem.findById(menuItemId);
      
      if (!menuItem) {
        throw new Error(`Menu item ${menuItemId} not found`);
      }

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      };
    }));

    // Calculate total amount
    const totalAmount = transformedItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        tableNumber,
        customerName: customerName || 'Guest',
        orderType,
        status: status || 'pending',
        items: transformedItems,
        totalAmount
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Order update error:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors 
    });
  }
});

export default router;