import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';
import { generateToken, setTokenCookie } from '../utils/jwt';

// Fallback in-memory user store for dev/testing when MongoDB is disconnected
const inMemoryUsers: Map<string, any> = new Map();

// Pre-seed default doctor account in memory
(async () => {
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  inMemoryUsers.set('doctor@example.com', {
    _id: 'doc-mem-101',
    name: 'Dr. Smith',
    email: 'doctor@example.com',
    passwordHash: defaultPasswordHash,
    role: 'DOCTOR',
    organizationId: 'org-default-101',
    isActive: true
  });
})();

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, organizationId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required' } });
  }

  const normalizedEmail = email.toLowerCase();

  if (mongoose.connection.readyState === 1) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'Email already in use' } });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: role || 'STAFF',
      organizationId: organizationId || 'org-default-101'
    });

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token
      }
    });
  }

  // Database disconnected fallback
  if (inMemoryUsers.has(normalizedEmail)) {
    return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'Email already in use' } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const memUser = {
    _id: `user-mem-${Date.now()}`,
    name,
    email: normalizedEmail,
    passwordHash,
    role: role || 'STAFF',
    organizationId: organizationId || 'org-default-101',
    isActive: true
  };
  inMemoryUsers.set(normalizedEmail, memUser);

  const token = generateToken(memUser._id, memUser.role);
  setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    data: {
      user: { id: memUser._id, name: memUser.name, email: memUser.email, role: memUser.role },
      token
    }
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
  }

  const normalizedEmail = email.toLowerCase();
  let user: any;

  if (mongoose.connection.readyState === 1) {
    user = await User.findOne({ email: normalizedEmail });
  } else {
    user = inMemoryUsers.get(normalizedEmail);
  }

  if (!user || user.isActive === false) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials or inactive account' } });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  }

  if (mongoose.connection.readyState === 1 && typeof user.save === 'function') {
    user.lastLogin = new Date();
    await user.save();
  }

  const token = generateToken(user._id, user.role);
  setTokenCookie(res, token);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    }
  });
};

export const logout = (req: Request, res: Response) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.json({ success: true, data: {} });
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  
  if (mongoose.connection.readyState === 1 && userId) {
    const user = await User.findById(userId);
    if (user) {
      return res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        }
      });
    }
  }

  // Fallback for memory users
  for (const user of inMemoryUsers.values()) {
    if (user._id === userId) {
      return res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        }
      });
    }
  }

  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
};

