import React, { useState } from 'react';
import { KeyRound, Mail, Phone, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  // New password state for inline token reset
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isEmail = identifier.includes('@');
  const isPhone = !isEmail && /[0-9+]/.test(identifier);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.auth.forgotPassword(identifier.trim());
      setIsSent(true);
      if (res.debugResetToken) {
        setDebugToken(res.debugResetToken);
        setResetToken(res.debugResetToken);
      }
      success(
        'Password recovery instructions generated and dispatched.',
        'Reset Link Sent'
      );
    } catch (err: any) {
      error(err.message || 'Could not process password reset.', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword) return;

    if (newPassword !== confirmPassword) {
      error('Passwords do not match.', 'Validation Error');
      return;
    }

    if (newPassword.length < 6) {
      error('Password must be at least 6 characters.', 'Validation Error');
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.auth.resetPassword({
        token: resetToken.trim(),
        newPassword
      });
      success(res.message || 'Password reset successfully! You can now sign in.', 'Success');
      setTimeout(() => {
        onNavigate('login');
      }, 1200);
    } catch (err: any) {
      error(err.message || 'Invalid or expired reset token.', 'Reset Failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="py-12 max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-500/20">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
          Reset Password
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your registered <strong>Email Address</strong> or <strong>Phone Number</strong> to recover your account credentials.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        {!isSent ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Account Email or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or 9843890123"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                {isPhone ? (
                  <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing Request...' : 'Send Recovery Credentials'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reset Token Generated</span>
              </div>
              <p>
                A secure reset token has been initialized for <strong>{identifier}</strong> (valid for 1 hour).
              </p>
            </div>

            {/* Set New Password Form */}
            <form onSubmit={handleApplyReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Security Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  New Password (min 6 chars)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 pr-10 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{isResetting ? 'Updating Password...' : 'Save & Set New Password'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
