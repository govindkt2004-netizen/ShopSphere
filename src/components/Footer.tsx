import React, { useState } from 'react';
import {
  ShoppingBag,
  Send,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CreditCard
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const { success, error } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      error('Please enter a valid email address.');
      return;
    }
    success('Thank you for subscribing! You will receive exclusive VIP discounts.', 'Subscribed');
    setEmail('');
  };

  return (
    <footer
      id="main-footer"
      className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-semibold text-white">Free Express Shipping</h5>
              <p className="text-slate-400 text-[11px] mt-0.5">On all orders over ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-semibold text-white">2-Year Warranty</h5>
              <p className="text-slate-400 text-[11px] mt-0.5">100% Genuine Guaranteed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-semibold text-white">30-Day Hassle-Free Return</h5>
              <p className="text-slate-400 text-[11px] mt-0.5">Instant online refund return</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-semibold text-white">24/7 Dedicated Support</h5>
              <p className="text-slate-400 text-[11px] mt-0.5">Live human concierge assistance</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white font-serif">
                Shop<span className="text-indigo-400">Sphere</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Discover curated luxury lifestyle goods, next-gen electronics, artisanal apparel, and ergonomic everyday essentials designed for modern life.
            </p>

            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="space-y-2 max-w-sm pt-2">
              <span className="text-xs font-semibold text-white block">Subscribe for exclusive VIP promotions</span>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <span>Join</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Categories</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('products', 'category=Electronics')} className="hover:text-white transition-colors">
                  Electronics & Audio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', 'category=Fashion & Apparel')} className="hover:text-white transition-colors">
                  Fashion & Apparel
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', 'category=Footwear & Shoes')} className="hover:text-white transition-colors">
                  Footwear & Sneakers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', 'category=Watches & Accessories')} className="hover:text-white transition-colors">
                  Watches & Bags
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', 'category=Home & Living')} className="hover:text-white transition-colors">
                  Home & Living
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', 'category=Books & Stationery')} className="hover:text-white transition-colors">
                  Books & Stationery
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('track-order')} className="hover:text-white transition-colors">
                  Track Your Package
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('profile', 'tab=orders')} className="hover:text-white transition-colors">
                  Order History & Invoices
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cart')} className="hover:text-white transition-colors">
                  Shopping Cart & Discounts
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('wishlist')} className="hover:text-white transition-colors">
                  Saved Wishlist
                </button>
              </li>
              <li>
                <span className="text-slate-500">Shipping Policies</span>
              </li>
              <li>
                <span className="text-slate-500">Terms of Service</span>
              </li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Portals & Security</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('admin-dashboard')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Admin Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors">
                  Account Sign In
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-white transition-colors">
                  Create User Account
                </button>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Accepted Payments</span>
              </span>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Visa</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Mastercard</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Amex</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Apple Pay</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">PayPal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ShopSphere Inc. All rights reserved. Full-stack portfolio platform.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">RESTful Node + Express API</span>
            <span>•</span>
            <span className="text-slate-400">React + TypeScript</span>
            <span>•</span>
            <span className="text-slate-400">JWT Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
