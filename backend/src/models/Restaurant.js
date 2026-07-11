import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true, trim: true },
  cuisines: [{ type: String, required: true }],
  address: {
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    lat: { type: Number, default: 12.9716 }, // Default location coordinate (e.g. Bangalore center)
    lng: { type: Number, default: 77.5946 }
  },
  rating: { type: Number, default: 4.5, min: 1, max: 5 },
  coverImage: { type: String, default: '/uploads/default-restaurant.jpg' },
  isOpen: { type: Boolean, default: true },
  minOrderValue: { type: Number, default: 100 }, // in Rupees
  deliveryFee: { type: Number, default: 40 } // in Rupees
}, {
  timestamps: true
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
