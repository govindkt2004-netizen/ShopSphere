import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate: (view: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const {
    items,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    tax,
    discountAmount,
    total,
    freeShippingThreshold,
    freeShippingProgress,
    appliedCoupon,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  const drawerOpen = typeof isOpen === 'boolean' ? isOpen : isCartDrawerOpen;
  const handleClose = onClose || closeCartDrawer;

  if (!drawerOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      const ok = applyCoupon(couponInput.trim());
      if (ok) setCouponInput('');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCartDrawer}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Your Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)})
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Meter */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100/60 dark:border-indigo-900/30">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {subtotal >= freeShippingThreshold ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      🎉 You unlocked FREE Shipping!
                    </span>
                  ) : (
                    <span>
                      Add{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {formatINR(freeShippingThreshold - subtotal)}
                      </strong>{' '}
                      more for Free Shipping
                    </span>
                  )}
                </span>
                <span className="text-slate-500">{freeShippingProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Your cart is empty
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-6">
                    Looks like you haven&apos;t added any items to your shopping cart yet.
                  </p>
                  <button
                    onClick={() => {
                      closeCartDrawer();
                      onNavigate('products');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id || item.productId}
                    className="flex gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover bg-white dark:bg-slate-900 shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h5 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {item.name}
                          </h5>
                          <span className="text-[11px] text-slate-400">{item.category}</span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id || item.productId)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id || item.productId, item.quantity - 1)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id || item.productId, item.quantity + 1)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Checkout Section */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                {/* Coupon prompt */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.code} applied (-{formatINR(discountAmount)})</span>
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Promo code (SAVE10 / WELCOME500)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-semibold"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {/* Subtotals breakdown */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatINR(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span>-{formatINR(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Estimated Shipping</span>
                    <span>{shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : formatINR(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax (GST 12%)</span>
                    <span>{formatINR(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Estimated Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-base">{formatINR(total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      closeCartDrawer();
                      onNavigate('cart');
                    }}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-center"
                  >
                    View Cart
                  </button>
                  <button
                    id="drawer-checkout-btn"
                    onClick={() => {
                      closeCartDrawer();
                      onNavigate('checkout');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center pt-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>256-Bit SSL Encrypted & Guaranteed Safe Checkout</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
