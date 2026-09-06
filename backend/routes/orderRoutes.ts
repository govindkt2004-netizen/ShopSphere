import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  cancelOrder
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.route('/my-orders')
  .get(protect, getMyOrders);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

router.route('/:id')
  .get(getOrderById)
  .delete(protect, admin, deleteOrder);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

export default router;
