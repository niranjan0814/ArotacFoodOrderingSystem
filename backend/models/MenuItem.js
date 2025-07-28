import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true }, 
  imageUrl: { type: String, required: true },
  recommendedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
  isVisible: { type: Boolean, default: true },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;