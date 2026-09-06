import { Router } from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getAdminStats } from '../controllers/statsController.js';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { getOrders, updateOrderStatus, deleteOrder } from '../controllers/orderController.js';
import { createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';

const router = Router();

// Apply protect & admin to ALL admin routes
router.use(protect, admin);

// Admin Role Verification
router.get('/verify', (req: any, res: any) => {
  res.json({
    verified: true,
    role: req.user?.role || 'admin',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Admin Dashboard & Analytics
router.get('/dashboard', getAdminStats);

// Admin Users Management
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

// Admin Orders Management
router.route('/orders')
  .get(getOrders);

router.route('/orders/:id/status')
  .put(updateOrderStatus);

router.route('/orders/:id')
  .delete(deleteOrder);

// Admin Products Management
router.route('/products')
  .post(createProduct);

router.route('/products/:id')
  .put(updateProduct)
  .delete(deleteProduct);

// Admin Categories Management
router.route('/categories')
  .post(createCategory);

router.route('/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

export default router;
