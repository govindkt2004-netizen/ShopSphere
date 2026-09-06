import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import { formatINR } from '../../utils/currency';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: 'products' | 'orders' | 'users' | 'categories') => void;
  onNavigateOrder?: (orderId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { subscribeToAdminOrders, isConnected, activeShoppers } = useRealtime();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.stats.getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Real-time live analytics update when orders are placed
  useEffect(() => {
    const unsub = subscribeToAdminOrders((newOrder) => {
      setStats((prev) => {
        if (!prev) return prev;
        const exists = prev.recentOrders.some((o) => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber);
        if (exists) return prev;

        return {
          ...prev,
          totalOrders: prev.totalOrders + 1,
          totalRevenue: prev.totalRevenue + newOrder.totalAmount,
          recentOrders: [newOrder, ...prev.recentOrders.slice(0, 4)]
        };
      });
    });

    return () => unsub();
  }, [subscribeToAdminOrders]);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  // Calculate highest revenue month for chart normalization
  const maxRevenue = Math.max(...stats.monthlySales.map((s) => s.revenue), 1);

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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Admin Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time telemetry across revenue, active orders, customers, and product inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            id="admin-dashboard-realtime-badge"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sync • {activeShoppers} Shoppers Online</span>
          </div>

          <button
            onClick={() => onNavigateTab('products')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Gross Revenue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {formatINR(stats.totalRevenue)}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs previous cycle</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Completed Orders
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.totalOrders}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              <span>{stats.orderStatusDistribution['Processing'] || 0} active processing</span>
            </div>
          </div>
        </div>

        {/* Total Registered Users */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Customer Accounts
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.totalUsers}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
              <span>Verified customer base</span>
            </div>
          </div>
        </div>

        {/* Total Products in Catalog */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Catalog SKUs
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.totalProducts}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              <span>{stats.lowStockProducts.length} low stock alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Order Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                Monthly Revenue Performance
              </h3>
              <p className="text-xs text-slate-500">Gross transaction volume across Q1-Q2</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Avg {formatINR(stats.totalRevenue / stats.monthlySales.length)}/mo
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 dark:border-slate-800">
            {stats.monthlySales.map((month) => {
              const heightPercent = Math.round((month.revenue / maxRevenue) * 100);
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-opacity">
                    ₹{(month.revenue / 1000).toFixed(0)}k
                  </div>

                  <div
                    className="w-full max-w-[42px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all duration-300 shadow-sm"
                    style={{ height: `${Math.max(15, heightPercent)}%` }}
                  />

                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
                    {month.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
            Order Status Breakdown
          </h3>

          <div className="space-y-3">
            {Object.entries(stats.orderStatusDistribution).map(([statusName, count]) => {
              const numericCount = Number(count) || 0;
              return (
                <div key={statusName} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{statusName}</span>
                    <span className="text-slate-900 dark:text-white font-mono">{numericCount} orders</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (numericCount / (stats.totalOrders || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Low Stock Warning Alert box */}
          {stats.lowStockProducts.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Inventory ({stats.lowStockProducts.length} Items)</span>
              </div>
              <div className="space-y-1 text-xs max-h-28 overflow-y-auto">
                {stats.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-1">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {p.name}
                    </span>
                    <span className="text-rose-500 font-bold font-mono">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
              Recent Customer Orders
            </h3>
            <p className="text-xs text-slate-500">Latest incoming transactions from storefront</p>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Total Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 pl-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {order.id}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-900 dark:text-white">
                    {order.shippingAddress.fullName}
                  </td>
                  <td className="py-3.5 text-slate-500">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white font-mono">
                    {formatINR(order.total)}
                  </td>
                  <td className="py-3.5 text-slate-500">
                    {order.paymentMethod}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
