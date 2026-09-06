import { Router } from 'express';
import {
  registerUser,
  loginUser,
  sendPhoneOtp,
  verifyPhoneOtp,
  verifyTwoFactor,
  resendTwoFactor,
  googleAuthUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
  verifyAdmin,
  deleteOwnAccount,
  getSmsStatus
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public auth routes with rate limiting
router.get('/sms-status', getSmsStatus);
router.post('/register', authRateLimiter(10, 60000), registerUser);
router.post('/login', authRateLimiter(15, 60000), loginUser);
router.post('/phone/send-otp', authRateLimiter(6, 60000), sendPhoneOtp);
router.post('/phone/verify-otp', authRateLimiter(15, 60000), verifyPhoneOtp);
router.post('/verify-2fa', authRateLimiter(20, 60000), verifyTwoFactor);
router.post('/resend-2fa', authRateLimiter(10, 60000), resendTwoFactor);
router.post('/google', authRateLimiter(20, 60000), googleAuthUser);
router.post('/forgot-password', authRateLimiter(6, 60000), forgotPassword);
router.post('/reset-password', authRateLimiter(10, 60000), resetPassword);
router.post('/logout', logoutUser);


// Protected user routes
router.get('/me', protect, getUserProfile);
router.get('/profile', protect, getUserProfile);
router.get('/verify-admin', protect, admin, verifyAdmin);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteOwnAccount);

export default router;
