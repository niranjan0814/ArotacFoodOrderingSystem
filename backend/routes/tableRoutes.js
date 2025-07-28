import express from 'express';
import Table from '../models/Table.js';
import { generateQRCode } from '../utils/qrGenerator.js';

const router = express.Router();

// Add a new table
router.post('/add', async (req, res) => {
  try {
    const { name, status } = req.body;
    
    // Use the same URL for all tables
    const qrCodeLink = `${process.env.CLIENT_URL}/table/${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // First check if a table with this name already exists
    const existingTable = await Table.findOne({ name });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Table with this name already exists'
      });
    }
    
    const newTable = new Table({
      name,
      qrCodeLink,
      status: status || 'Active'
    });

    await newTable.save();
    
    // Generate QR code image (same URL but different content/design if needed)
    const qrCodeData = await generateQRCode(qrCodeLink, name);
    
    res.status(201).json({
      success: true,
      table: newTable,
      qrCodeData: qrCodeData.toString('base64')
    });
  } catch (error) {
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table creation failed due to duplicate QR code link'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      tables
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update table status
router.put('/:id/status', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    res.status(200).json({
      success: true,
      table
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a table
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// In your tableRoutes.js
router.put('/:id', async (req, res) => {
  try {
    const { name, status } = req.body;
    
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      { name, status },
      { new: true }
    );
    
    if (!updatedTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      table: updatedTable
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get a single table by ID
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    res.status(200).json({
      success: true,
      table
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


export default router;