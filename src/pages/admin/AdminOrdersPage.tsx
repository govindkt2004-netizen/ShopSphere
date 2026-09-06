import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Search,
  Truck,
  Eye,
  Trash2,
  X,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  Save,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useRealtime } from '../../context/RealtimeContext';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { formatINR } from '../../utils/currency';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Status edit state inside modal
  const [newStatus, setNewStatus] = useState<OrderStatus>('Order Placed');
  const [carrierInput, setCarrierInput] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const { success, error } = useToast();
  const { subscribeToAdminOrders, isConnected } = useRealtime();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.orders.getAll();
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time listener: prepend new orders live
  useEffect(() => {
    const unsub = subscribeToAdminOrders((newOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber)) {
          return prev;
        }
        return [newOrder, ...prev];
      });
    });

    return () => unsub();
  }, [subscribeToAdminOrders]);

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setCarrierInput(order.carrier || 'BlueDart Express');
    setTrackingNumberInput(order.trackingNumber || 'BD-IN-89241094');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setIsSavingStatus(true);
      const updated = await api.orders.updateStatus(orderId, {
        status,
        carrier: carrierInput,
        trackingNumber: trackingNumberInput
      });

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSelectedOrder(updated);
      success(`Order ${orderId} updated to "${status}".`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || 'Failed to update order status.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await api.orders.delete(orderToDelete.id);
      success(`Order ${orderToDelete.id} removed.`);
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setOrderToDelete(null);
      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || 'Failed to delete order.');
    }
  };

  const statuses: OrderStatus[] = [
    'Order Placed',
    'Confirmed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

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

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Order Fulfillment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Process customer orders, update delivery carrier steps, and print fulfillment slips
          </p>
        </div>
        <div
          id="admin-realtime-orders-badge"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 self-start sm:self-auto"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Order Stream Active</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, customer, tracking..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 border-none focus:outline-none"
          >
            <option value="all">All Order Statuses ({orders.length})</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 animate-pulse">
            Loading customer orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">No orders matching filter</h4>
            <p className="text-xs text-slate-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3.5 pl-4">Order ID</th>
                  <th className="py-3.5">Customer</th>
                  <th className="py-3.5">Date</th>
                  <th className="py-3.5">Total Paid</th>
                  <th className="py-3.5">Carrier</th>
                  <th className="py-3.5">Live Status</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 pl-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {order.id}
                    </td>

                    <td className="py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {order.shippingAddress.fullName}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {order.shippingAddress.city}, {order.shippingAddress.country}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      {formatINR(order.total)}
                    </td>

                    <td className="py-3.5 text-slate-500">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {order.carrier || 'BlueDart'}
                      </span>
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

                    <td className="py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Live Timeline Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Order Management
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Order {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Updater */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-3">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                ⚡ Update Order Logistics Status & Timeline
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status Milestone
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    {statuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Courier Carrier
                  </label>
                  <input
                    type="text"
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value)}
                    placeholder="FedEx Express"
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="TRK-US-89241094"
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateOrderStatus(selectedOrder.id, newStatus)}
                disabled={isSavingStatus}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingStatus ? 'Updating Status...' : 'Apply Status Update'}</span>
              </button>
            </div>

            {/* Destination & Payment Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer Shipping Address</span>
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedOrder.shippingAddress.fullName}
                </p>
                <p className="text-slate-600 dark:text-slate-300">{selectedOrder.shippingAddress.street}</p>
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                  {selectedOrder.shippingAddress.zipCode}
                </p>
                <p className="text-slate-600 dark:text-slate-300">{selectedOrder.shippingAddress.country}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Financial Breakdown</span>
                </span>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal:</span>
                  <span>{formatINR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping:</span>
                  <span>{formatINR(selectedOrder.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>GST (12%):</span>
                  <span>{formatINR(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Paid:</span>
                  <span className="text-indigo-600 font-mono text-sm">{formatINR(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Included Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-[11px] text-slate-400">
                          Qty: {item.quantity} × {formatINR(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!orderToDelete}
        title="Delete Order Record?"
        message={`Are you sure you want to delete order ${orderToDelete?.id}? This action is irreversible.`}
        confirmText="Yes, Delete Order"
        onConfirm={handleDeleteOrder}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
};
