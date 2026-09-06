import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';
import {
  auth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile
} from '../lib/firebase';

export interface LoginResult {
  success: boolean;
  requires2FA?: boolean;
  twoFactorToken?: string;
  maskedEmail?: string;
  maskedPhone?: string;
  smsDelivered?: boolean;
  smsProvider?: string;
  smsError?: string;
  adminContact?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  sendPhoneOtp: (phone: string, purpose?: string) => Promise<{
    success: boolean;
    smsConfigured?: boolean;
    maskedPhone?: string;
    message: string;
    expiresIn?: number;
    cooldown?: number;
  }>;
  verifyPhoneOtp: (phone: string, otp: string, name?: string) => Promise<boolean>;
  verifyTwoFactor: (twoFactorToken: string, otp: string) => Promise<boolean>;
  resendTwoFactor: (twoFactorToken: string) => Promise<{ maskedEmail?: string; maskedPhone?: string } | null>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    address?: any;
  }) => Promise<boolean>;
  loginWithGoogle: (payload: {
    email: string;
    name?: string;
    picture?: string;
    googleId?: string;
    idToken?: string;
  }) => Promise<LoginResult>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (data: { currentPassword?: string; newPassword: string }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shopsphere_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error, info } = useToast();

  const loadUserProfile = useCallback(async () => {
    const savedToken = localStorage.getItem('shopsphere_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await api.auth.getProfile();
      setUser(profile);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('shopsphere_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();

    // Firebase Auth session listener for seamless session persistence across reloads
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const savedToken = localStorage.getItem('shopsphere_token');
        if (!savedToken) {
          try {
            const idToken = await fbUser.getIdToken();
            const res = await api.auth.googleLogin({
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              picture: fbUser.photoURL || undefined,
              googleId: fbUser.uid,
              idToken
            });
            if (res.token && res.user) {
              localStorage.setItem('shopsphere_token', res.token);
              setToken(res.token);
              setUser(res.user);
            }
          } catch (e) {
            console.warn('[Firebase Auth] Auto session restore notice:', e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      // If identifier is an email, synchronize with Firebase Auth in parallel
      if (identifier.includes('@')) {
        signInWithEmailAndPassword(auth, identifier.trim(), password).catch((fbErr) => {
          // Non-blocking catch if Email/Password provider is pending in Firebase Console
          console.warn('[Firebase Auth] Email login note:', fbErr?.code || fbErr?.message);
        });
      }

      const res = await api.auth.login({ identifier, password });

      // Admin 2FA Requirement
      if (res.requires2FA && res.twoFactorToken) {
        info(
          res.message || 'Administrator verification code sent. Please enter the OTP to continue.',
          'Admin 2FA Security'
        );
        return {
          success: true,
          requires2FA: true,
          twoFactorToken: res.twoFactorToken,
          maskedEmail: res.maskedEmail,
          maskedPhone: res.maskedPhone,
          smsDelivered: res.smsDelivered,
          smsProvider: res.smsProvider,
          smsError: res.smsError,
          adminContact: res.adminContact,
          message: res.message
        };
      }

      // Customer Direct Session Issue
      if (res.token && res.user) {
        localStorage.setItem('shopsphere_token', res.token);
        setToken(res.token);
        setUser(res.user);
        success(`Welcome back, ${res.user.name}!`, 'Signed In');
        return {
          success: true,
          requires2FA: false
        };
      }

      return { success: false, message: 'Invalid response from authentication server.' };
    } catch (err: any) {
      error(err.message || 'Login failed. Please verify your credentials.', 'Authentication Error');
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneOtp = async (phone: string, purpose = 'login') => {
    try {
      const res = await api.auth.sendPhoneOtp({ phone, purpose });
      if (res.success) {
        success(res.message, 'OTP Dispatched');
      }
      return res;
    } catch (err: any) {
      error(err.message || 'Failed to send SMS verification code.', 'SMS Error');
      throw err;
    }
  };

  const verifyPhoneOtp = async (phone: string, otp: string, name?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.auth.verifyPhoneOtp({ phone, otp, name });
      if (res.token && res.user) {
        localStorage.setItem('shopsphere_token', res.token);
        setToken(res.token);
        setUser(res.user);
        success(res.message || `Welcome, ${res.user.name}!`, 'Verified');
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Verification failed. Please check the code.', 'Verification Error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (twoFactorToken: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.auth.verifyTwoFactor({ twoFactorToken, otp });
      if (res.token && res.user) {
        localStorage.setItem('shopsphere_token', res.token);
        setToken(res.token);
        setUser(res.user);
        success('Administrator identity verified with 2FA. Access granted!', 'Admin Authorized');
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Two-factor verification failed.', 'Verification Error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendTwoFactor = async (
    twoFactorToken: string
  ): Promise<{ maskedEmail?: string; maskedPhone?: string } | null> => {
    try {
      const res = await api.auth.resendTwoFactor({ twoFactorToken });
      info(res.message || 'A new verification code has been dispatched.', 'OTP Resent');
      return {
        maskedEmail: res.maskedEmail,
        maskedPhone: res.maskedPhone
      };
    } catch (err: any) {
      error(err.message || 'Failed to resend verification code.', 'Resend Failed');
      return null;
    }
  };


  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    address?: any;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Synchronize with Firebase Auth createUserWithEmailAndPassword
      createUserWithEmailAndPassword(auth, userData.email.trim(), userData.password)
        .then((cred) => {
          updateFirebaseProfile(cred.user, { displayName: userData.name.trim() }).catch(() => {});
        })
        .catch((fbErr) => {
          console.warn('[Firebase Auth] Register note:', fbErr?.code || fbErr?.message);
        });

      const res = await api.auth.register(userData);
      localStorage.setItem('shopsphere_token', res.token);
      setToken(res.token);
      setUser(res.user);
      success(
        `Account created successfully! Welcome to ShopSphere, ${res.user.name}.`,
        'Registration Complete'
      );
      return true;
    } catch (err: any) {
      error(err.message || 'Registration failed.', 'Registration Error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (payload: {
    email: string;
    name?: string;
    picture?: string;
    googleId?: string;
    idToken?: string;
  }): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await api.auth.googleLogin(payload);

      // If user is Admin, require 2FA
      if (res.requires2FA && res.twoFactorToken) {
        info('Administrator Google credentials verified. Please complete 2FA.', 'Admin 2FA Security');
        return {
          success: true,
          requires2FA: true,
          twoFactorToken: res.twoFactorToken,
          maskedEmail: res.maskedEmail,
          maskedPhone: res.maskedPhone,
          smsDelivered: res.smsDelivered,
          smsProvider: res.smsProvider,
          smsError: res.smsError,
          adminContact: res.adminContact,
          message: res.message
        };
      }

      if (res.token && res.user) {
        localStorage.setItem('shopsphere_token', res.token);
        setToken(res.token);
        setUser(res.user);
        success(`Signed in with Google as ${res.user.name}!`, 'Google Sign-In');
        return { success: true, requires2FA: false };
      }

      return { success: false, message: 'Google authentication failed.' };
    } catch (err: any) {
      error(err.message || 'Google authentication failed.', 'Google Sign-In Error');
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Signout warning:', err);
    }
    localStorage.removeItem('shopsphere_token');
    setToken(null);
    setUser(null);
    api.auth.logout().catch(() => {});
    success('You have been logged out securely.', 'Signed Out');
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const res = await api.auth.updateProfile(data);
      setUser((prev) => (prev ? { ...prev, ...res.user } : res.user));
      success('Profile updated successfully!', 'Profile Updated');
      return true;
    } catch (err: any) {
      error(err.message || 'Failed to update profile.', 'Update Error');
      return false;
    }
  };

  const changePassword = async (data: {
    currentPassword?: string;
    newPassword: string;
  }): Promise<boolean> => {
    try {
      const res = await api.auth.changePassword(data);
      success(res.message || 'Password changed successfully!', 'Security Updated');
      return true;
    } catch (err: any) {
      error(err.message || 'Failed to change password.', 'Password Change Error');
      return false;
    }
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        sendPhoneOtp,
        verifyPhoneOtp,
        verifyTwoFactor,
        resendTwoFactor,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        changePassword,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
