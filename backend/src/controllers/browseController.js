import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';

// @desc    Get all restaurants (with filters)
// @route   GET /api/restaurants
// @access  Public
export const getRestaurants = async (req, res, next) => {
  const { cuisine, rating, search } = req.query;
  let query = { isOpen: true };

  if (cuisine) {
    query.cuisines = { $in: [cuisine] };
  }

  if (rating) {
    query.rating = { $gte: parseFloat(rating) };
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  try {
    const restaurants = await Restaurant.find(query);
    res.json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant details & its menu
// @route   GET /api/restaurants/:id/menu
// @access  Public
export const getRestaurantMenu = async (req, res, next) => {
  const { id } = req.params;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({ restaurantId: id });
    
    res.json({
      success: true,
      restaurant,
      menu: menuItems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search restaurants and menu items globally
// @route   GET /api/restaurants/search
// @access  Public
export const searchFood = async (req, res, next) => {
  const { q, isVeg } = req.query;

  if (!q) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  try {
    // 1. Search menu items
    let menuQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    };

    if (isVeg === 'true') {
      menuQuery.isVeg = true;
    }

    const menuItems = await MenuItem.find(menuQuery).populate('restaurantId');

    // 2. Search restaurants matching name or cuisine
    let restaurantQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { cuisines: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    const restaurants = await Restaurant.find(restaurantQuery);

    res.json({
      success: true,
      data: {
        menuItems,
        restaurants
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnedRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }
    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a menu item
// @route   POST /api/restaurants/menu
// @access  Private (Restaurant owner only)
export const addMenuItem = async (req, res, next) => {
  const { name, price, category, description, isVeg, image } = req.body;

  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      name,
      price: parseFloat(price),
      category,
      description,
      isVeg: isVeg === true || isVeg === 'true',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
    });

    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/restaurants/menu/:itemId
// @access  Private (Restaurant owner only)
export const toggleMenuItem = async (req, res, next) => {
  const { itemId } = req.params;
  const { isAvailable } = req.body;

  try {
    const menuItem = await MenuItem.findById(itemId).populate('restaurantId');
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Verify ownership
    if (menuItem.restaurantId.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this menu item' });
    }

    menuItem.isAvailable = isAvailable;
    await menuItem.save();

    res.json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Update owned restaurant details
// @route   PUT /api/restaurants/owned
// @access  Private (Restaurant owner only)
export const updateOwnedRestaurant = async (req, res, next) => {
  const { name, cuisines, minOrderValue, deliveryFee, coverImage, isOpen } = req.body;

  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    if (name) restaurant.name = name;
    if (cuisines) {
      restaurant.cuisines = Array.isArray(cuisines) ? cuisines : cuisines.split(',').map(c => c.trim());
    }
    if (minOrderValue !== undefined) restaurant.minOrderValue = parseFloat(minOrderValue);
    if (deliveryFee !== undefined) restaurant.deliveryFee = parseFloat(deliveryFee);
    if (coverImage) restaurant.coverImage = coverImage;
    if (isOpen !== undefined) restaurant.isOpen = isOpen;

    await restaurant.save();

    res.json({ success: true, message: 'Restaurant updated successfully', data: restaurant });
  } catch (error) {
    next(error);
  }
};


