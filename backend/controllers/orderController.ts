import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Order, OrderStatus } from '../types/index.js';
import { emailService } from '../services/emailService.js';
import {
  broadcastNewOrder,
  broadcastOrderStatusUpdate,
  broadcastStockUpdate
} from '../services/websocketService.js';

// Valid status transitions
const VALID_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  'Order Placed': ['Confirmed', 'Processing', 'Cancelled'],
  'Confirmed': ['Processing', 'Shipped', 'Cancelled'],
  'Processing': ['Shipped', 'Cancelled'],
  'Shipped': ['Out for Delivery', 'Delivered'],
  'Out for Delivery': ['Delivered'],
  'Delivered': [],
  'Cancelled': []
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { items, shippingAddress, paymentMethod, discountPrice = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // Verify stock and calculate price
    let itemsPrice = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name || item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = product.price * item.quantity;
      itemsPrice += itemTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0] || item.image,
        quantity: item.quantity
      });

      // Deduct stock
      product.stock -= item.quantity;
    }

    // Shipping calculation (free over ₹999, else ₹99)
    const shippingPrice = itemsPrice >= 999 ? 0 : 99.0;
    // GST Tax calculation (12%)
    const taxPrice = Number((itemsPrice * 0.12).toFixed(2));
    const finalDiscount = Number(discountPrice) || 0;
    const totalAmount = Number(Math.max(0, itemsPrice + shippingPrice + taxPrice - finalDiscount).toFixed(2));

    const orderNumber = `SPH-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      items: validatedItems,
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountPrice: finalDiscount,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'UPI / Google Pay',
      paymentStatus: paymentMethod === 'Cash on Delivery (COD)' ? 'Pending' : 'Paid',
      orderStatus: 'Order Placed',
      trackingNumber: `TRK-IN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      carrier: 'BlueDart Express',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      trackingTimeline: [
        {
          status: 'Order Placed',
          title: 'Order Placed',
          description: 'Your order was successfully received and registered in the fulfillment hub.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: true
        },
        {
          status: 'Confirmed',
          title: 'Payment Confirmed',
          description: 'Payment authorized and verified.',
          completed: false,
          current: false
        },
        {
          status: 'Processing',
          title: 'Packaging & Quality Check',
          description: 'Items securely packaged at distribution center.',
          completed: false,
          current: false
        },
        {
          status: 'Shipped',
          title: 'Handed to Carrier',
          description: 'En route with shipping courier.',
          completed: false,
          current: false
        },
        {
          status: 'Out for Delivery',
          title: 'Out for Delivery',
          description: 'Courier driver will deliver to your doorstep.',
          completed: false,
          current: false
        },
        {
          status: 'Delivered',
          title: 'Delivered',
          description: 'Package delivered and signed for.',
          completed: false,
          current: false
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    db.orders.unshift(order);

    // Real-time broadcast: stock updates across all connected storefronts
    for (const item of validatedItems) {
      const p = db.products.find((prod) => prod.id === item.productId);
      if (p) {
        broadcastStockUpdate(p.id, p.stock, p.name);
      }
    }

    // Real-time broadcast: new order alert for Admin & Customer
    broadcastNewOrder(order);

    // Clear user's cart after successful checkout
    db.carts.set(req.user.id, {
      userId: req.user.id,
      items: [],
      updatedAt: now
    });

    // Automatically send real-time order confirmation email
    emailService.sendOrderConfirmation(order).catch((err) => {
      console.warn('[OrderController] Automated order confirmation email error:', err);
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const orders = db.orders.filter((o) => o.userId === req.user!.id);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// @desc    Cancel order (Customer or Admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Security check: Only order owner or admin can cancel
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to cancel this order.' });
    }

    // Rule: Can only cancel if order has NOT been shipped yet
    if (order.orderStatus === 'Shipped' || order.orderStatus === 'Out for Delivery' || order.orderStatus === 'Delivered') {
      return res.status(400).json({
        message: `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}.`
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    order.orderStatus = 'Cancelled';
    order.updatedAt = new Date().toISOString();

    // Restock items
    order.items.forEach((item) => {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
        broadcastStockUpdate(prod.id, prod.stock, prod.name);
      }
    });

    order.trackingTimeline = [
      ...order.trackingTimeline.filter((t) => t.completed),
      {
        status: 'Cancelled',
        title: 'Order Cancelled',
        description: 'Order cancelled by customer. Any paid amount will be refunded within 3-5 business days.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        current: true
      }
    ];

    // Real-time broadcast: order cancelled status update
    broadcastOrderStatusUpdate(order, 'Cancelled');

    // Automatically send cancellation update email
    emailService.sendShipmentTrackingUpdate(order, 'Cancelled').catch((err) => {
      console.warn('[OrderController] Cancellation email notification error:', err);
    });

    res.json({
      message: 'Order has been cancelled successfully and items restocked.',
      order
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

// @desc    Get order by ID, orderNumber, or trackingNumber
// @route   GET /api/orders/:id
// @access  Private / Public lookup
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const rawParam = req.params.id || '';
    const param = decodeURIComponent(rawParam).trim().replace(/^#/, '');
    const cleanParam = param.toLowerCase();
    const alphaNumParam = param.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    let order = db.orders.find((o) => {
      const matchId = o.id && o.id.toLowerCase() === cleanParam;
      const matchOrderNum = o.orderNumber && o.orderNumber.toLowerCase() === cleanParam;
      const matchTracking = o.trackingNumber && o.trackingNumber.toLowerCase() === cleanParam;
      return matchId || matchOrderNum || matchTracking;
    });

    if (!order && alphaNumParam) {
      order = db.orders.find((o) => {
        const oIdClean = o.id ? o.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
        const oNumClean = o.orderNumber ? o.orderNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
        const oTrkClean = o.trackingNumber ? o.trackingNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
        return oIdClean === alphaNumParam || oNumClean === alphaNumParam || oTrkClean === alphaNumParam;
      });
    }

    if (!order && alphaNumParam.length >= 4) {
      order = db.orders.find((o) => {
        const oNum = (o.orderNumber || '').toLowerCase();
        const oTrk = (o.trackingNumber || '').toLowerCase();
        const oId = (o.id || '').toLowerCase();
        return oNum.includes(cleanParam) || oTrk.includes(cleanParam) || oId.includes(cleanParam);
      });
    }

    if (!order && (cleanParam === 'latest' || cleanParam === 'sample' || cleanParam === 'default')) {
      order = db.orders[0];
    }

    if (!order) {
      return res.status(404).json({
        message: `Order "${param}" not found. Please check your order ID or tracking number.`
      });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders or GET /api/admin/orders
// @access  Private/Admin
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let list = [...db.orders];

    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter((o) => o.orderStatus.toLowerCase() === status.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    res.json({
      orders: paginated,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching orders list', error: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status or PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, trackingNumber, carrier, estimatedDelivery, paymentStatus } = req.body;
    const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const prevStatus = order.orderStatus;

    if (status) {
      const targetStatus = status as OrderStatus;

      // Allow admin forced override or enforce workflow
      order.orderStatus = targetStatus;
      order.trackingTimeline = db.constructor ? (db as any).constructor.generateTimeline(targetStatus, order.createdAt) : order.trackingTimeline;
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    order.updatedAt = new Date().toISOString();

    // Real-time broadcast: order tracking status update
    broadcastOrderStatusUpdate(order, prevStatus);

    // Automatically send shipment status update email to customer
    emailService.sendShipmentTrackingUpdate(order, prevStatus).catch((err) => {
      console.warn('[OrderController] Shipment status email notification error:', err);
    });

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// @desc    Delete an order (Admin)
// @route   DELETE /api/orders/:id or DELETE /api/admin/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const index = db.orders.findIndex((o) => o.id === req.params.id || o.orderNumber === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [deleted] = db.orders.splice(index, 1);
    res.json({ message: `Order ${deleted.orderNumber || deleted.id} deleted successfully`, id: deleted.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};
