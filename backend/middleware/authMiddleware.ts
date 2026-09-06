import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { User } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'shopsphere_jwt_secret_super_secure_key_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

      const user = db.users.find((u) => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found or token expired' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error in protect middleware:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

export const requireAdmin = admin;
