import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  discountCode: { type: String, required: true },
  discountPercent: { type: Number, default: 10 },
  bannerImage: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
