import Offer from '../models/Offer.js';

// @desc    Get active offers
// @route   GET /api/offers
// @access  Public
export const getOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new offer
// @route   POST /api/offers
// @access  Private (Admin only)
export const createOffer = async (req, res, next) => {
  const { title, description, discountCode, discountPercent, bannerImage } = req.body;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized, Admin only' });
    }

    const offer = await Offer.create({
      title,
      description,
      discountCode: discountCode.toUpperCase(),
      discountPercent: parseInt(discountPercent),
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600'
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private (Admin only)
export const deleteOffer = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized, Admin only' });
    }

    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
