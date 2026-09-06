import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UnauthorizedPage } from './UnauthorizedPage';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  onNavigate: (view: string, param?: string) => void;
  fallback?: React.ReactNode;
}

type VerificationStatus = 'verifying' | 'authorized' | 'unauthorized';

/**
 * AdminRouteGuard: Wrapper component for Admin dashboard routes that verifies
 * the active user's credentials against the secure `/api/auth/verify-admin` server endpoint
 * before rendering any admin layout or child components.
 * This completely prevents visual flickering of protected admin screens.
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  children,
  onNavigate,
  fallback
}) => {
  const { user, token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const verifyAdminPrivileges = useCallback(async () => {
    const activeToken = token || localStorage.getItem('shopsphere_token');

    // If client is still determining auth state or no token exists
    if (!activeToken) {
      setStatus('unauthorized');
      setErrorReason('No active session token provided.');
      return;
    }

    try {
      setStatus('verifying');
      const res = await api.auth.verifyAdmin();
      if (res && res.verified && res.role === 'admin') {
        setStatus('authorized');
        setErrorReason(null);
      } else {
        setStatus('unauthorized');
        setErrorReason('Account does not possess administrator clearance.');
      }
    } catch (err: any) {
      console.warn('[AdminRouteGuard] Server rejected administrator verification:', err.message);
      setStatus('unauthorized');
      setErrorReason(err.message || 'Session verification failed.');
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthLoading) {
      verifyAdminPrivileges();
    }
  }, [isAuthLoading, user?.id, user?.role, token, verifyAdminPrivileges]);

  // While checking with backend, display a sleek non-flickering security badge loader
  if (status === 'verifying' || isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-xs">
            <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-1.5 max-w-xs">
          <h3 className="text-sm font-bold font-serif text-slate-900 dark:text-white">
            Verifying Admin Clearance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validating server cryptographic session and role authorization...
          </p>
        </div>
      </div>
    );
  }

  // If server rejected or user is not admin, show unauthorized fallback
  if (status === 'unauthorized') {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <UnauthorizedPage onNavigate={onNavigate} />;
  }

  // Once verified with server, render the protected children securely
  return <>{children}</>;
};

/**
 * withAdminAuth: Higher-Order Component (HOC) version of AdminRouteGuard.
 * Wraps any component and ensures server-side admin verification before rendering.
 *
 * Example usage:
 * const ProtectedDashboard = withAdminAuth(AdminDashboardPage);
 */
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<{ onNavigate: (view: string, param?: string) => void }>
) {
  const ComponentWithAdminAuth: React.FC<P & { onNavigate: (view: string, param?: string) => void }> = (props) => {
    return (
      <AdminRouteGuard
        onNavigate={props.onNavigate}
        fallback={FallbackComponent ? <FallbackComponent onNavigate={props.onNavigate} /> : undefined}
      >
        <WrappedComponent {...props} />
      </AdminRouteGuard>
    );
  };

  ComponentWithAdminAuth.displayName = `withAdminAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithAdminAuth;
}
