import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { createPaymentIntent, confirmPaymentIntent } from '../services/paymentGateway.js';

// @desc    Create a Stripe Payment Intent
// @route   POST /api/payments/create-intent
// @access  Private
export const createIntent = async (req, res, next) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order has already been paid' });
    }

    // Call service to generate payment intent (Stripe or Mock)
    const intent = await createPaymentIntent(order.totalAmount);

    res.json({
      success: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
      isMock: intent.isMock
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm Payment Success
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res, next) => {
  const { orderId, paymentIntentId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Call Stripe/Mock validation
    const confirmation = await confirmPaymentIntent(paymentIntentId);

    if (confirmation.status === 'succeeded') {
      // 1. Create Payment Record (DFD process 4.3 -> D4 Payment Records)
      await Payment.create({
        orderId: order._id,
        amount: order.totalAmount,
        method: order.paymentMethod,
        gatewayTransactionId: confirmation.id,
        status: 'succeeded'
      });

      // 2. Update Order statuses
      order.paymentStatus = 'paid';
      order.status = 'confirmed'; // Confirmed by restaurant
      await order.save();

      // 3. Emit real-time Socket events
      const io = req.app.get('io');
      if (io) {
        // Notify customer order page
        io.to(`order:${order._id}`).emit('payment:confirmed', {
          orderId: order._id,
          paymentStatus: 'paid',
          status: 'confirmed'
        });

        // Notify restaurant dashboard that payment is done and order is active
        io.to(`restaurant:${order.restaurantId}`).emit('order:new', order);
      }

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: order
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Payment confirmation failed. Status: ${confirmation.status}`
      });
    }
  } catch (error) {
    next(error);
  }
};
