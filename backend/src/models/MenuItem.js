import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  category: { type: String, required: true }, // e.g. Starters, Main Course, Drinks
  image: { type: String, default: '/uploads/default-food.jpg' },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  description: { type: String, trim: true }
}, {
  timestamps: true
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
