import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { sanitizeUser } from './authController.js';
import { User, UserAddress } from '../types/index.js';

// @desc    Get all users (Admin)
// @route   GET /api/users or GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, status } = req.query;

    let users = db.users.map((u) => {
      const safe = sanitizeUser(u);
      return {
        ...safe,
        ordersCount: db.orders.filter((o) => o.userId === u.id).length
      };
    });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (role && typeof role === 'string' && role !== 'all') {
      users = users.filter((u) => u.role.toLowerCase() === role.toLowerCase());
    }

    if (status && typeof status === 'string' && status !== 'all') {
      const isActive = status === 'active';
      users = users.filter((u) => (u.isActive !== false) === isActive);
    }

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// @desc    Create a new user account (Admin)
// @route   POST /api/users or POST /api/admin/users
// @access  Private/Admin
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role = 'customer', phone, address, isActive = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const exists = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({ message: 'A user with this email address already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const defaultAddr: UserAddress = address || {
      fullName: name.trim(),
      phone: phone || '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: true,
      label: 'Home'
    };

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'customer',
      authProvider: 'local',
      isActive: isActive !== false,
      emailVerified: true,
      lastLogin: now,
      phone: phone || '',
      address: defaultAddr,
      addresses: [defaultAddr],
      createdAt: now,
      updatedAt: now
    };

    db.users.unshift(newUser);

    res.status(201).json(sanitizeUser(newUser));
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// @desc    Update user role / status / details (Admin)
// @route   PUT /api/users/:id or PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = db.users.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { role, name, phone, isActive, emailVerified } = req.body;

    // Prevent demoting the root admin
    if (user.email === 'admin@shopsphere.com' && role && role !== 'admin') {
      return res.status(400).json({ message: 'Primary System Administrator role cannot be changed.' });
    }

    if (role && (role === 'admin' || role === 'user' || role === 'customer')) {
      user.role = role === 'admin' ? 'admin' : 'customer';
    }

    if (isActive !== undefined) {
      if (user.email === 'admin@shopsphere.com' && !isActive) {
        return res.status(400).json({ message: 'Primary System Administrator cannot be deactivated.' });
      }
      user.isActive = Boolean(isActive);
    }

    if (emailVerified !== undefined) {
      user.emailVerified = Boolean(emailVerified);
    }

    if (name && typeof name === 'string') user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    user.updatedAt = new Date().toISOString();

    res.json(sanitizeUser(user));
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// @desc    Delete a user (Admin)
// @route   DELETE /api/users/:id or DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user && req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own active administrator account' });
    }

    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email === 'admin@shopsphere.com') {
      return res.status(400).json({ message: 'Root System Administrator cannot be deleted.' });
    }

    const index = db.users.findIndex((u) => u.id === req.params.id);
    const [deleted] = db.users.splice(index, 1);

    res.json({ message: `User account "${deleted.name}" deleted successfully`, id: deleted.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
