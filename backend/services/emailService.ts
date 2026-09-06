import nodemailer from 'nodemailer';
import { db } from '../config/db.js';
import { EmailLog, EmailCategory, Order, User } from '../types/index.js';

// Lazy Transporter Initializer with graceful error handling & simulation fallback
let transporter: nodemailer.Transporter | null = null;
let smtpAuthFailed = false;
let smtpWarningLogged = false;

export const getMailTransporter = (): nodemailer.Transporter | null => {
  if (smtpAuthFailed) return null;
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      });
      console.log(`[EmailService] SMTP Transporter initialized for ${host}:${port} (${user})`);
    } catch (err) {
      console.warn('[EmailService] Could not initialize SMTP transporter, using in-app notification center:', err);
    }
  }

  return transporter;
};

// Base HTML Wrapper for consistent, premium email design
const generateEmailLayout = (title: string, preheader: string, contentHtml: string): string => {
  const currentYear = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      padding: 28px 32px;
      text-align: center;
      color: #ffffff;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: #ffffff;
    }
    .logo-sub {
      font-size: 12px;
      color: #e0e7ff;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 32px;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer-links a {
      color: #4f46e5;
      text-decoration: none;
      margin: 0 8px;
    }
    .button-primary {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      margin: 16px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-success { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-info { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-warning { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-alert { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 24px 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .data-table th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .total-row {
      font-weight: 700;
      font-size: 15px;
      color: #0f172a;
    }
    .preheader {
      display: none;
      max-height: 0px;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">ShopSphere</div>
        <div class="logo-sub">Premium E-Commerce Platform</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">This email was sent automatically by ShopSphere Notification Dispatcher.</p>
        <p style="margin: 0 0 12px 0;">Need help? Contact our 24/7 concierge support at <a href="mailto:support@shopsphere.com" style="color: #4f46e5;">support@shopsphere.com</a></p>
        <div class="footer-links">
          <a href="#">Privacy Policy</a> • 
          <a href="#">Terms of Service</a> • 
          <a href="#">Security Center</a>
        </div>
        <p style="margin-top: 16px; font-size: 11px; color: #94a3b8;">© ${currentYear} ShopSphere Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  category: EmailCategory;
  htmlBody: string;
  textBody?: string;
  previewText?: string;
  metadata?: Record<string, any>;
}

export const emailService = {
  // Generic Sender that writes to database log and invokes SMTP when present
  send: async (options: SendEmailOptions): Promise<EmailLog> => {
    const fromAddress = process.env.EMAIL_FROM || 'ShopSphere Notifications <notifications@shopsphere.com>';
    const emailId = `eml_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const sentAt = new Date().toISOString();

    let deliveryStatus: 'delivered' | 'sent' | 'simulated' | 'failed' = 'delivered';

    const mailer = getMailTransporter();
    if (mailer && !smtpAuthFailed) {
      try {
        await mailer.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          text: options.textBody || options.previewText || options.subject,
          html: options.htmlBody
        });
        deliveryStatus = 'sent';
        console.log(`[EmailService] Dispatched via live SMTP to ${options.to} (${options.subject})`);
      } catch (err: any) {
        deliveryStatus = 'simulated';
        const errMsg = err?.message || String(err);
        if (errMsg.includes('534') || errMsg.includes('Application-specific password') || errMsg.includes('Invalid login') || errMsg.includes('EAUTH')) {
          smtpAuthFailed = true;
          transporter = null;
          if (!smtpWarningLogged) {
            console.log(`[EmailService] Note: SMTP Authentication requires a Google App Password (create one at https://myaccount.google.com/apppasswords). Seamlessly operating via In-App Notification Center.`);
            smtpWarningLogged = true;
          }
        } else {
          console.log(`[EmailService] SMTP unavailable (${errMsg}), dispatched to In-App Inbox & Notification Center.`);
        }
      }
    } else {
      deliveryStatus = 'delivered';
      console.log(`[EmailService] Dispatched automated ${options.category} to ${options.to} (Saved to In-App Inbox & Logs)`);
    }

    const emailLog: EmailLog = {
      id: emailId,
      to: options.to,
      toName: options.toName || options.to.split('@')[0],
      from: fromAddress,
      subject: options.subject,
      category: options.category,
      htmlBody: options.htmlBody,
      textBody: options.textBody || options.previewText,
      previewText: options.previewText,
      status: deliveryStatus,
      metadata: options.metadata || {},
      sentAt,
      read: false
    };

    // Store in global in-memory DB
    db.emailLogs.unshift(emailLog);

    return emailLog;
  },

  // 1. Automated Order Confirmation Email
  sendOrderConfirmation: async (order: Order): Promise<EmailLog> => {
    const title = `Order Confirmation #${order.orderNumber}`;
    const preheader = `Thank you for your order #${order.orderNumber}! We have received your purchase totaling ₹${order.totalAmount.toLocaleString('en-IN')}.`;

    const itemsRows = order.items
      .map(
        (item) => `
        <tr>
          <td style="display: flex; align-items: center; gap: 12px; padding: 10px 0;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" width="44" height="44" style="border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;" />` : ''}
            <div>
              <div style="font-weight: 600; color: #1e293b;">${item.name}</div>
              <div style="font-size: 11px; color: #64748b;">Qty: ${item.quantity} × ₹${item.price.toFixed(2)}</div>
            </div>
          </td>
          <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const contentHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="status-badge badge-success">Order Confirmed</span>
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 12px 0 4px 0;">Thank you for your order!</h1>
        <p style="font-size: 14px; color: #64748b; margin: 0;">We have received your order and our fulfillment team is preparing your package.</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Order Number:</td>
            <td style="text-align: right; font-weight: 700; color: #4f46e5; padding-bottom: 6px;">#${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Order Date:</td>
            <td style="text-align: right; color: #1e293b; padding-bottom: 6px;">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Payment Method:</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b; padding-bottom: 6px;">${order.paymentMethod} (${order.paymentStatus})</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Estimated Delivery:</td>
            <td style="text-align: right; font-weight: 600; color: #059669;">${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : '3-5 Business Days'}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 20px 0 8px 0;">Order Summary</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td style="color: #64748b; padding-top: 12px;">Subtotal</td>
            <td style="text-align: right; color: #1e293b; padding-top: 12px;">₹${order.itemsPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Shipping Fee</td>
            <td style="text-align: right; color: #1e293b;">${order.shippingPrice === 0 ? '<span style="color: #059669; font-weight: 600;">FREE</span>' : `₹${order.shippingPrice.toFixed(2)}`}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Estimated GST (12%)</td>
            <td style="text-align: right; color: #1e293b;">₹${order.taxPrice.toFixed(2)}</td>
          </tr>
          ${order.discountPrice > 0 ? `
          <tr>
            <td style="color: #059669; font-weight: 600;">Coupon Discount</td>
            <td style="text-align: right; color: #059669; font-weight: 600;">-₹${order.discountPrice.toFixed(2)}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td style="padding-top: 14px; border-top: 2px solid #e2e8f0; font-size: 16px;">Final Amount</td>
            <td style="padding-top: 14px; border-top: 2px solid #e2e8f0; text-align: right; font-size: 18px; color: #4f46e5;">₹${order.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="divider"></div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Shipping Destination</h4>
          <div style="font-weight: 600; color: #0f172a; font-size: 14px;">${order.shippingAddress.fullName}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 2px;">
            ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Phone: ${order.shippingAddress.phone}</div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 28px;">
        <a href="#track-order" class="button-primary" style="padding: 14px 32px; font-size: 15px;">
          📦 View Live Order & Tracking Timeline
        </a>
      </div>
    `;

    const fullHtml = generateEmailLayout(title, preheader, contentHtml);

    return emailService.send({
      to: order.userEmail,
      toName: order.userName,
      subject: `Order Confirmed: #${order.orderNumber} (ShopSphere)`,
      category: 'order_confirmation',
      htmlBody: fullHtml,
      previewText: preheader,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus
      }
    });
  },

  // 2. Automated Shipment & Order Status Tracking Email
  sendShipmentTrackingUpdate: async (order: Order, previousStatus?: string): Promise<EmailLog> => {
    const status = order.orderStatus;
    let badgeClass = 'badge-info';
    let headline = `Shipment Update: Your order is now ${status}`;
    let icon = '🚚';

    if (status === 'Shipped') {
      badgeClass = 'badge-info';
      headline = 'Your package has been handed to the courier!';
      icon = '🚀';
    } else if (status === 'Out for Delivery') {
      badgeClass = 'badge-warning';
      headline = 'Your package is out for delivery today!';
      icon = '🛵';
    } else if (status === 'Delivered') {
      badgeClass = 'badge-success';
      headline = 'Package Delivered! Enjoy your purchase.';
      icon = '🎉';
    } else if (status === 'Cancelled') {
      badgeClass = 'badge-alert';
      headline = 'Your order has been cancelled.';
      icon = '⚠️';
    } else if (status === 'Processing') {
      badgeClass = 'badge-info';
      headline = 'Items are being assembled and packed.';
      icon = '📦';
    }

    const title = `Shipment Update: #${order.orderNumber} - ${status}`;
    const preheader = `Status update for Order #${order.orderNumber}: Package is now ${status}. Carrier: ${order.carrier || 'BlueDart Express'}, Tracking: ${order.trackingNumber || 'Available'}.`;

    const contentHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="status-badge ${badgeClass}">${status}</span>
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 12px 0 4px 0;">${icon} ${headline}</h1>
        <p style="font-size: 14px; color: #64748b; margin: 0;">Order <strong>#${order.orderNumber}</strong> has advanced in the fulfillment pipeline.</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Assigned Carrier</div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${order.carrier || 'BlueDart Express'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Tracking Number</div>
            <div style="font-size: 14px; font-family: monospace; font-weight: 700; color: #4f46e5;">${order.trackingNumber || 'TRK-IN-PENDING'}</div>
          </div>
        </div>

        <div style="padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #334155;">
          <strong>Estimated Delivery:</strong> <span style="color: #059669; font-weight: 600;">${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' }) : '3-5 Business Days'}</span>
        </div>
      </div>

      <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 16px 0 10px 0;">Milestone History</h3>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px;">
        ${order.trackingTimeline
          .map(
            (step) => `
            <div style="display: flex; gap: 12px; margin-bottom: 12px; position: relative;">
              <div style="font-size: 16px; line-height: 1;">${step.completed ? '✅' : '⚪'}</div>
              <div style="flex: 1;">
                <div style="font-weight: ${step.current ? '700' : '600'}; color: ${step.current ? '#4f46e5' : '#1e293b'}; font-size: 13px;">
                  ${step.title} ${step.current ? '<span style="font-size: 10px; background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 10px; margin-left: 6px;">CURRENT</span>' : ''}
                </div>
                <div style="font-size: 12px; color: #64748b;">${step.description}</div>
                ${step.timestamp ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${step.timestamp}</div>` : ''}
              </div>
            </div>
          `
          )
          .join('')}
      </div>

      <div style="text-align: center; margin-top: 28px;">
        <a href="#track-order-${order.orderNumber}" class="button-primary" style="padding: 14px 32px; font-size: 14px;">
          📍 Open Real-Time Shipment Tracker
        </a>
      </div>
    `;

    const fullHtml = generateEmailLayout(title, preheader, contentHtml);

    return emailService.send({
      to: order.userEmail,
      toName: order.userName,
      subject: `Tracking Update: Order #${order.orderNumber} is ${status}`,
      category: 'shipment_tracking',
      htmlBody: fullHtml,
      previewText: preheader,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        orderStatus: order.orderStatus,
        previousStatus
      }
    });
  },

  // 3. Security Alert & 2FA OTP Email
  sendTwoFactorOtpEmail: async (user: User, otp: string, expiresMinutes: number = 5): Promise<EmailLog> => {
    const title = 'Your ShopSphere 2FA Security Code';
    const preheader = `Your 2FA verification code is ${otp}. Valid for ${expiresMinutes} minutes. Never share this code.`;

    const contentHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="status-badge badge-warning">Administrator 2FA</span>
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 12px 0 4px 0;">Two-Factor Verification Code</h1>
        <p style="font-size: 14px; color: #64748b; margin: 0;">Use the cryptographic code below to authenticate your Administrator session.</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 2px dashed #6366f1; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
        <div style="font-size: 12px; text-transform: uppercase; color: #4f46e5; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Single-Use OTP Code</div>
        <div style="font-size: 36px; font-weight: 800; font-family: monospace; letter-spacing: 8px; color: #1e1b4b; background: #ffffff; padding: 12px 24px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e0e7ff;">
          ${otp}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 12px;">
          ⏱️ Valid for <strong>${expiresMinutes} minutes</strong> (Single session only)
        </div>
      </div>

      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px; font-size: 12px; color: #991b1b;">
        <strong>🛡️ Security Warning:</strong> ShopSphere staff will NEVER ask for your OTP. If you did not initiate this administrator login, please change your master password immediately.
      </div>
    `;

    const fullHtml = generateEmailLayout(title, preheader, contentHtml);

    return emailService.send({
      to: user.email,
      toName: user.name,
      subject: `[Security Code] ${otp} is your ShopSphere 2FA Verification Code`,
      category: '2fa_otp',
      htmlBody: fullHtml,
      previewText: preheader,
      metadata: {
        userId: user.id,
        otp,
        expiresMinutes
      }
    });
  },

  // 4. Account Security Alert (Password Changed, Lockout, Suspicious Login)
  sendSecurityAlert: async (
    user: { email: string; name: string; id?: string },
    alertType: 'password_changed' | 'account_lockout' | 'new_login' | 'reset_requested',
    details?: { ipAddress?: string; userAgent?: string; resetLink?: string; lockMinutes?: number }
  ): Promise<EmailLog> => {
    let subject = 'Security Alert: Account Activity';
    let badge = 'badge-alert';
    let headline = 'Security Notice on Your Account';
    let description = 'We detected important security activity related to your ShopSphere account.';
    let category: EmailCategory = 'security_alert';

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    if (alertType === 'password_changed') {
      subject = 'Security Alert: Your ShopSphere Password was Changed';
      headline = 'Password Successfully Updated';
      description = 'Your account password was recently changed. If you performed this action, you can safely ignore this email.';
      category = 'security_alert';
    } else if (alertType === 'account_lockout') {
      subject = 'Security Alert: Account Temporarily Locked';
      badge = 'badge-alert';
      headline = 'Account Temporarily Locked (Brute Force Protection)';
      description = `Due to 5 consecutive failed login attempts, your account has been temporarily locked for ${details?.lockMinutes || 15} minutes to prevent unauthorized access.`;
      category = 'account_lockout';
    } else if (alertType === 'reset_requested') {
      subject = 'Password Reset Request (ShopSphere)';
      badge = 'badge-warning';
      headline = 'Password Reset Instructions';
      description = 'We received a request to reset your password. Use the security token or recovery link to set a new password.';
      category = 'password_reset';
    } else if (alertType === 'new_login') {
      subject = 'Security Alert: New Sign-In to Your Account';
      badge = 'badge-info';
      headline = 'New Sign-In Detected';
      description = 'Your account was accessed from a new browser or session.';
      category = 'security_alert';
    }

    const preheader = `${headline} - ${description}`;

    const contentHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="status-badge ${badge}">Security Event</span>
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 12px 0 4px 0;">${headline}</h1>
        <p style="font-size: 14px; color: #64748b; margin: 0;">${description}</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
        <table style="width: 100%;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Account:</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right;">${user.email}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Timestamp:</td>
            <td style="color: #1e293b; text-align: right;">${timestamp}</td>
          </tr>
          ${details?.ipAddress ? `
          <tr>
            <td style="color: #64748b; padding: 4px 0;">IP Address:</td>
            <td style="font-family: monospace; color: #1e293b; text-align: right;">${details.ipAddress}</td>
          </tr>` : ''}
        </table>
      </div>

      ${details?.resetLink ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${details.resetLink}" class="button-primary" style="background: #dc2626;">Reset Your Password Now</a>
      </div>` : ''}

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; font-size: 12px; color: #1e40af;">
        <strong>Didn't make this change?</strong> Please contact support immediately at <a href="mailto:security@shopsphere.com" style="color: #1d4ed8; text-decoration: underline;">security@shopsphere.com</a> to lock and recover your credentials.
      </div>
    `;

    const fullHtml = generateEmailLayout(subject, preheader, contentHtml);

    return emailService.send({
      to: user.email,
      toName: user.name,
      subject,
      category,
      htmlBody: fullHtml,
      previewText: preheader,
      metadata: {
        userId: user.id,
        alertType,
        ...details
      }
    });
  }
};
