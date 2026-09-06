import React from 'react';
import { ShieldAlert, ArrowLeft, Store, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UnauthorizedPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The requested area requires verified <strong>Administrator</strong> privileges.
            {isAuthenticated ? (
              <>
                {' '}You are currently signed in as <strong className="text-slate-900 dark:text-white">{user?.name}</strong> (<span className="text-indigo-600 dark:text-indigo-400">{user?.role}</span>).
              </>
            ) : (
              ' You must be signed in with an administrator account to view this console.'
            )}
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Store className="w-4 h-4" />
            <span>Return to Storefront</span>
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('profile')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Go to My Account</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In with Admin Account</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
