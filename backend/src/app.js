import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import browseRoutes from './routes/browseRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading images from backend statically
}));
app.use(cors({
  origin: true, // Allow client origin
  credentials: true
}));

// Logger & Parsers
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth Route Rate Limiter (Defense/Viva security)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static uploads folder for images (with fallback creation in server)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', browseRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/offers', offerRoutes);

// Base route health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy!' });
});

// Centralized error handling
app.use(errorHandler);

export default app;
