import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Delivery from '../models/Delivery.js';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  const { restaurantId, items, deliveryAddress, paymentMethod } = req.body;
  const customerId = req.user.id;

  try {
    // 1. Validate restaurant exists and is open
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    if (!restaurant.isOpen) {
      return res.status(400).json({ success: false, message: 'Restaurant is closed' });
    }

    // 2. Validate menu items and compute total price server-side (prevent pricing hacks)
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      if (!dbItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.name} not found` });
      }
      if (!dbItem.isAvailable) {
        return res.status(400).json({ success: false, message: `Menu item ${dbItem.name} is out of stock` });
      }
      if (dbItem.restaurantId.toString() !== restaurantId) {
        return res.status(400).json({ success: false, message: 'All items must be from the same restaurant' });
      }

      calculatedSubtotal += dbItem.price * item.quantity;
      validatedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        quantity: item.quantity,
        price: dbItem.price
      });
    }

    // 3. Verify min order value
    if (calculatedSubtotal < restaurant.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is ${restaurant.minOrderValue} INR`
      });
    }

    const totalAmount = calculatedSubtotal + restaurant.deliveryFee;

    // 4. Save to Database
    const order = await Order.create({
      customerId,
      restaurantId,
      items: validatedItems,
      deliveryFee: restaurant.deliveryFee,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      status: 'pending'
    });

    // 5. Emit real-time Socket.IO alert to the restaurant if they are online
    const io = req.app.get('io');
    if (io) {
      // Emit to a specific room for this restaurant
      io.to(`restaurant:${restaurantId}`).emit('order:new', order);
      console.log(`[Socket] Emitted order:new to restaurant:${restaurantId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'name address phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    const isCustomer = order.customerId._id.toString() === req.user.id;
    const isRestaurant = order.restaurantId.ownerId?.toString() === req.user.id || req.user.role === 'restaurant'; 
    const isDelivery = req.user.role === 'delivery_personnel';
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isRestaurant && !isDelivery && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in customer orders
// @route   GET /api/orders/customer/me
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate('restaurantId', 'name coverImage address')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private (Restaurant owner only)
export const getRestaurantOrders = async (req, res, next) => {
  const { restaurantId } = req.params;

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const orders = await Order.find({ restaurantId })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Restaurant owner, Delivery Agent, or Admin)
export const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid order status' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Implement State transitions guard:
    // e.g. cannot go backwards from delivered, etc.
    if (order.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Order has already been delivered' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    order.status = status;
    
    // Automatically set payment status if delivered or cash on delivery transitions
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Emit live update to Socket rooms
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order._id}`).emit('order:status', {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus
      });
      // also notify restaurant room
      io.to(`restaurant:${order.restaurantId}`).emit('order:updated', order);
    }

    res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unassigned active orders (Rider gig board)
// @route   GET /api/orders/unassigned
// @access  Private (Riders only)
export const getUnassignedOrders = async (req, res, next) => {
  try {
    // Find all assigned order IDs
    const assignedDeliveries = await Delivery.find().select('orderId');
    const assignedOrderIds = assignedDeliveries.map(d => d.orderId.toString());

    // Find orders that are confirmed or preparing and not in the assigned list
    const unassignedOrders = await Order.find({
      _id: { $nin: assignedOrderIds },
      status: { $in: ['confirmed', 'preparing'] }
    })
      .populate('restaurantId', 'name address')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: unassignedOrders.length, data: unassignedOrders });
  } catch (error) {
    next(error);
  }
};

