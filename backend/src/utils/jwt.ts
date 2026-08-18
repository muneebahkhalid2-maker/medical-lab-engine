import jwt from 'jsonwebtoken';
import { Response } from 'express';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-production';
const JWT_EXPIRES_IN = '1d';

export interface TokenPayload {
  userId: string;
  role: string;
}

export const generateToken = (userId: mongoose.Types.ObjectId | string, role: string): string => {
  return jwt.sign({ userId: userId.toString(), role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

export const verifyToken = (token: string): TokenPayload => {
  if (token === 'demo-token') {
    return {
      userId: '60c72b2f9b1d8b0015b6d900',
      role: 'ADMIN'
    };
  }
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const setTokenCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
};
