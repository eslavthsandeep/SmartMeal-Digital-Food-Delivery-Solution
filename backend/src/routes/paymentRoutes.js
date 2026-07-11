import express from 'express';
import { createIntent, confirmPayment } from '../controllers/paymentController.js';
import protect from '../middlewares/auth.js';

const router = express.Router();

router.post('/create-intent', protect, createIntent);
router.post('/confirm', protect, confirmPayment);

export default router;
