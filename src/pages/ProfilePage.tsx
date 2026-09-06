import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  Lock,
  LogOut,
  Save,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  XCircle,
  Shield,
  Phone,
  Building,
  Home,
  Briefcase,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order, UserAddress } from '../types';
import { formatINR } from '../utils/currency';

interface ProfilePageProps {
  initialQuery?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenEmailInbox?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  initialQuery = '',
  onNavigate,
  onOpenEmailInbox
}) => {
  const { user, isAuthenticated, logout, updateProfile, changePassword, isAdmin } = useAuth();
  const { success, error } = useToast();

  const parseTab = () => {
    const params = new URLSearchParams(initialQuery);
    const t = params.get('tab');
    if (t === 'orders') return 'orders';
    if (t === 'addresses') return 'addresses';
    if (t === 'security') return 'security';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders' | 'security'>(parseTab());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || ''
  });

  // Addresses State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<UserAddress>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false,
    label: 'Home'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        profileImage: user.profileImage || ''
      });

      const userAddrs: UserAddress[] = user.addresses && user.addresses.length > 0
        ? user.addresses
        : user.address ? [user.address] : [];

      setAddresses(userAddrs);
    }
  }, [user]);

  const loadOrders = async () => {
    if (isAuthenticated) {
      setLoadingOrders(true);
      try {
        const data = await api.orders.getMyOrders();
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="py-20 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sign In Required</h3>
        <p className="text-xs text-slate-500">
          Please log in to your customer account to view your profile, addresses, and order history.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        profileImage: profileForm.profileImage
      });
    } catch {
      // handled in context
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city || !newAddress.zipCode) {
      error('Please complete street, city, and pin code.', 'Address Incomplete');
      return;
    }

    const addrToAdd: UserAddress = {
      ...newAddress,
      id: `addr_${Date.now()}`
    };

    let updatedList = [...addresses];
    if (addrToAdd.isDefault || updatedList.length === 0) {
      updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
      addrToAdd.isDefault = true;
    }

    updatedList.push(addrToAdd);
    setAddresses(updatedList);

    const defaultAddr = updatedList.find((a) => a.isDefault) || updatedList[0];
    await updateProfile({
      addresses: updatedList,
      address: defaultAddr
    });

    setIsAddingAddress(false);
    setNewAddress({
      fullName: user?.name || '',
      phone: user?.phone || '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: false,
      label: 'Home'
    });
  };

  const handleSetDefaultAddress = async (addrId?: string) => {
    if (!addrId) return;
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === addrId
    }));
    setAddresses(updated);
    const defaultAddr = updated.find((a) => a.id === addrId);
    await updateProfile({
      addresses: updated,
      address: defaultAddr
    });
  };

  const handleDeleteAddress = async (addrId?: string) => {
    if (!addrId) return;
    const updated = addresses.filter((a) => a.id !== addrId);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    await updateProfile({
      addresses: updated,
      address: updated[0] || undefined
    });
    success('Address removed.', 'Updated');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      error('New password must be at least 6 characters.', 'Validation Error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('New password and confirmation do not match.', 'Validation Error');
      return;
    }

    setIsSaving(true);
    const ok = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });

    if (ok) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    setIsSaving(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Items will be restocked.')) return;

    setCancellingOrderId(orderId);
    try {
      const res = await api.orders.cancel(orderId);
      success(res.message || 'Order cancelled successfully.', 'Order Cancelled');
      loadOrders();
    } catch (err: any) {
      error(err.message || 'Unable to cancel order.', 'Error');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200';
      case 'Processing':
      case 'Confirmed':
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200';
      case 'Cancelled':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-3xl object-cover border-2 border-indigo-500 shadow-lg shadow-indigo-600/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-2xl font-bold uppercase shadow-lg shadow-indigo-600/30">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                {user?.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200'
                }`}
              >
                {user?.role}
              </span>

              {user?.authProvider === 'google' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 flex items-center gap-1">
                  <span>Google Account</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400 pt-0.5">
              <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2026'}</span>
              <span>•</span>
              <span>{orders.length} orders placed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'addresses'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Shipping Addresses ({addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Password & Security</span>
        </button>

        {onOpenEmailInbox && (
          <button
            type="button"
            onClick={onOpenEmailInbox}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors ml-auto"
          >
            <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>View Email Inbox</span>
          </button>
        )}
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                Personal Information
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your name, contact phone number, and avatar image
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Display Name
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address (Account ID)
              </label>
              <input
                type="email"
                disabled
                value={user?.email}
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-slate-400 border-transparent cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+91 98000 00000"
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={profileForm.profileImage}
                onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Addresses Management */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                Saved Shipping Addresses
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add and manage delivery destinations for seamless 1-click orders
              </p>
            </div>

            {!isAddingAddress && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            )}
          </div>

          {/* Add Address Form Modal / Box */}
          {isAddingAddress && (
            <form
              onSubmit={handleAddAddress}
              className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-3xl p-6 border-2 border-dashed border-indigo-300 dark:border-indigo-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  New Shipping Destination
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Contact Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Contact Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Street Address / Apartment / Landmark</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Lotus Tower, MG Road"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">State & PIN Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-1/2 p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      required
                      placeholder="PIN"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      className="w-1/2 p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Address Label</label>
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, label: lbl })}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                          newAddress.label === lbl
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="makeDefault"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <label htmlFor="makeDefault" className="font-semibold cursor-pointer">
                    Set as default delivery address
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr, idx) => (
              <div
                key={addr.id || idx}
                className={`p-5 rounded-3xl border transition-all ${
                  addr.isDefault
                    ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {addr.label === 'Work' ? (
                      <Briefcase className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Home className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {addr.label || 'Home'}
                    </span>
                  </div>

                  {addr.isDefault ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Make Default
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">{addr.fullName}</p>
                  <p>{addr.street}</p>
                  <p>
                    {addr.city}, {addr.state} - {addr.zipCode}
                  </p>
                  <p>{addr.country}</p>
                  {addr.phone && <p className="text-slate-500 text-[11px] pt-1">Phone: {addr.phone}</p>}
                </div>

                {addresses.length > 1 && (
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Orders List with Self-Service Cancellation */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">No Orders Placed Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not placed any orders with this customer account yet.
              </p>
              <button
                onClick={() => onNavigate('products')}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const canCancel =
                order.status !== 'Shipped' &&
                order.status !== 'Out for Delivery' &&
                order.status !== 'Delivered' &&
                order.status !== 'Cancelled';

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
                >
                  {/* Order Top Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400">Order ID:</span>{' '}
                      <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                        {order.orderNumber || order.id}
                      </strong>
                      <span className="text-slate-400 ml-3">Placed:</span>{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>

                      <button
                        onClick={() => onNavigate('track-order', `orderId=${order.orderNumber || order.id}`)}
                        className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>

                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrderId === order.id}
                          className="px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {item.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Qty: {item.quantity} × {formatINR(item.price)}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Total */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="text-slate-500">
                      Payment: <strong className="text-slate-800 dark:text-slate-200">{order.paymentMethod}</strong> ({order.paymentStatus})
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Total:</span>
                      <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                        {formatINR(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-xl">
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your account password. Must be at least 6 characters long.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {user?.authProvider !== 'google' && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
            >
              {isSaving ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>

          {/* Account Audit Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Authentication & Security Information</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-slate-400 block text-[11px]">Provider:</span>
                <strong className="capitalize text-slate-800 dark:text-slate-200">
                  {user?.authProvider || 'Email / Password'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Role Permission:</span>
                <strong className="capitalize text-slate-800 dark:text-slate-200">
                  {user?.role} clearance
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email Verification:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {user?.emailVerified ? 'Verified' : 'Active'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Last Session Active:</span>
                <span>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Current Session'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
