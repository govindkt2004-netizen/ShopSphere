import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { formatINR } from '../utils/currency';

interface CartPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    shippingFee,
    tax,
    discountAmount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    freeShippingThreshold,
    freeShippingProgress
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      const ok = applyCoupon(couponCode.trim());
      if (ok) setCouponCode('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Your Shopping Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Looks like you haven&apos;t added any items to your shopping cart yet. Explore our curated collections to find something exceptional.
          </p>
        </div>
        <button
          onClick={() => onNavigate('products')}
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review your {items.length} selected items before moving to secure checkout
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-1.5 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Shopping Cart</span>
        </button>
      </div>

      {/* Free Shipping Meter */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {subtotal >= freeShippingThreshold ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  🎉 Congratulations! You have unlocked Free Shipping!
                </span>
              ) : (
                <span>
                  Add{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {formatINR(freeShippingThreshold - subtotal)}
                  </strong>{' '}
                  more to unlock Free Express Shipping
                </span>
              )}
            </h4>
            <div className="w-64 max-w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('products')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cart Grid: Items Table + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <div
                key={item.id || item.productId}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer"
                    onClick={() => onNavigate('product-detail', item.productId)}
                  />

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h4
                      onClick={() => onNavigate('product-detail', item.productId)}
                      className="text-sm sm:text-base font-bold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                    >
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Unit Price: {formatINR(item.price)}
                    </p>
                  </div>
                </div>

                {/* Controls & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={() => updateQuantity(item.id || item.productId, item.quantity - 1)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id || item.productId, item.quantity + 1)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id || item.productId)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
              Order Summary
            </h3>

            {/* Promo code form */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <Tag className="w-4 h-4" />
                  <span>Coupon {appliedCoupon.code} applied (-{formatINR(discountAmount)})</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Have a Promo Code?
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. SAVE10, WELCOME500"
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
              </form>
            )}

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatINR(subtotal)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <strong className="text-emerald-600 dark:text-emerald-400">FREE</strong>
                  ) : (
                    formatINR(shippingFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Tax (GST 12%)</span>
                <span>{formatINR(tax)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-3 border-t border-slate-100 dark:border-slate-800">
                <span>Total Amount</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-lg">
                  {formatINR(total)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              id="cart-proceed-checkout-btn"
              onClick={() => onNavigate('checkout')}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <span>Proceed to Secure Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="space-y-2 pt-2 text-[11px] text-slate-400 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>256-Bit SSL Bank Level Security</span>
              </div>
              <p>Guaranteed genuine products with 30-day return policy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear Shopping Cart?"
        message="Are you sure you want to remove all items from your cart? This cannot be undone."
        confirmText="Yes, Clear Cart"
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
