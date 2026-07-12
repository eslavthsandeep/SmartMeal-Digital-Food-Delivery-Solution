import express from 'express';
import { getRestaurants, getRestaurantMenu, searchFood, getOwnedRestaurant, addMenuItem, toggleMenuItem, updateOwnedRestaurant } from '../controllers/browseController.js';
import protect from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getRestaurants);
router.get('/owned', protect, getOwnedRestaurant);
router.put('/owned', protect, updateOwnedRestaurant);
router.post('/menu', protect, addMenuItem);
router.patch('/menu/:itemId', protect, toggleMenuItem);
router.get('/search', searchFood);
router.get('/:id/menu', getRestaurantMenu);

export default router;
