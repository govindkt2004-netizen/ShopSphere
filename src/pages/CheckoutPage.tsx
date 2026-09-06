import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order } from '../types';
import { formatINR } from '../utils/currency';

interface CheckoutPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { items, subtotal, shippingFee, tax, discountAmount, total, appliedCoupon, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  // Load checkout details only if the customer has previously saved them.
  // This prevents demo/default customer data from appearing on the first checkout.
  useEffect(() => {
    try {
      const savedCheckoutDetails = localStorage.getItem('shopsphere_checkout_details');
      if (savedCheckoutDetails) {
        const saved = JSON.parse(savedCheckoutDetails);
        setFormData((prev) => ({ ...prev, ...saved }));
      }
    } catch (err) {
      console.warn('Could not load saved checkout details:', err);
    }
  }, []);

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'priority'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');
  const [cardData, setCardData] = useState({
    cardNumber: '•••• •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '888',
    cardHolder: user?.name || 'Aarav Sharma'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Adjust shipping fee based on chosen method in INR
  const methodAdditionalFee = shippingMethod === 'express' ? 149 : shippingMethod === 'priority' ? 299 : 0;
  const grandTotal = total + methodAdditionalFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.street || !formData.city || !formData.zipCode) {
      error('Please complete all required shipping fields.');
      return;
    }

    if (items.length === 0) {
      error('Your shopping cart is empty.');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        items,
        shippingAddress: {
          fullName: formData.fullName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        },
        paymentMethod: paymentMethod === 'card' ? 'Credit / Debit Card' : paymentMethod === 'upi' ? 'UPI / NetBanking' : 'Cash on Delivery',
        subtotal,
        tax,
        shippingFee: shippingFee + methodAdditionalFee,
        discount: discountAmount,
        total: grandTotal,
        couponCode: appliedCoupon?.code
      };

      const res = await api.orders.create(orderPayload);

      // Save checkout details only after a successful order so the first checkout
      // starts empty and future checkouts can be filled automatically.
      try {
        localStorage.setItem(
          'shopsphere_checkout_details',
          JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          })
        );
      } catch (err) {
        console.warn('Could not save checkout details:', err);
      }

      setCreatedOrder(res.order);
      clearCart();
      success('Order placed successfully!', 'Order Confirmed');
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderId = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.id);
      setCopiedId(true);
      info('Order ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (createdOrder) {
    return (
      <div className="py-12 max-w-3xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Thank You! Your Order is Confirmed
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              We have received your order and are preparing it for shipment. A confirmation email has been sent to{' '}
              <strong className="text-slate-900 dark:text-white">{formData.email}</strong>.
            </p>
          </div>

          {/* Order ID & Tracking badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 max-w-md mx-auto">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400">Order Reference</span>
              <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {createdOrder.id}
              </p>
            </div>
            <button
              onClick={copyOrderId}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="Copy ID"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Items Summary Table in Confirmation */}
          <div className="text-left border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ordered Items ({createdOrder.items.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {createdOrder.items.map((i, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-50 dark:border-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={i.image}
                      alt={i.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{i.name}</p>
                      <p className="text-[11px] text-slate-400">Qty: {i.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatINR(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
              <span>Total Paid</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-base">
                {formatINR(createdOrder.total)}
              </span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <button
              onClick={() => onNavigate('track-order', `orderId=${createdOrder.id}`)}
              className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track Live Package Status</span>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="py-3.5 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT FORM VIEW
  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => onNavigate('cart')} className="hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Express Checkout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete your order with 256-Bit SSL bank grade security
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          <Lock className="w-4 h-4" />
          <span>Secure Encrypted Session</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shipping & Payment Options */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Shipping Address */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                1
              </span>
              <span>Shipping Destination</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Recipient Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-none focus:outline-none"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street"
                  required
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Flat/House No., Building, Street area"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City (e.g. Mumbai)"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  State & PIN Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State (e.g. Maharashtra)"
                    className="w-1/2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="PIN Code"
                    className="w-1/2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Shipping Speed */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                2
              </span>
              <span>Delivery Speed & Courier Carrier</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  shippingMethod === 'standard'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Standard Delivery</span>
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">3 - 5 Business Days</p>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  {shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}
                </span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  shippingMethod === 'express'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">BlueDart Express</span>
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">1 - 2 Business Days</p>
                <span className="font-bold text-slate-900 dark:text-white mt-2">+₹149</span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  shippingMethod === 'priority'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Delhivery Priority</span>
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === 'priority'}
                    onChange={() => setShippingMethod('priority')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Guaranteed Tomorrow</p>
                <span className="font-bold text-slate-900 dark:text-white mt-2">+₹299</span>
              </label>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                3
              </span>
              <span>Payment Details</span>
            </h3>

            {/* Payment method selection pills */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>UPI / NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>Cash on Delivery</span>
              </button>
            </div>

            {/* Card Inputs */}
            {paymentMethod === 'card' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardData.cardHolder}
                    onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Card Number (Visa / MasterCard / RuPay)
                  </label>
                  <input
                    type="text"
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardData.cardExp}
                      onChange={(e) => setCardData({ ...cardData, cardExp: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardData.cardCvc}
                      onChange={(e) => setCardData({ ...cardData, cardCvc: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
                <p className="font-semibold">Instant UPI Payment (GPay, PhonePe, Paytm, BHIM):</p>
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g. mobile@upi or name@okhdfcbank)"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                />
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200">
                Pay in cash directly to the courier executive upon delivery at your doorstep.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Confirmation Overview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
              Order Review ({items.length} items)
            </h3>

            {/* Micro items list */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((i) => (
                <div key={i.id || i.productId} className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={i.image}
                      alt={i.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{i.name}</p>
                      <p className="text-[11px] text-slate-400">Qty {i.quantity} × {formatINR(i.price)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white shrink-0">
                    {formatINR(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations breakdown */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                <span>Shipping ({shippingMethod})</span>
                <span>
                  {shippingFee + methodAdditionalFee === 0 ? (
                    <strong className="text-emerald-600">FREE</strong>
                  ) : (
                    formatINR(shippingFee + methodAdditionalFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (GST 12%)</span>
                <span>{formatINR(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Grand Total</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-lg">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              id="place-order-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Processing Order...' : `Place Order • ${formatINR(grandTotal)}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>30-Day Money Back Guarantee • Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
