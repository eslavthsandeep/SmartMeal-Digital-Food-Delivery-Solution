import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

// Helper to generate access token
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

// Helper to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { name, email, password, role, phone, address } = req.body;

  try {
    // Security Guard: Prevent registering as an admin
    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Registration as Admin is prohibited for security reasons.'
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const addresses = address ? [address] : [];

    const user = await User.create({
      name,
      email,
      password, // hashed via model pre-save hook
      role,
      phone,
      addresses
    });

    if (user) {
      // Auto-provision restaurant profile for Merchant role
      if (role === 'restaurant') {
        await Restaurant.create({
          ownerId: user._id,
          name: `${user.name}'s Kitchen`,
          cuisines: ['Fast Food', 'North Indian'],
          address: {
            addressLine: address?.addressLine || 'Merchant Location St',
            city: address?.city || 'Bangalore',
            state: address?.state || 'Karnataka',
            zipCode: address?.zipCode || '560103',
            lat: 12.9716,
            lng: 77.5946
          },
          rating: 4.5,
          coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=600',
          isOpen: true,
          minOrderValue: 150,
          deliveryFee: 40
        });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        success: true,
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = async (req, res, next) => {
  // Try reading refresh token from cookies, headers, or body
  const cookieToken = req.cookies?.refreshToken;
  const bodyToken = req.body.refreshToken;
  const refreshToken = cookieToken || bodyToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ success: true, token: newAccessToken });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res, next) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile / addresses
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      if (req.body.addresses) {
        user.addresses = req.body.addresses;
      }
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json({
        success: true,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          addresses: updatedUser.addresses
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized, Admin only' });
    }
    const users = await User.find({}, '-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};
