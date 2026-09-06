import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Cart, CartItem } from '../types/index.js';

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let cart = db.carts.get(req.user.id);
    if (!cart) {
      cart = {
        userId: req.user.id,
        items: [],
        updatedAt: new Date().toISOString()
      };
      db.carts.set(req.user.id, cart);
    }

    // Refresh stock and current pricing from db.products
    cart.items = cart.items.map((item) => {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        return {
          ...item,
          price: prod.price,
          originalPrice: prod.originalPrice,
          stock: prod.stock,
          name: prod.name,
          image: prod.images[0] || item.image
        };
      }
      return item;
    });

    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { productId, quantity = 1 } = req.body;

    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ message: 'Product is currently out of stock' });
    }

    let cart = db.carts.get(req.user.id);
    if (!cart) {
      cart = {
        userId: req.user.id,
        items: [],
        updatedAt: new Date().toISOString()
      };
      db.carts.set(req.user.id, cart);
    }

    const existingIndex = cart.items.findIndex((item) => item.productId === productId);

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > product.stock) {
        return res.status(400).json({
          message: `Cannot add more. Only ${product.stock} items available in stock.`
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      const qtyToAdd = Math.min(Number(quantity), product.stock);
      const newItem: CartItem = {
        id: `citem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0] || '',
        quantity: qtyToAdd,
        stock: product.stock,
        category: product.category
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date().toISOString();
    res.status(200).json(cart);
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:id
// @access  Private
export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { quantity } = req.body;
    const cart = db.carts.get(req.user.id);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find((i) => i.id === req.params.id || i.productId === req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = db.products.find((p) => p.id === item.productId);
    const availableStock = product ? product.stock : item.stock;

    const qty = Number(quantity);
    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i.id !== item.id);
    } else {
      if (qty > availableStock) {
        return res.status(400).json({
          message: `Requested quantity exceeds available stock (${availableStock})`
        });
      }
      item.quantity = qty;
    }

    cart.updatedAt = new Date().toISOString();
    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating cart item', error: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
export const removeCartItem = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const cart = db.carts.get(req.user.id);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((i) => i.id !== req.params.id && i.productId !== req.params.id);
    cart.updatedAt = new Date().toISOString();

    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: 'Error removing item from cart', error: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const cart = {
      userId: req.user.id,
      items: [],
      updatedAt: new Date().toISOString()
    };
    db.carts.set(req.user.id, cart);

    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};
