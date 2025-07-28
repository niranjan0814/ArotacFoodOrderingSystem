// models/Rating.js
const mongoose = require('mongoose');
const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  rating: Number,
});
module.exports = mongoose.model('Rating', ratingSchema);
