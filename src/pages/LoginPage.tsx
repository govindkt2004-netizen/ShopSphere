import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Shield,
  Sparkles,
  KeyRound,
  RotateCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useToast } from '../context/ToastContext';

interface LoginPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const {
    login,
    sendPhoneOtp,
    verifyPhoneOtp,
    verifyTwoFactor,
    resendTwoFactor,
    isLoading
  } = useAuth();
  const { success, error, info } = useToast();

  // Auth Mode: 'password' | 'phone-otp'
  const [authMode, setAuthMode] = useState<'password' | 'phone-otp'>('password');

  // Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone OTP Login State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [smsServiceError, setSmsServiceError] = useState<string | null>(null);

  // Verification Screen State (shared for Phone OTP & Admin 2FA)
  const [verificationType, setVerificationType] = useState<'phone-otp' | 'admin-2fa' | null>(null);
  const [twoFactorToken, setTwoFactorToken] = useState<string>('');
  const [activeMaskedPhone, setActiveMaskedPhone] = useState<string>('');
  const [activeMaskedEmail, setActiveMaskedEmail] = useState<string>('');
  const [activeSmsProvider, setActiveSmsProvider] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 mins (300s)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 5-minute Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (verificationType && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [verificationType, timerSeconds]);

  // 60-second Resend Cooldown Timer
  useEffect(() => {
    let interval: any = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Detect if identifier is email or phone
  const isEmail = identifier.includes('@');
  const isPhone = !isEmail && /[0-9+]/.test(identifier);

  // =========================================================================
  // Standard Password / Identifier Login
  // =========================================================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setSmsServiceError(null);
    const res = await login(identifier.trim(), password);

    if (res.requires2FA && res.twoFactorToken) {
      setVerificationType('admin-2fa');
      setTwoFactorToken(res.twoFactorToken);
      setActiveMaskedPhone(res.maskedPhone || '');
      setActiveMaskedEmail(res.maskedEmail || '');
      setActiveSmsProvider(res.smsProvider || '');
      if (res.smsError) {
        setSmsServiceError(res.smsError);
      }
      setTimerSeconds(300);
      setResendCooldown(60);
      setAttemptCount(0);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } else if (res.success && !res.requires2FA) {
      onNavigate('home');
    }
  };

  // =========================================================================
  // Phone OTP Request
  // =========================================================================
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      error('Please enter a valid mobile phone number.', 'Invalid Number');
      return;
    }

    setSmsServiceError(null);
    setIsSendingPhoneOtp(true);

    try {
      const res = await sendPhoneOtp(phoneNumber.trim());
      if (res.success) {
        setVerificationType('phone-otp');
        setActiveMaskedPhone(res.maskedPhone || `+91******${cleanDigits.slice(-4)}`);
        setActiveSmsProvider(res.smsConfigured ? '2Factor.in' : '');
        setTimerSeconds(300); // 5 minutes
        setResendCooldown(60); // 60 seconds
        setAttemptCount(0);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('not configured')) {
        setSmsServiceError('SMS service is not configured');
      } else {
        setSmsServiceError(errMsg || 'Unable to send SMS verification code.');
      }
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // =========================================================================
  // OTP Digit Handlers
  // =========================================================================
  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto move to next input
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  // =========================================================================
  // OTP Verification Submit
  // =========================================================================
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      error('Please enter the full 6-digit verification code.', 'Incomplete Code');
      return;
    }

    if (timerSeconds <= 0) {
      error('Verification code has expired. Please request a new code.', 'Code Expired');
      return;
    }

    if (attemptCount >= 5) {
      error('Maximum verification attempts reached. Please request a new code.', 'Attempts Exceeded');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      if (verificationType === 'phone-otp') {
        const ok = await verifyPhoneOtp(phoneNumber.trim(), fullOtp);
        if (ok) {
          onNavigate('home');
        } else {
          setAttemptCount((prev) => prev + 1);
        }
      } else if (verificationType === 'admin-2fa') {
        const ok = await verifyTwoFactor(twoFactorToken, fullOtp);
        if (ok) {
          onNavigate('admin-dashboard');
        } else {
          setAttemptCount((prev) => prev + 1);
        }
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // =========================================================================
  // Resend OTP (60s Countdown)
  // =========================================================================
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResendingOtp) return;
    setIsResendingOtp(true);

    try {
      if (verificationType === 'phone-otp') {
        const res = await sendPhoneOtp(phoneNumber.trim());
        if (res.success) {
          setTimerSeconds(300);
          setResendCooldown(60);
          setAttemptCount(0);
          setOtpDigits(['', '', '', '', '', '']);
          otpInputRefs.current[0]?.focus();
        }
      } else if (verificationType === 'admin-2fa') {
        const res = await resendTwoFactor(twoFactorToken);
        if (res) {
          setTimerSeconds(300);
          setResendCooldown(60);
          setAttemptCount(0);
          setOtpDigits(['', '', '', '', '', '']);
          otpInputRefs.current[0]?.focus();
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Phone SMS service is not configured')) {
        setSmsServiceError('Phone SMS service is not configured');
      }
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="py-10 max-w-md mx-auto space-y-6">
      {!verificationType ? (
        <>
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/30">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Sign In to ShopSphere
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in with your <strong>Email & Password</strong> or <strong>Mobile Phone OTP</strong>.
            </p>
          </div>

          {/* Main Login Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
            {/* Google Authentication Button */}
            <div>
              <GoogleSignInButton
                onSuccess={(res) => {
                  if (res?.requires2FA && res.twoFactorToken) {
                    setVerificationType('admin-2fa');
                    setTwoFactorToken(res.twoFactorToken);
                    setActiveMaskedPhone(res.maskedPhone || '');
                    setActiveMaskedEmail(res.maskedEmail || '');
                    setTimerSeconds(300);
                    setResendCooldown(60);
                  } else {
                    onNavigate('home');
                  }
                }}
                label="Continue with Google"
              />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                or sign in with
              </span>
            </div>

            {/* Auth Method Tabs: Password vs Phone OTP */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setSmsServiceError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'password'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('phone-otp');
                  setSmsServiceError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'phone-otp'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone SMS OTP</span>
              </button>
            </div>

            {/* SMS Service Error Warning (if not configured or delivery error) */}
            {smsServiceError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">{smsServiceError}</p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    To enable live mobile SMS OTP delivery, configure Twilio or Fast2SMS API credentials in the backend environment.
                  </p>
                </div>
              </div>
            )}

            {authMode === 'password' ? (
              /* Email / Phone + Password Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Email Address or Phone Number
                    </label>
                    {identifier && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                        {isEmail ? 'Email format' : isPhone ? 'Phone format' : 'Identifier'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-identifier-input"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@example.com or 9820192834"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    {isPhone ? (
                      <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Remember my session</span>
                  </label>
                </div>

                <button
                  id="login-submit-button"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Phone Number OTP Login Form */
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phone-otp-input"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98201 92834"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    />
                    <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    We will dispatch a secure 6-digit one-time passcode to your mobile phone via SMS.
                  </p>
                </div>

                {smsServiceError && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{smsServiceError}</span>
                  </div>
                )}

                <button
                  id="send-otp-submit-button"
                  type="submit"
                  disabled={isSendingPhoneOtp || !phoneNumber.trim()}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSendingPhoneOtp ? 'Dispatching SMS...' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Protected by SHA-256 hashed OTP encryption and rate-limited backend security.
              </span>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Create Customer Account
              </button>
            </div>
          </div>
        </>
      ) : (
        /* =================================================================== */
        /* Clean, Production-Secure OTP Verification View (No Dev/Test OTP)   */
        /* =================================================================== */
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
              <KeyRound className="w-7 h-7 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              {verificationType === 'admin-2fa' ? 'Two-Factor Authentication' : 'Verify Mobile Phone'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter the 6-digit verification code received on your device.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
            {/* Contact destination message: “Verification code sent to +91******1234” */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Code Sent</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Verification code sent to{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {activeMaskedPhone || activeMaskedEmail || 'your registered contact'}
                </strong>
                {activeMaskedPhone && activeSmsProvider && (
                  <span className="ml-1 text-slate-500 font-normal">
                    via <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeSmsProvider}</span>
                  </span>
                )}
              </p>
            </div>

            {/* Error banner if resend fails or SMS not configured */}
            {smsServiceError && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{smsServiceError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6-Digit Box Inputs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center block">
                  Enter 6-Digit Security Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border-2 border-transparent focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
                {attemptCount > 0 && (
                  <p className="text-center text-[11px] text-rose-600 font-medium">
                    {5 - attemptCount} attempt(s) remaining
                  </p>
                )}
              </div>

              {/* Timer (5 mins expiry) & Resend (60s countdown) */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      timerSeconds > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span>
                    Expires in:{' '}
                    <strong className={timerSeconds < 60 ? 'text-rose-600 font-mono' : 'text-slate-700 dark:text-slate-200 font-mono'}>
                      {formatTimer(timerSeconds)}
                    </strong>
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResendingOtp}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${isResendingOtp ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                  </span>
                </button>
              </div>

              {/* Verify Button */}
              <button
                id="btn-verify-otp"
                type="submit"
                disabled={isVerifyingOtp || otpDigits.join('').length !== 6 || timerSeconds <= 0}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isVerifyingOtp ? 'Verifying Code...' : 'Verify Code'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setVerificationType(null);
                  setTwoFactorToken('');
                  setOtpDigits(['', '', '', '', '', '']);
                  setSmsServiceError(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
