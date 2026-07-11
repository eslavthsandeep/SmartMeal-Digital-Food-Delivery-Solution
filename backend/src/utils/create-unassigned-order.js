import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

dotenv.config();

const createTestOrder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find customer & restaurant
    const customer = await User.findOne({ role: 'customer' });
    const restaurant = await Restaurant.findOne({});
    const menuItem = await MenuItem.findOne({ restaurantId: restaurant._id });

    if (!customer || !restaurant || !menuItem) {
      console.error('Missing seed data. Please run seeder first.');
      process.exit(1);
    }

    // Create a confirmed, unpaid/paid order
    const order = await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      items: [{
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price
      }],
      deliveryFee: restaurant.deliveryFee,
      totalAmount: menuItem.price + restaurant.deliveryFee,
      status: 'confirmed', // Confirmed, ready for rider claim
      paymentStatus: 'paid',
      paymentMethod: 'card',
      deliveryAddress: customer.addresses[0]
    });

    console.log('SUCCESS: Created test confirmed order for Rider claims board!');
    console.log('Order ID:', order._id);
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
};

createTestOrder();
