import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor (inject access token)
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (handle token refresh on 401)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard: ignore if not 401 or if it's already a retry / refresh request
    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Get refresh token from cookie or local storage backup
      const res = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      
      const newToken = res.data.token;
      
      // Update global auth store state
      const { user, setCredentials } = useAuthStore.getState();
      setCredentials(newToken, user);

      processQueue(null, newToken);
      isRefreshing = false;

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;
      
      // Auto logout if refresh token expires
      useAuthStore.getState().clearCredentials();
      return Promise.reject(refreshError);
    }
  }
);

// Endpoints Wrapper
export const authAPI = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  }
};

export const browseAPI = {
  getRestaurants: async (params) => {
    const res = await api.get('/restaurants', { params });
    return res.data;
  },
  getOwnedRestaurant: async () => {
    const res = await api.get('/restaurants/owned');
    return res.data;
  },
  addMenuItem: async (itemData) => {
    const res = await api.post('/restaurants/menu', itemData);
    return res.data;
  },
  toggleMenuItemAvailability: async (itemId, isAvailable) => {
    const res = await api.patch(`/restaurants/menu/${itemId}`, { isAvailable });
    return res.data;
  },
  getRestaurantMenu: async (id) => {
    const res = await api.get(`/restaurants/${id}/menu`);
    return res.data;
  },
  searchFood: async (q, isVeg) => {
    const res = await api.get('/restaurants/search', { params: { q, isVeg } });
    return res.data;
  }
};

export const orderAPI = {
  create: async (data) => {
    const res = await api.post('/orders', data);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  getMyOrders: async () => {
    const res = await api.get('/orders/customer/me');
    return res.data;
  },
  getUnassigned: async () => {
    const res = await api.get('/orders/unassigned');
    return res.data;
  },
  getRestaurantOrders: async (restaurantId) => {
    const res = await api.get(`/orders/restaurant/${restaurantId}`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  }
};

export const paymentAPI = {
  createIntent: async (orderId) => {
    const res = await api.post('/payments/create-intent', { orderId });
    return res.data;
  },
  confirmPayment: async (orderId, paymentIntentId) => {
    const res = await api.post('/payments/confirm', { orderId, paymentIntentId });
    return res.data;
  }
};

export const deliveryAPI = {
  assignAgent: async (orderId, deliveryPersonnelId) => {
    const res = await api.post('/delivery/assign', { orderId, deliveryPersonnelId });
    return res.data;
  },
  getMyDeliveries: async () => {
    const res = await api.get('/delivery/agent/me');
    return res.data;
  },
  updateLocation: async (id, lat, lng) => {
    const res = await api.patch(`/delivery/${id}/location`, { lat, lng });
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/delivery/${id}/status`, { status });
    return res.data;
  }
};

export const chatbotAPI = {
  sendMessage: async (message) => {
    const res = await api.post('/chatbot/message', { message });
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/chatbot/history');
    return res.data;
  },
  escalate: async () => {
    const res = await api.post('/chatbot/escalate');
    return res.data;
  }
};

export default api;
