import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../config/db.js';
import { generateToken, AuthRequest } from '../middleware/authMiddleware.js';
import { User, UserAddress } from '../types/index.js';
import { emailService } from '../services/emailService.js';
import { smsService, maskPhoneNumber } from '../services/smsService.js';

// Firebase Admin SDK
// The backend verifies Firebase ID tokens issued by the ShopSphere Firebase project.
const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'shopsphere-589de'
      });

const firebaseAdminAuth = getAuth(firebaseAdminApp);

const JWT_SECRET = process.env.JWT_SECRET || 'shopsphere_jwt_secret_super_secure_key_2026';
const OTP_SALT = process.env.OTP_SECRET_SALT || 'shopsphere_secure_otp_salt_2026';

// In-Memory Phone OTP Store for SMS Verification
interface PhoneOtpRecord {
  phone: string;
  hash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
const phoneOtpStore = new Map<string, PhoneOtpRecord>();

// Helper to hash OTP cryptographically with salt (never store plain OTP)
export const hashOtp = (otp: string, saltKey: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${otp.trim()}:${saltKey}:${OTP_SALT}`)
    .digest('hex');
};

// Helper to sanitize user output (never leak password / reset tokens / 2FA secrets)
export const sanitizeUser = (user: User) => {
  const {
    password,
    resetPasswordToken,
    resetPasswordExpire,
    twoFactorCode,
    twoFactorExpires,
    twoFactorAttempts,
    twoFactorSecret,
    ...safeUser
  } = user;
  return safeUser;
};

// Normalize phone numbers by extracting digits only
export const normalizePhone = (phoneStr: string): string => {
  return phoneStr.replace(/\D/g, '');
};

// Mask sensitive contact details for 2FA and verification screens
export const maskContactInfo = (email?: string, phone?: string) => {
  let maskedEmail = '';
  let maskedPhone = '';
  if (email) {
    const parts = email.split('@');
    const namePart = parts[0];
    const domainPart = parts[1] || '';
    const maskedName =
      namePart.length > 2
        ? `${namePart.slice(0, 2)}***${namePart.slice(-1)}`
        : `${namePart}***`;
    maskedEmail = `${maskedName}@${domainPart}`;
  }
  if (phone) {
    maskedPhone = maskPhoneNumber(phone);
  }
  return { maskedEmail, maskedPhone };
};

// Smart search for user by email or phone
export const findUserByIdentifier = (identifier: string): User | undefined => {
  const clean = identifier.trim();
  if (!clean) return undefined;

  // 1. Email check (if contains @ or exact match)
  if (clean.includes('@')) {
    const cleanEmail = clean.toLowerCase();
    const userByEmail = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (userByEmail) return userByEmail;
  }

  const userByExactEmail = db.users.find((u) => u.email.toLowerCase() === clean.toLowerCase());
  if (userByExactEmail) return userByExactEmail;

  // 2. Phone check (normalized digits comparison)
  const inputDigits = normalizePhone(clean);
  if (inputDigits.length >= 7) {
    const userByPhone = db.users.find((u) => {
      if (!u.phone) return false;
      const uDigits = normalizePhone(u.phone);
      if (uDigits === inputDigits) return true;
      if (inputDigits.length === 10 && uDigits.endsWith(inputDigits)) return true;
      if (uDigits.length === 10 && inputDigits.endsWith(uDigits)) return true;
      return false;
    });
    if (userByPhone) return userByPhone;
  }

  return undefined;
};

// Helper: Generate secure 6-digit numeric OTP using crypto
const generateOTP = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Helper: Generate temporary 2FA verification token
const generateTwoFactorToken = (userId: string): string => {
  return jwt.sign({ id: userId, is2FA: true }, JWT_SECRET, {
    expiresIn: '10m'
  });
};


// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, confirmPassword, address } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: 'Please provide full name, email address, phone number, and password.'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.toLowerCase().trim();

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const cleanPhone = phone.trim();
    const phoneDigits = normalizePhone(cleanPhone);
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      return res.status(400).json({
        message: 'Please enter a valid phone number (8-15 digits with optional country code).'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Check unique email
    const emailExists = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    // Check unique phone number
    const phoneExists = db.users.find((u) => u.phone && normalizePhone(u.phone) === phoneDigits);
    if (phoneExists) {
      return res.status(400).json({ message: 'An account with this phone number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const defaultAddr: UserAddress = address || {
      fullName: name.trim(),
      phone: cleanPhone,
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: true,
      label: 'Primary'
    };

    // CRITICAL SECURITY: Registration role is strictly forced to 'customer'
    // Public users cannot register as 'admin' under any circumstances.
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: 'customer',
      authProvider: 'local',
      isActive: true,
      emailVerified: false,
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      lastLogin: now,
      address: defaultAddr,
      addresses: [defaultAddr],
      createdAt: now,
      updatedAt: now
    };

    db.users.push(newUser);

    const token = generateToken(newUser.id, 'customer');

    res.status(201).json({
      user: sanitizeUser(newUser),
      token,
      message: 'Account created successfully as verified customer.'
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// @desc    Unified Login (Email OR Phone Number + Password)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const rawIdentifier = (identifier || email || phone || '').toString().trim();

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        message: 'Please provide your email address or phone number, and password.'
      });
    }

    const user = findUserByIdentifier(rawIdentifier);

    // If user not found, use safe generic error to prevent user enumeration
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials. Please check your details and try again.'
      });
    }

    // Check if account is temporarily locked
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockUntil).getTime() - Date.now()) / 60000
      );
      return res.status(423).json({
        message: `Account is temporarily locked due to repeated failed login attempts. Please wait ${remainingMinutes} minute(s) before trying again, or reset your password.`
      });
    }

    // Check if account is deactivated
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact support at support@shopsphere.com.'
      });
    }

    // Check if account was registered via Google only (no password set)
    if (!user.password) {
      return res.status(400).json({
        message: 'This account was created with Google Sign-In. Please use Continue with Google.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account after 5 consecutive failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
        
        // Dispatch Security Alert Email for Account Lockout
        emailService.sendSecurityAlert(user, 'account_lockout', {
          lockMinutes: 15,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'
        }).catch((err) => console.warn('[AuthController] Lockout alert email error:', err));

        return res.status(401).json({
          message:
            'Invalid credentials. Your account is now temporarily locked for 15 minutes due to multiple failed login attempts.'
        });
      }

      return res.status(401).json({
        message: 'Invalid credentials. Please check your details and try again.'
      });
    }

    // Reset failed login counter on successful password verification
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    // Database is the absolute source of truth for user role
    const trueRole = user.role;

    // ==========================================
    // ADMIN FLOW: Enforce Two-Factor Authentication (2FA)
    // ==========================================
    if (trueRole === 'admin') {
      const otp = generateOTP();
      const hashedOtp = hashOtp(otp, user.id);

      user.twoFactorCode = hashedOtp;
      user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry
      user.twoFactorAttempts = 0;
      user.updatedAt = new Date().toISOString();

      // Dispatch automated 2FA OTP Code email to Administrator
      emailService.sendTwoFactorOtpEmail(user, otp, 5).catch((err) => {
        console.warn('[AuthController] 2FA OTP email dispatch error:', err);
      });

      // Dispatch automated SMS OTP and strictly verify delivery response
      let smsDelivered = false;
      let smsProvider: string | undefined;
      let smsError: string | undefined;

      if (user.phone) {
        if (smsService.isConfigured()) {
          const smsRes = await smsService.sendOtpSms(user.phone, otp, 5);
          if (smsRes.success) {
            smsDelivered = true;
            smsProvider = smsRes.provider;
          } else {
            smsError = smsRes.error || 'SMS provider delivery failed';
            console.log('[AuthController] 2FA OTP SMS error:', smsError);
          }
        } else {
          smsError = 'SMS service is not configured';
          console.log('[AuthController] SMS service is not configured for phone 2FA');
        }
      }

      const twoFactorToken = generateTwoFactorToken(user.id);
      const { maskedEmail, maskedPhone } = maskContactInfo(user.email, user.phone);

      // Do NOT display "Verification code sent to <phone>" unless the SMS provider confirmed delivery!
      let displayMessage = '';
      if (smsDelivered) {
        displayMessage = `Verification code sent to ${maskedPhone}${smsProvider ? ` via ${smsProvider}` : ''}`;
      } else if (smsError) {
        displayMessage = `${smsError}. 2FA verification code sent to your email: ${maskedEmail}`;
      } else {
        displayMessage = `Verification code sent to ${maskedEmail}`;
      }

      return res.json({
        requires2FA: true,
        twoFactorToken,
        maskedEmail,
        maskedPhone: smsDelivered ? maskedPhone : undefined,
        smsDelivered,
        smsProvider,
        smsError,
        adminContact: smsDelivered ? `${maskedEmail} / ${maskedPhone}` : maskedEmail,
        message: displayMessage
      });
    }

    // ==========================================
    // CUSTOMER FLOW: Issue standard Customer JWT
    // ==========================================
    user.lastLogin = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    const token = generateToken(user.id, 'customer');

    res.json({
      requires2FA: false,
      user: sanitizeUser(user),
      token,
      message: `Welcome back, ${user.name}!`
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

// @desc    Send OTP to user's mobile phone via real SMS service
// @route   POST /api/auth/phone/send-otp
// @access  Public
export const sendPhoneOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid mobile phone number is required.'
      });
    }

    const digits = normalizePhone(phone);
    if (digits.length < 8 || digits.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }

    // Rate Limiting: 60 seconds cooldown between OTP requests for this phone number
    const existing = phoneOtpStore.get(digits);
    const now = Date.now();
    if (existing && now - existing.lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new verification code.`
      });
    }

    // Verify SMS Provider Configuration
    if (!smsService.isConfigured()) {
      return res.status(400).json({
        success: false,
        smsConfigured: false,
        message: 'Phone SMS service is not configured. Please sign in with Email & Password or Google One-Tap, or configure your Twilio Phone Number / SMS Gateway in Settings.'
      });
    }

    // Generate secure random 6-digit OTP
    const otp = generateOTP();
    const hashedOtp = hashOtp(otp, digits);

    // Save in secure store (5-minute expiration, max 5 attempts)
    phoneOtpStore.set(digits, {
      phone: digits,
      hash: hashedOtp,
      expiresAt: now + 5 * 60 * 1000,
      attempts: 0,
      lastSentAt: now
    });

    // Send real SMS
    const smsResult = await smsService.sendOtpSms(phone, otp, 5);
    if (!smsResult.success) {
      phoneOtpStore.delete(digits);
      return res.status(400).json({
        success: false,
        smsConfigured: false,
        message: `${smsResult.error || 'Failed to dispatch SMS verification code.'} Please sign in using Email & Password or Google One-Tap.`
      });
    }

    const maskedPhone = maskPhoneNumber(phone);
    return res.json({
      success: true,
      smsConfigured: true,
      maskedPhone,
      message: `Verification code sent to ${maskedPhone}`,
      expiresIn: 300,
      cooldown: 60
    });
  } catch (error: any) {
    console.error('Send Phone OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending OTP.', error: error.message });
  }
};

// @desc    Verify Mobile Phone OTP and Authenticate User
// @route   POST /api/auth/phone/verify-otp
// @access  Public
export const verifyPhoneOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and 6-digit verification code are required.'
      });
    }

    const digits = normalizePhone(phone);
    const record = phoneOtpStore.get(digits);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found for this number. Please request a new code.'
      });
    }

    // Check expiration (5 minutes)
    if (Date.now() > record.expiresAt) {
      phoneOtpStore.delete(digits);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check maximum failed attempts (5 max)
    if (record.attempts >= 5) {
      phoneOtpStore.delete(digits);
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.'
      });
    }

    // Secure hashed comparison
    const inputOtp = otp.toString().trim();
    const inputHash = hashOtp(inputOtp, digits);

    if (inputHash !== record.hash) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      if (remaining <= 0) {
        phoneOtpStore.delete(digits);
        return res.status(400).json({
          success: false,
          message: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. (${remaining} attempt(s) remaining)`
      });
    }

    // SUCCESS: Prevent reuse by deleting OTP record immediately
    phoneOtpStore.delete(digits);

    // Find existing user by phone or create new verified customer account
    let user = db.users.find((u) => {
      if (!u.phone) return false;
      const uDigits = normalizePhone(u.phone);
      return uDigits === digits || (digits.length === 10 && uDigits.endsWith(digits));
    });

    const now = new Date().toISOString();

    if (!user) {
      // Create new customer account with phone
      const generatedEmail = `phone_${digits.slice(-6)}_${Date.now()}@shopsphere.local`;
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: name ? name.trim() : `User ${digits.slice(-4)}`,
        email: generatedEmail,
        phone: phone.trim(),
        role: 'customer',
        authProvider: 'local',
        emailVerified: false,
        isActive: true,
        lastLogin: now,
        createdAt: now,
        updatedAt: now
      };
      db.users.push(newUser);
      user = newUser;
    } else {
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact customer support.'
        });
      }
      user.lastLogin = now;
      user.updatedAt = now;
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: `Phone verified successfully! Welcome back, ${user.name}.`
    });
  } catch (error: any) {
    console.error('Verify Phone OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during phone verification.', error: error.message });
  }
};

// @desc    Verify Two-Factor Authentication (Admin 2FA)
// @route   POST /api/auth/verify-2fa
// @access  Public (Requires temp twoFactorToken)
export const verifyTwoFactor = async (req: Request, res: Response) => {
  try {
    const { twoFactorToken, otp } = req.body;

    if (!twoFactorToken || !otp) {
      return res.status(400).json({
        message: 'Two-factor token and 6-digit OTP code are required.'
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(twoFactorToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: '2FA verification session has expired. Please log in again.'
      });
    }

    if (!decoded || !decoded.id || !decoded.is2FA) {
      return res.status(401).json({ message: 'Invalid 2FA session token.' });
    }

    const user = db.users.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Strict backend check: only admin can use 2FA verification endpoint
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized role.' });
    }

    // Check if 2FA code is present and unexpired
    if (!user.twoFactorCode || !user.twoFactorExpires) {
      return res.status(400).json({
        message: 'No active 2FA verification in progress. Please log in again.'
      });
    }

    if (new Date(user.twoFactorExpires) < new Date()) {
      user.twoFactorCode = undefined;
      user.twoFactorExpires = undefined;
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check maximum failed OTP attempts (max 5)
    if ((user.twoFactorAttempts || 0) >= 5) {
      user.twoFactorCode = undefined;
      user.twoFactorExpires = undefined;
      user.twoFactorAttempts = 0;
      return res.status(400).json({
        message: 'Too many incorrect attempts. This code has been invalidated. Please log in again.'
      });
    }

    const inputCode = otp.toString().trim();
    const hashedInput = hashOtp(inputCode, user.id);

    const isOtpValid = hashedInput === user.twoFactorCode;

    if (!isOtpValid) {
      user.twoFactorAttempts = (user.twoFactorAttempts || 0) + 1;
      const attemptsLeft = 5 - user.twoFactorAttempts;
      if (attemptsLeft <= 0) {
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        user.twoFactorAttempts = 0;
        return res.status(400).json({
          message: 'Too many incorrect attempts. This code has been invalidated. Please log in again.'
        });
      }
      return res.status(400).json({
        message: `Invalid verification code. (${attemptsLeft} attempt(s) remaining)`
      });
    }

    // ==========================================
    // SUCCESS: Invalidate 2FA code immediately and issue Admin JWT
    // ==========================================
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    user.twoFactorAttempts = 0;
    user.lastLogin = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    const token = generateToken(user.id, 'admin');

    res.json({
      token,
      user: sanitizeUser(user),
      message: 'Admin Two-Factor verification successful. Welcome to Admin Console!'
    });
  } catch (error: any) {
    console.error('2FA Verification error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification.', error: error.message });
  }
};

// @desc    Resend 2FA OTP Code
// @route   POST /api/auth/resend-2fa
// @access  Public (Requires temp twoFactorToken)
export const resendTwoFactor = async (req: Request, res: Response) => {
  try {
    const { twoFactorToken } = req.body;

    if (!twoFactorToken) {
      return res.status(400).json({ message: 'Two-factor session token is required.' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(twoFactorToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: '2FA session has expired. Please log in again.'
      });
    }

    const user = db.users.find((u) => u.id === decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    const otp = generateOTP();
    const hashedOtp = hashOtp(otp, user.id);

    user.twoFactorCode = hashedOtp;
    user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    user.twoFactorAttempts = 0;
    user.updatedAt = new Date().toISOString();

    // Automatically send fresh 2FA OTP code email
    emailService.sendTwoFactorOtpEmail(user, otp, 5).catch((err) => {
      console.warn('[AuthController] Resend 2FA email error:', err);
    });

    // Send SMS if phone number and SMS provider are configured with strict delivery check
    let smsDelivered = false;
    let smsProvider: string | undefined;
    let smsError: string | undefined;

    if (user.phone) {
      if (smsService.isConfigured()) {
        const smsRes = await smsService.sendOtpSms(user.phone, otp, 5);
        if (smsRes.success) {
          smsDelivered = true;
          smsProvider = smsRes.provider;
        } else {
          smsError = smsRes.error || 'SMS provider delivery failed';
        }
      } else {
        smsError = 'SMS service is not configured';
      }
    }

    const { maskedEmail, maskedPhone } = maskContactInfo(user.email, user.phone);

    let displayMessage = '';
    if (smsDelivered) {
      displayMessage = `Verification code sent to ${maskedPhone}${smsProvider ? ` via ${smsProvider}` : ''}`;
    } else if (smsError) {
      displayMessage = `${smsError}. Verification code sent to your email: ${maskedEmail}`;
    } else {
      displayMessage = `Verification code sent to ${maskedEmail}`;
    }

    res.json({
      message: displayMessage,
      maskedEmail,
      maskedPhone: smsDelivered ? maskedPhone : undefined,
      smsDelivered,
      smsProvider,
      smsError
    });
  } catch (error: any) {
    console.error('Resend 2FA error:', error);
    res.status(500).json({ message: 'Server error resending 2FA code.', error: error.message });
  }
};

// @desc    Authenticate with Google OAuth
// @route   POST /api/auth/google
// @access  Public
export const googleAuthUser = async (req: Request, res: Response) => {
  try {
    const { email, name, picture, googleId, idToken } = req.body;

    if (!idToken) {
      return res.status(401).json({
        message: 'Missing Google ID token. Please sign in again with Google.'
      });
    }

    let verifiedPayload;
    try {
      verifiedPayload = await firebaseAdminAuth.verifyIdToken(idToken);
    } catch (verifyError) {
      console.warn('[AuthController] Failed to verify Google ID token:', verifyError);
      return res.status(401).json({
        message: 'Google authentication could not be verified. Please try again.'
      });
    }

    const verifiedEmail = verifiedPayload?.email?.toLowerCase().trim();
    const verifiedGoogleId = verifiedPayload?.uid || verifiedPayload?.sub || googleId;
    const verifiedName = verifiedPayload?.name || name || verifiedEmail?.split('@')[0] || 'User';

    if (!verifiedEmail) {
      return res.status(401).json({ message: 'Google account email is required for sign-in.' });
    }

    const cleanEmail = verifiedEmail;
    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    const now = new Date().toISOString();

    if (user) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      user.googleId = verifiedGoogleId || user.googleId;
      user.profileImage = picture || verifiedPayload?.picture || user.profileImage;
      user.emailVerified = true;
      user.updatedAt = now;

      // CRITICAL: If an existing user in the database is an Admin,
      // Google Login must still require 2FA verification before admin access!
      if (user.role === 'admin') {
        const otp = generateOTP();
        const hashedOtp = hashOtp(otp, user.id);

        user.twoFactorCode = hashedOtp;
        user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        user.twoFactorAttempts = 0;

        // Send email & SMS for Admin 2FA
        emailService.sendTwoFactorOtpEmail(user, otp, 5).catch((err) => {
          console.warn('[AuthController] Google login 2FA email error:', err);
        });

        let smsDelivered = false;
        let smsProvider: string | undefined;
        let smsError: string | undefined;

        if (user.phone) {
          if (smsService.isConfigured()) {
            const smsRes = await smsService.sendOtpSms(user.phone, otp, 5);
            if (smsRes.success) {
              smsDelivered = true;
              smsProvider = smsRes.provider;
            } else {
              smsError = smsRes.error || 'SMS provider delivery failed';
            }
          } else {
            smsError = 'SMS service is not configured';
          }
        }

        const twoFactorToken = generateTwoFactorToken(user.id);
        const { maskedEmail, maskedPhone } = maskContactInfo(user.email, user.phone);

        let displayMessage = '';
        if (smsDelivered) {
          displayMessage = `Verification code sent to ${maskedPhone}${smsProvider ? ` via ${smsProvider}` : ''}`;
        } else if (smsError) {
          displayMessage = `${smsError}. 2FA code sent to your email: ${maskedEmail}`;
        } else {
          displayMessage = `Verification code sent to ${maskedEmail}`;
        }

        return res.json({
          requires2FA: true,
          twoFactorToken,
          maskedEmail,
          maskedPhone: smsDelivered ? maskedPhone : undefined,
          smsDelivered,
          smsProvider,
          smsError,
          adminContact: smsDelivered ? `${maskedEmail} / ${maskedPhone}` : maskedEmail,
          message: displayMessage
        });
      }

      user.lastLogin = now;
      const token = generateToken(user.id, 'customer');

      return res.json({
        requires2FA: false,
        user: sanitizeUser(user),
        token,
        message: `Signed in via Google successfully as ${user.name}.`
      });
    }

    // New user registering via Google: Role is strictly forced to 'customer'
    const displayName = verifiedName.trim();
    const defaultAddr: UserAddress = {
      fullName: displayName,
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: true,
      label: 'Home'
    };

    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: displayName,
      email: cleanEmail,
      role: 'customer', // Never admin
      authProvider: 'google',
      googleId: verifiedGoogleId || `g_${Date.now()}`,
      profileImage:
        picture || verifiedPayload?.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=fff`,
      isActive: true,
      emailVerified: true,
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      lastLogin: now,
      address: defaultAddr,
      addresses: [defaultAddr],
      createdAt: now,
      updatedAt: now
    };

    db.users.push(user);

    const token = generateToken(user.id, 'customer');

    res.json({
      requires2FA: false,
      user: sanitizeUser(user),
      token,
      message: `Signed in via Google successfully as ${user.name}.`
    });
  } catch (error: any) {
    console.error('Google Auth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication.', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me or GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ message: 'User profile not found.' });
  }

  const ordersCount = db.orders.filter((o) => o.userId === user.id).length;

  res.json({
    ...sanitizeUser(user),
    ordersCount
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const { name, phone, profileImage, address, addresses } = req.body;

  if (name && typeof name === 'string') user.name = name.trim();
  if (phone !== undefined) user.phone = phone;
  if (profileImage) user.profileImage = profileImage;

  if (address) {
    user.address = {
      ...user.address,
      ...address
    };
  }

  if (addresses && Array.isArray(addresses)) {
    user.addresses = addresses;
  }

  user.updatedAt = new Date().toISOString();

  res.json({
    user: sanitizeUser(user),
    message: 'Profile updated successfully.'
  });
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  if (user.password) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Please enter your current password.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match.' });
    }
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.updatedAt = new Date().toISOString();

  // Send security alert notification to user email
  emailService.sendSecurityAlert(user, 'password_changed').catch((err) => {
    console.warn('[AuthController] Password changed email notification error:', err);
  });

  res.json({ message: 'Password updated successfully.' });
};

// @desc    Request Password Reset (Accepts email or phone number)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone } = req.body;
    const rawIdentifier = (identifier || email || phone || '').toString().trim();

    if (!rawIdentifier) {
      return res.status(400).json({
        message: 'Please provide your registered account email address or phone number.'
      });
    }

    const user = findUserByIdentifier(rawIdentifier);

    if (!user) {
      // Return 200 generic message to prevent account enumeration
      return res.json({
        message:
          'If an account exists with those credentials, password recovery instructions have been sent.'
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Send password reset security notification
    emailService.sendSecurityAlert(user, 'reset_requested', {
      resetLink: `#reset-password?token=${resetToken}`
    }).catch((err) => console.warn('[AuthController] Reset email error:', err));

    res.json({
      message: 'Password reset instructions have been generated.',
      debugResetToken: resetToken
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request.', error: error.message });
  }
};

// @desc    Reset Password with Token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date().toISOString();

    const user = db.users.find(
      (u) =>
        u.resetPasswordToken === hashedToken &&
        u.resetPasswordExpire &&
        u.resetPasswordExpire > now
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.updatedAt = now;

    // Send security alert for password reset
    emailService.sendSecurityAlert(user, 'password_changed').catch((err) => {
      console.warn('[AuthController] Password reset confirmation email error:', err);
    });

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password.', error: error.message });
  }
};

// @desc    Logout (Client notification / audit)
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully.' });
};

// @desc    Verify administrator role
// @route   GET /api/auth/verify-admin
// @access  Private (Admin only)
export const verifyAdmin = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ verified: false, message: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      verified: false,
      role: req.user.role,
      message: 'Access denied: User does not possess administrator clearance.'
    });
  }

  res.json({
    verified: true,
    role: req.user.role,
    user: sanitizeUser(req.user),
    timestamp: new Date().toISOString()
  });
};

// @desc    Delete own account (Customer)
// @route   DELETE /api/auth/account
// @access  Private
export const deleteOwnAccount = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  if (req.user.role === 'admin') {
    return res.status(400).json({ message: 'Administrator accounts cannot be deleted directly.' });
  }

  const index = db.users.findIndex((u) => u.id === req.user!.id);
  if (index === -1) {
    return res.status(404).json({ message: 'User not found.' });
  }

  db.users.splice(index, 1);
  res.json({ message: 'Your account has been deleted successfully.' });
};

// @desc    Get SMS Gateway status (without exposing secrets)
// @route   GET /api/auth/sms-status
// @access  Public
export const getSmsStatus = (req: Request, res: Response) => {
  const provider = smsService.getActiveProvider();
  res.json({
    configured: provider.configured,
    provider: provider.name,
    details: provider.details
  });
};

