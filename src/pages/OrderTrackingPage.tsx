import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Truck,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { OrderTimeline } from '../components/OrderTimeline';
import { api } from '../services/api';
import { Order } from '../types';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../context/RealtimeContext';
import { formatINR } from '../utils/currency';

interface OrderTrackingPageProps {
  initialQuery?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialQuery = '',
  onNavigate
}) => {
  const parseQueryOrderId = useCallback(() => {
    if (!initialQuery) return '';
    const params = new URLSearchParams(initialQuery);
    return params.get('orderId') || initialQuery.replace(/^orderId=/, '') || '';
  }, [initialQuery]);

  const [orderQuery, setOrderQuery] = useState(parseQueryOrderId() || 'ORD-901234');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { error } = useToast();
  const { subscribeToOrder, isConnected } = useRealtime();

  // Subscribe to real-time status updates for the currently viewed order
  useEffect(() => {
    if (!currentOrder) return;

    const unsubId = subscribeToOrder(currentOrder.id, (payload) => {
      console.log('[OrderTracking] Real-Time update received:', payload);
      setCurrentOrder((prev) => (prev ? { ...prev, ...payload.order } : payload.order));
    });

    const unsubNum = currentOrder.orderNumber
      ? subscribeToOrder(currentOrder.orderNumber, (payload) => {
          console.log('[OrderTracking] Real-Time update received for orderNumber:', payload);
          setCurrentOrder((prev) => (prev ? { ...prev, ...payload.order } : payload.order));
        })
      : () => {};

    return () => {
      unsubId();
      unsubNum();
    };
  }, [currentOrder?.id, currentOrder?.orderNumber, subscribeToOrder]);

  const handleTrack = useCallback(async (queryToTrack?: string) => {
    const q = (queryToTrack !== undefined ? queryToTrack : orderQuery).trim();
    if (!q) {
      error('Please enter an Order ID or Tracking Number.');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await api.orders.getById(q);
      setCurrentOrder(res);
    } catch (err: unknown) {
      console.error('Error tracking order:', err);
      const e = err as { message?: string };
      error(e.message || 'No order found with that reference. Please check the ID or try a sample order below.');
      setCurrentOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderQuery, error]);

  useEffect(() => {
    const fromUrl = parseQueryOrderId();
    if (fromUrl) {
      setOrderQuery(fromUrl);
      handleTrack(fromUrl);
    } else {
      // Preload default sample order
      handleTrack('ORD-901234');
    }
  }, [parseQueryOrderId, handleTrack]);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" />
          <span>Real-Time Logistics Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-serif text-slate-900 dark:text-white">
          Track Your Shipment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your ShopSphere Order ID or Carrier Tracking Number to monitor your delivery live.
        </p>
      </div>

      {/* Search Bar & Sample Chips */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="e.g. ORD-901234, SPH-892401, or TRK-US-89241094"
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Locating Package...' : 'Track Order'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Sample Live Shipments:</span>
          </span>
          {[
            { label: 'ORD-901234 (Out for Delivery)', val: 'ORD-901234' },
            { label: 'SPH-892401 (Shipped)', val: 'SPH-892401' },
            { label: 'ORD-894120 (In Transit)', val: 'ORD-894120' },
            { label: 'TRK-US-89241094', val: 'TRK-US-89241094' }
          ].map((sample) => (
            <button
              key={sample.val}
              type="button"
              onClick={() => {
                setOrderQuery(sample.val);
                handleTrack(sample.val);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition-colors cursor-pointer border border-transparent hover:border-indigo-300 dark:hover:border-indigo-700"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      ) : currentOrder ? (
        <div className="space-y-6">
          {/* Live Status Tracking Banner */}
          <div
            id="realtime-order-tracking-banner"
            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">Live Real-Time Tracking Active</span>
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
              {isConnected ? 'WebSocket Sync Connected' : 'Reconnecting...'}
            </span>
          </div>

          {/* Timeline Visual Component */}
          <OrderTimeline
            timeline={currentOrder.timeline}
            currentStatus={currentOrder.status}
            carrier={currentOrder.carrier}
            trackingNumber={currentOrder.trackingNumber}
            estimatedDelivery={currentOrder.estimatedDelivery}
          />

          {/* Order Details & Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Destination */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Shipping Destination</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {currentOrder.shippingAddress.fullName}
                </p>
                <p>{currentOrder.shippingAddress.street}</p>
                <p>
                  {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state}{' '}
                  {currentOrder.shippingAddress.zipCode}
                </p>
                <p>{currentOrder.shippingAddress.country}</p>
                {currentOrder.shippingAddress.phone && (
                  <p className="text-slate-400 pt-1">Phone: {currentOrder.shippingAddress.phone}</p>
                )}
              </div>
            </div>

            {/* Payment & Invoice Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Payment & Invoicing</span>
              </div>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {currentOrder.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date Placed</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {new Date(currentOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {formatINR(currentOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items In this Package */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Package Contents ({currentOrder.items.length} items)</span>
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-3 first:pt-0 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 cursor-pointer"
                      onClick={() => onNavigate('product-detail', item.productId)}
                    />
                    <div>
                      <h5
                        onClick={() => onNavigate('product-detail', item.productId)}
                        className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 line-clamp-1"
                      >
                        {item.name}
                      </h5>
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
          </div>
        </div>
      ) : hasSearched ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Reference Not Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              We couldn't locate a package matching &ldquo;{orderQuery}&rdquo;. Try clicking one of the sample active orders above or check your order confirmation.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setOrderQuery('ORD-901234');
                handleTrack('ORD-901234');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Load Sample Order (ORD-901234)
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
