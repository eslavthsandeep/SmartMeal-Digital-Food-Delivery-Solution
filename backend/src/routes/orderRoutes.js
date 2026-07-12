import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getRestaurantOrders,
  updateOrderStatus,
  getUnassignedOrders,
  getAllOrders
} from '../controllers/orderController.js';
import protect from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getAllOrders);
router.get('/customer/me', protect, getMyOrders);
router.get('/unassigned', protect, getUnassignedOrders);
router.get('/restaurant/:restaurantId', protect, getRestaurantOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);

export default router;
