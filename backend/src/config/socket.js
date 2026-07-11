import { Server } from 'socket.io';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all client connections
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket] Socket ${socket.id} joined user room: user:${userId}`);
    });

    // Join restaurant-specific room
    socket.on('join:restaurant', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`[Socket] Socket ${socket.id} joined restaurant room: restaurant:${restaurantId}`);
    });

    // Join order-specific room for tracking updates
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket] Socket ${socket.id} joined order room: order:${orderId}`);
    });

    // Handle delivery agent live location update
    socket.on('delivery:location:update', ({ orderId, lat, lng, agentName }) => {
      console.log(`[Socket] Location update for order ${orderId}: lat ${lat}, lng ${lng}`);
      // Broadcast location change to everyone listening to this order (the customer)
      socket.to(`order:${orderId}`).emit('delivery:location', { orderId, lat, lng, agentName });
    });

    // Handle clean disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default initSocket;
