import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  UserCheck,
  Trash2,
  X,
  UserPlus,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  ShoppingBag,
  Power
} from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer' as 'customer' | 'admin',
    phone: '',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.users.getAll({
        search,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      error('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, error]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      error('Please complete all required fields (Name, Email, Password).');
      return;
    }

    try {
      setIsSaving(true);
      await api.users.create(formData);
      success(`User account "${formData.name}" created.`);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'customer', phone: '', isActive: true });
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || 'Failed to create user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRole = async (user: User) => {
    if (user.email === 'admin@shopsphere.com') {
      error('Root Administrator role cannot be changed.');
      return;
    }

    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    try {
      await api.users.update(user.id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      success(`Updated ${user.name}'s role to ${newRole}.`);
    } catch (err: any) {
      error(err.message || 'Failed to update user role.');
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.email === 'admin@shopsphere.com') {
      error('Root Administrator cannot be deactivated.');
      return;
    }

    const newActiveState = user.isActive === false ? true : false;
    try {
      await api.users.update(user.id, { isActive: newActiveState });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newActiveState } : u))
      );
      success(`${user.name}'s account ${newActiveState ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      error(err.message || 'Failed to update account status.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.users.delete(userToDelete.id);
      success(`Removed user "${userToDelete.name}".`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            User Accounts & Access Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit customer accounts, manage administrator clearance, toggle account statuses, and view order metrics
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl text-slate-900 dark:text-white border-none focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers Only</option>
            <option value="admin">Admins Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl text-slate-900 dark:text-white border-none focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 animate-pulse">
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">No user accounts found</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3.5 pl-4">User</th>
                  <th className="py-3.5">Email & Provider</th>
                  <th className="py-3.5">Assigned Role</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Orders</th>
                  <th className="py-3.5">Join Date</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          {u.profileImage ? (
                            <img
                              src={u.profileImage}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs uppercase">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                            {u.phone && <span className="text-[11px] text-slate-400">{u.phone}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-700 dark:text-slate-300 block">{u.email}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                            {u.authProvider || 'local'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                            u.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200'
                          }`}
                          title="Click to toggle between Admin and Customer clearance"
                        >
                          {u.role === 'admin' ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>{u.role}</span>
                        </button>
                      </td>

                      <td className="py-3.5">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                            isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                          }`}
                          title="Click to toggle Active / Deactivated state"
                        >
                          <Power className="w-3 h-3" />
                          <span>{isActive ? 'Active' : 'Deactivated'}</span>
                        </button>
                      </td>

                      <td className="py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-slate-400" />
                          <span>{u.ordersCount || 0}</span>
                        </span>
                      </td>

                      <td className="py-3.5 text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3.5 pr-4 text-right">
                        {u.email !== 'admin@shopsphere.com' && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete User Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Provision New User Account
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Role Clearance
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'customer' | 'admin' })}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-none focus:outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isSaving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        title="Delete User Record?"
        message={`Are you sure you want to remove user "${userToDelete?.name}" (${userToDelete?.email})? This action is irreversible.`}
        confirmText="Yes, Delete User"
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
