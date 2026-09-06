import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { auth, googleProvider, signInWithPopup, signInWithRedirect } from '../lib/firebase';
import { Shield, Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: (res?: any) => void;
  className?: string;
  label?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  className = '',
  label = 'Continue with Google'
}) => {
  const { loginWithGoogle } = useAuth();
  const { error, info } = useToast();
  const [isPopupLoading, setIsPopupLoading] = useState(false);

  const handleFirebaseGoogleSignIn = async () => {
    if (isPopupLoading) return;

    setIsPopupLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;

      if (!fbUser.email) {
        throw new Error('Google did not return an email address.');
      }

      const idToken = await fbUser.getIdToken();

      const res = await loginWithGoogle({
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0] || 'User',
        picture:
          fbUser.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fbUser.displayName || fbUser.email
          )}&background=4285F4&color=fff`,
        googleId: fbUser.uid,
        idToken
      });

      if (res && res.success) {
        if (onSuccess) onSuccess(res);
      }
    } catch (err: any) {
      console.warn('[Firebase Auth] Google Sign-In result/error:', err);

      if (err?.code === 'auth/popup-closed-by-user') {
        info('Google Sign-In popup was closed.', 'Sign-In Cancelled');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        info('Another Google sign-in window was opened.', 'Window Active');
      } else if (err?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          info('Redirecting to Google to complete sign-in.', 'Redirecting');
        } catch (redirectErr: any) {
          error(
            'Sign-in popup was blocked by your browser. Please allow popups and try again.',
            'Popup Blocked'
          );
          console.warn('[Firebase Auth] Google redirect fallback failed:', redirectErr);
        }
      } else if (err?.code === 'auth/unauthorized-domain') {
        error(
          'Google Sign-In is not enabled for this domain. Add localhost to the Firebase Auth authorized domains list.',
          'Domain Not Allowed'
        );
      } else {
        error(err.message || 'Google sign-in could not be completed.', 'Authentication Error');
      }
    } finally {
      setIsPopupLoading(false);
    }
  };

  const isLoading = isPopupLoading;

  return (
    <div className="space-y-2">
      <button
        type="button"
        id="google-signin-button"
        onClick={handleFirebaseGoogleSignIn}
        disabled={false}
        className={`w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{isLoading ? 'Connecting to Google...' : label}</span>
      </button>

      <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-indigo-500" />
          <span>Firebase Authentication</span>
        </span>
      </div>
    </div>
  );
};
