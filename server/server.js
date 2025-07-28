const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');


// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const orderRoutes = require('./routes/orders');
const qwenRouter = require('./routes/qwen');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());

// CORS middleware to allow all origins
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/qwen', qwenRouter);
// Base route
app.get('/', (req, res) => {
  res.send('FoodLove API is running');
});

// Port
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
