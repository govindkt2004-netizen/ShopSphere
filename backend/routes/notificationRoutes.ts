import { Router } from 'express';
import {
  getMyEmails,
  getAllEmails,
  markEmailAsRead,
  markAllEmailsAsRead,
  resendEmail,
  sendTestEmail
} from '../controllers/notificationController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Customer & Admin: my email notifications
router.get('/my-emails', protect, getMyEmails);
router.put('/read/:id', protect, markEmailAsRead);
router.put('/read-all', protect, markAllEmailsAsRead);
router.post('/resend/:id', protect, resendEmail);
router.post('/send-test', protect, sendTestEmail);

// Admin only: view all outbound emails in the platform
router.get('/all-emails', protect, requireAdmin, getAllEmails);

export default router;
