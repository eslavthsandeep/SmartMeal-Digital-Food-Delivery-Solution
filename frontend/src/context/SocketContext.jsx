import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore.js';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    console.log(`[Socket] Connecting to ${socketUrl}...`);
    const newSocket = io(socketUrl);

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected to server: ${newSocket.id}`);
      
      // Auto-join user room if authenticated
      if (user?.id) {
        newSocket.emit('join:user', user.id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    return () => {
      console.log('[Socket] Disconnecting socket...');
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Utility helpers to wrap emits
  const joinOrderRoom = (orderId) => {
    if (socket) {
      socket.emit('join:order', orderId);
    }
  };

  const joinRestaurantRoom = (restaurantId) => {
    if (socket) {
      socket.emit('join:restaurant', restaurantId);
    }
  };

  const updateDeliveryLocation = (payload) => {
    if (socket) {
      socket.emit('delivery:location:update', payload);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinOrderRoom, joinRestaurantRoom, updateDeliveryLocation }}>
      {children}
    </SocketContext.Provider>
  );
};
export default SocketContext;
