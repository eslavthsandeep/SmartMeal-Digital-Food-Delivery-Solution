import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Assign a delivery personnel to an order (DFD 5.1)
// @route   POST /api/delivery/assign
// @access  Private (Restaurant owner / Admin / Auto-assign)
export const assignAgent = async (req, res, next) => {
  const { orderId, deliveryPersonnelId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify agent exists and has delivery role
    const agent = await User.findById(deliveryPersonnelId);
    if (!agent || agent.role !== 'delivery_personnel') {
      return res.status(400).json({ success: false, message: 'Invalid delivery agent' });
    }

    // Check if delivery record already exists
    let delivery = await Delivery.findOne({ orderId });
    if (delivery) {
      return res.status(400).json({ success: false, message: 'Delivery already assigned for this order' });
    }

    // Set starting location coordinate to restaurant coordinate (or near restaurant)
    const startLocation = { lat: 12.9716, lng: 77.5946 }; // Default center

    delivery = await Delivery.create({
      orderId,
      deliveryPersonnelId,
      currentLocation: startLocation,
      status: 'assigned'
    });

    order.status = 'confirmed'; // Confirmed and rider assigned
    await order.save();

    // Emit live update to Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${orderId}`).emit('delivery:assigned', {
        deliveryId: delivery._id,
        agentName: agent.name,
        agentPhone: agent.phone,
        location: startLocation
      });
      // emit update to rider
      io.to(`user:${deliveryPersonnelId}`).emit('delivery:new_job', delivery);
    }

    res.status(201).json({
      success: true,
      message: 'Delivery agent assigned successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update agent location (DFD 5.2)
// @route   PATCH /api/delivery/:id/location
// @access  Private (Delivery Agent only)
export const updateLocation = async (req, res, next) => {
  const { lat, lng } = req.body;
  const deliveryId = req.params.id;

  try {
    const delivery = await Delivery.findById(deliveryId).populate('deliveryPersonnelId', 'name phone');
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    // Check ownership
    if (delivery.deliveryPersonnelId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this delivery location' });
    }

    delivery.currentLocation = { lat, lng };
    await delivery.save();

    // Emit socket event to the customer room for real-time Leaflet mapping
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${delivery.orderId}`).emit('delivery:location', {
        orderId: delivery.orderId,
        lat,
        lng,
        agentName: delivery.deliveryPersonnelId.name
      });
    }

    res.json({ success: true, message: 'Location updated successfully', location: delivery.currentLocation });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery status (DFD 5.3)
// @route   PATCH /api/delivery/:id/status
// @access  Private (Delivery Agent only)
export const updateDeliveryStatus = async (req, res, next) => {
  const { status } = req.body;
  const deliveryId = req.params.id;

  const allowedStatuses = ['assigned', 'picked_up', 'delivered'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid delivery status' });
  }

  try {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    if (delivery.deliveryPersonnelId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    delivery.status = status;
    if (status === 'delivered') {
      delivery.deliveredAt = Date.now();
    }
    await delivery.save();

    // Sync corresponding Order status
    const order = await Order.findById(delivery.orderId);
    if (order) {
      if (status === 'picked_up') {
        order.status = 'out_for_delivery';
      } else if (status === 'delivered') {
        order.status = 'delivered';
        order.paymentStatus = 'paid'; // Assumed paid if cash or card
      }
      await order.save();

      // Emit sockets
      const io = req.app.get('io');
      if (io) {
        io.to(`order:${order._id}`).emit('order:status', {
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus
        });
      }
    }

    res.json({ success: true, message: `Delivery status updated to ${status}`, data: delivery });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assigned deliveries for delivery personnel
// @route   GET /api/delivery/agent/me
// @access  Private (Delivery Agent only)
export const getMyDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({
      deliveryPersonnelId: req.user.id
    })
      .populate({
        path: 'orderId',
        populate: [
          { path: 'restaurantId', select: 'name address' },
          { path: 'customerId', select: 'name phone' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    next(error);
  }
};
