import express from 'express';
import {
  assignAgent,
  updateLocation,
  updateDeliveryStatus,
  getMyDeliveries
} from '../controllers/deliveryController.js';
import protect from '../middlewares/auth.js';
import authorize from '../middlewares/roleCheck.js';

const router = express.Router();

router.post('/assign', protect, assignAgent);
router.patch('/:id/location', protect, updateLocation);
router.patch('/:id/status', protect, updateDeliveryStatus);
router.get('/agent/me', protect, authorize('delivery_personnel'), getMyDeliveries);

export default router;
