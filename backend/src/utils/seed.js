import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Delivery from '../models/Delivery.js';
import ChatSession from '../models/ChatSession.js';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. Wiping database collections...');

    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Delivery.deleteMany({});
    await ChatSession.deleteMany({});
    console.log('Existing collections cleared.');

    // 1. Create Users
    console.log('Creating seed users...');
    
    // We will save these manually to trigger pre-save password hashing
    const customer = new User({
      name: 'John Doe',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer',
      phone: '9876543210',
      addresses: [{
        label: 'Home',
        addressLine: 'Apt 4B, Green Glen Layout',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560103',
        lat: 12.9123,
        lng: 77.6789
      }]
    });
    await customer.save();

    const restaurantOwner1 = new User({
      name: 'Ramesh Kumar',
      email: 'restaurant1@test.com',
      password: 'password123',
      role: 'restaurant',
      phone: '9876543211'
    });
    await restaurantOwner1.save();

    const restaurantOwner2 = new User({
      name: 'Chef Jin',
      email: 'restaurant2@test.com',
      password: 'password123',
      role: 'restaurant',
      phone: '9876543212'
    });
    await restaurantOwner2.save();

    const deliveryAgent1 = new User({
      name: 'Rider Rohan',
      email: 'delivery1@test.com',
      password: 'password123',
      role: 'delivery_personnel',
      phone: '9876543213'
    });
    await deliveryAgent1.save();

    const deliveryAgent2 = new User({
      name: 'Rider Sunil',
      email: 'delivery2@test.com',
      password: 'password123',
      role: 'delivery_personnel',
      phone: '9876543214'
    });
    await deliveryAgent2.save();

    const admin = new User({
      name: 'System Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      phone: '9876543215'
    });
    await admin.save();

    console.log('Users created successfully.');

    // 2. Create Restaurants
    console.log('Creating seed restaurants...');
    const r1 = await Restaurant.create({
      ownerId: restaurantOwner1._id,
      name: 'Spice Villa (Indian & Mughlai)',
      cuisines: ['North Indian', 'Biryani', 'Mughlai'],
      address: {
        addressLine: '12, Outer Ring Road, Bellandur',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560103',
        lat: 12.9250,
        lng: 77.6800
      },
      rating: 4.8,
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
      isOpen: true,
      minOrderValue: 150,
      deliveryFee: 30
    });

    const r2 = await Restaurant.create({
      ownerId: restaurantOwner2._id,
      name: 'Golden Dragon (Chinese)',
      cuisines: ['Chinese', 'Asian', 'Noodles'],
      address: {
        addressLine: '45, 80 Feet Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560034',
        lat: 12.9350,
        lng: 77.6250
      },
      rating: 4.4,
      coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=600',
      isOpen: true,
      minOrderValue: 200,
      deliveryFee: 40
    });

    console.log('Restaurants created successfully.');

    // 3. Create Menu Items
    console.log('Creating seed menu items...');
    
    // Restaurant 1: Spice Villa
    await MenuItem.create([
      {
        restaurantId: r1._id,
        name: 'Paneer Butter Masala',
        price: 240,
        category: 'Main Course',
        description: 'Rich and creamy cottage cheese cooked in tomato and butter gravy.',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400'
      },
      {
        restaurantId: r1._id,
        name: 'Butter Naan',
        price: 50,
        category: 'Breads',
        description: 'Tandoori baked flatbread topped with butter.',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=400'
      },
      {
        restaurantId: r1._id,
        name: 'Chicken Biryani',
        price: 280,
        category: 'Main Course',
        description: 'Aromatic basmati rice cooked with chicken pieces, yogurt, and spices.',
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=400'
      },
      {
        restaurantId: r1._id,
        name: 'Hara Bhara Kabab',
        price: 180,
        category: 'Starters',
        description: 'Spiced spinach, green peas and potato patties deep fried.',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400'
      },
      {
        restaurantId: r1._id,
        name: 'Gulab Jamun (2 Pcs)',
        price: 80,
        category: 'Desserts',
        description: 'Sweet milk-solid dumplings dipped in cardamom sugar syrup.',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1589135306090-e477a44f96cd?auto=format&fit=crop&q=80&w=400'
      }
    ]);

    // Restaurant 2: Golden Dragon
    await MenuItem.create([
      {
        restaurantId: r2._id,
        name: 'Veg Spring Rolls',
        price: 160,
        category: 'Starters',
        description: 'Crispy fried pancakes filled with cabbage, carrots, and spring onion.',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400'
      },
      {
        restaurantId: r2._id,
        name: 'Chicken Hakka Noodles',
        price: 220,
        category: 'Main Course',
        description: 'Wok tossed noodles with chicken shreds, egg, and fresh veggies.',
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400'
      },
      {
        restaurantId: r2._id,
        name: 'Manchurian Veg Gravy',
        price: 190,
        category: 'Main Course',
        description: 'Deep-fried vegetable dumplings in tangy and spicy soy-chili sauce.',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=400'
      },
      {
        restaurantId: r2._id,
        name: 'Chili Chicken Dry',
        price: 240,
        category: 'Starters',
        description: 'Stir fried chicken cubes with capsicum and green chilies in dark soy.',
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&q=80&w=400'
      }
    ]);

    console.log('Menu items created successfully.');
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
