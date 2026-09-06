import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { emailService } from '../services/emailService.js';
import { EmailCategory } from '../types/index.js';

// @desc    Get current user's email notifications
// @route   GET /api/notifications/my-emails
// @access  Private
export const getMyEmails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userEmail = req.user.email.toLowerCase();
    const emails = db.emailLogs.filter(
      (e) => e.to.toLowerCase() === userEmail || (e.metadata && e.metadata.userId === req.user!.id)
    );

    const unreadCount = emails.filter((e) => !e.read).length;

    res.json({
      emails,
      unreadCount,
      totalCount: emails.length
    });
  } catch (error: any) {
    console.error('Error fetching user emails:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// @desc    Get all email logs (Admin)
// @route   GET /api/notifications/all-emails
// @access  Private/Admin
export const getAllEmails = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;

    let list = [...db.emailLogs];

    if (category && typeof category === 'string' && category !== 'all') {
      list = list.filter((e) => e.category === category);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.to.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          (e.toName && e.toName.toLowerCase().includes(q)) ||
          (e.metadata?.orderNumber && e.metadata.orderNumber.toLowerCase().includes(q)) ||
          (e.metadata?.trackingNumber && e.metadata.trackingNumber.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    res.json({
      emails: paginated,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error: any) {
    console.error('Error fetching admin email logs:', error);
    res.status(500).json({ message: 'Error fetching email logs', error: error.message });
  }
};

// @desc    Mark email as read
// @route   PUT /api/notifications/read/:id
// @access  Private
export const markEmailAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const email = db.emailLogs.find((e) => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ message: 'Email notification not found' });
    }

    // Customer can only mark their own emails
    if (email.to.toLowerCase() !== req.user.email.toLowerCase() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    email.read = true;
    res.json({ message: 'Marked as read', email });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating notification status', error: error.message });
  }
};

// @desc    Mark all emails as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllEmailsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userEmail = req.user.email.toLowerCase();
    db.emailLogs.forEach((e) => {
      if (e.to.toLowerCase() === userEmail || req.user!.role === 'admin') {
        e.read = true;
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error marking notifications', error: error.message });
  }
};

// @desc    Resend an email notification
// @route   POST /api/notifications/resend/:id
// @access  Private
export const resendEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const email = db.emailLogs.find((e) => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ message: 'Email notification not found' });
    }

    if (email.to.toLowerCase() !== req.user.email.toLowerCase() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Re-dispatch using emailService
    const reDispatched = await emailService.send({
      to: email.to,
      toName: email.toName,
      subject: `[Resent] ${email.subject}`,
      category: email.category,
      htmlBody: email.htmlBody,
      previewText: email.previewText,
      metadata: {
        ...email.metadata,
        resentFromId: email.id,
        resentAt: new Date().toISOString()
      }
    });

    res.json({
      message: `Email notification resent successfully to ${email.to}`,
      email: reDispatched
    });
  } catch (error: any) {
    console.error('Error resending email:', error);
    res.status(500).json({ message: 'Error resending email', error: error.message });
  }
};

// @desc    Send test email or sample alert
// @route   POST /api/notifications/send-test
// @access  Private/Admin or Authenticated User
export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { to, type = 'order_confirmation' } = req.body;
    const targetEmail = to || req.user?.email || 'customer@shopsphere.com';
    const targetName = req.user?.name || 'Valued Customer';

    let result;

    if (type === 'order_confirmation') {
      const sampleOrder = db.orders[0] || {
        id: `ord_${Date.now()}`,
        orderNumber: 'SPH-DEMO-999',
        userId: req.user?.id || 'usr_test',
        userName: targetName,
        userEmail: targetEmail,
        items: [
          {
            productId: 'prod_1',
            name: 'AeroPulse Wireless Studio Headphones',
            price: 14999,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            quantity: 1
          }
        ],
        itemsPrice: 14999,
        shippingPrice: 0,
        taxPrice: 1799.88,
        discountPrice: 1000,
        totalAmount: 15798.88,
        shippingAddress: {
          fullName: targetName,
          phone: '+91 98438 90123',
          street: '742 Silver Oak Heights, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400050',
          country: 'India'
        },
        paymentMethod: 'UPI / Google Pay',
        paymentStatus: 'Paid',
        orderStatus: 'Confirmed',
        trackingNumber: 'TRK-IN-DEMO999',
        carrier: 'BlueDart Express',
        estimatedDelivery: '2026-08-28',
        trackingTimeline: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      result = await emailService.sendOrderConfirmation({
        ...sampleOrder,
        userEmail: targetEmail,
        userName: targetName
      });
    } else if (type === 'shipment_tracking') {
      const sampleOrder = db.orders[0] || {
        id: `ord_${Date.now()}`,
        orderNumber: 'SPH-DEMO-999',
        userId: req.user?.id || 'usr_test',
        userName: targetName,
        userEmail: targetEmail,
        items: [],
        itemsPrice: 14999,
        shippingPrice: 0,
        taxPrice: 1799.88,
        discountPrice: 0,
        totalAmount: 16798.88,
        shippingAddress: {
          fullName: targetName,
          phone: '+91 98438 90123',
          street: '742 Silver Oak Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400050',
          country: 'India'
        },
        paymentMethod: 'Credit/Debit Card',
        paymentStatus: 'Paid',
        orderStatus: 'Out for Delivery',
        trackingNumber: 'TRK-IN-88992211',
        carrier: 'BlueDart Express',
        estimatedDelivery: 'Today by 5:00 PM',
        trackingTimeline: db.constructor ? (db as any).constructor.generateTimeline('Out for Delivery') : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      result = await emailService.sendShipmentTrackingUpdate({
        ...sampleOrder,
        userEmail: targetEmail,
        userName: targetName,
        orderStatus: 'Out for Delivery'
      });
    } else if (type === 'security_alert') {
      result = await emailService.sendSecurityAlert(
        { email: targetEmail, name: targetName },
        'new_login',
        { ipAddress: '103.21.124.89', userAgent: 'Chrome on macOS' }
      );
    } else if (type === '2fa_otp') {
      result = await emailService.sendTwoFactorOtpEmail(
        { id: 'usr_test', email: targetEmail, name: targetName, role: 'admin', createdAt: new Date().toISOString() },
        '739201',
        5
      );
    } else {
      result = await emailService.sendSecurityAlert(
        { email: targetEmail, name: targetName },
        'password_changed'
      );
    }

    res.json({
      message: `Test ${type} email dispatched successfully to ${targetEmail}`,
      email: result
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Error sending test email', error: error.message });
  }
};
