import Contact from '../models/Contact.js';
import express from 'express';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, message } = req.body;
    const contact = new Contact({ name, email, phone, address, message });
    await contact.save();
    res.status(201).json({ success: true, contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;