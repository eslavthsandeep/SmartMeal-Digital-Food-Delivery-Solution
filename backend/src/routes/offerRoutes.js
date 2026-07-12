import express from 'express';
import { getOffers, createOffer, deleteOffer } from '../controllers/offerController.js';
import protect from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getOffers);
router.post('/', protect, createOffer);
router.delete('/:id', protect, deleteOffer);

export default router;
