import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UnauthorizedPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-8 ring-rose-50 dark:ring-rose-950/30">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Administrator Clearance Required
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {user
              ? `You are currently logged in as "${user.name}" (${user.email}) with role clearance "${user.role}". You do not have permissions to access the Administrator portal.`
              : 'You must be authenticated with an Administrator account to view this section.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </button>

          <button
            onClick={() => {
              logout();
              onNavigate('login');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
