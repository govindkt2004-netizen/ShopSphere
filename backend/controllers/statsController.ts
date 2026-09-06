import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// @desc    Get Admin Dashboard Stats
// @route   GET /api/stats
// @access  Private/Admin
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = db.users.length;
    const totalProducts = db.products.length;
    const totalOrders = db.orders.length;

    const totalRevenue = Number(
      db.orders
        .filter((o) => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0)
        .toFixed(2)
    );

    // Low stock products (stock <= 8)
    const lowStockProducts = db.products
      .filter((p) => p.stock <= 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        category: p.category,
        price: p.price,
        image: p.images[0]
      }));

    // Status breakdown
    const orderStatusCounts: Record<string, number> = {
      'Order Placed': 0,
      'Confirmed': 0,
      'Processing': 0,
      'Shipped': 0,
      'Out for Delivery': 0,
      'Delivered': 0,
      'Cancelled': 0
    };

    db.orders.forEach((o) => {
      if (orderStatusCounts[o.orderStatus] !== undefined) {
        orderStatusCounts[o.orderStatus]++;
      }
    });

    // Recent 6 orders
    const recentOrders = db.orders.slice(0, 6);

    // Category breakdown
    const categorySales: Record<string, { count: number; revenue: number }> = {};
    db.categories.forEach((cat) => {
      categorySales[cat.name] = { count: 0, revenue: 0 };
    });

    db.orders.forEach((o) => {
      if (o.orderStatus !== 'Cancelled') {
        o.items.forEach((item) => {
          const prod = db.products.find((p) => p.id === item.productId);
          const cat = prod?.category || 'General';
          if (!categorySales[cat]) {
            categorySales[cat] = { count: 0, revenue: 0 };
          }
          categorySales[cat].count += item.quantity;
          categorySales[cat].revenue += item.price * item.quantity;
        });
      }
    });

    // Generate monthly sales mockup for analytics chart
    const monthlySales = [
      { month: 'Mar', sales: 4200, orders: 28 },
      { month: 'Apr', sales: 6100, orders: 42 },
      { month: 'May', sales: 7800, orders: 55 },
      { month: 'Jun', sales: 9400, orders: 68 },
      { month: 'Jul', sales: 11200, orders: 82 },
      { month: 'Aug', sales: 14500 + totalRevenue, orders: 95 + totalOrders }
    ];

    res.json({
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      lowStockProducts,
      orderStatusCounts,
      recentOrders,
      categorySales,
      monthlySales
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
};
