import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Sun,
  Moon,
  Menu,
  X,
  ShoppingBag,
  ShieldCheck,
  PackageCheck,
  LogOut,
  ChevronDown,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../services/api';
import { Product } from '../types';
import { formatINR } from '../utils/currency';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenCartDrawer?: () => void;
  onOpenEmailInbox?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCartDrawer,
  onOpenEmailInbox
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount, openCartDrawer } = useCart();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { isConnected, activeShoppers } = useRealtime();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [unreadEmails, setUnreadEmails] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.categories.getAll().then((res) => {
      if (Array.isArray(res)) setCategories(res);
    }).catch(() => {});

    if (isAuthenticated) {
      api.notifications.getMyEmails().then((res) => {
        setUnreadEmails(res.unreadCount || 0);
      }).catch(() => {});
    }
  }, [isAuthenticated, currentView]);

  // Live search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      api.products.getAll({ q: searchQuery, limit: 5 }).then((res) => {
        setSuggestions(res.products || []);
        setShowSuggestions(true);
      }).catch(() => setSuggestions([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      onNavigate('products', `q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              id="navbar-brand-logo"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-serif">
                  Shop<span className="text-indigo-600 dark:text-indigo-400">Sphere</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500 dark:text-slate-400 -mt-1">
                  Premium Store
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                placeholder="Search premium electronics, apparel, shoes, decor..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 rounded-full text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-sm transition-colors"
              >
                Search
              </button>
            </form>

            {/* Live Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                id="search-autocomplete-dropdown"
                className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 py-2"
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Suggested Products
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery('');
                      onNavigate('product-detail', item.id);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.category} • <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatINR(item.price)}</span>
                      </p>
                    </div>
                  </button>
                ))}
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={handleSearchSubmit}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View all results for &quot;{searchQuery}&quot; &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Real-Time Live Presence Indicator */}
            <div
              id="live-realtime-badge"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
              title={isConnected ? 'Connected to ShopSphere Real-Time Network via WebSockets' : 'Connecting to Real-Time Network...'}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              </span>
              <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{activeShoppers}</span>
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">live shoppers</span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              id="theme-toggle-button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* Wishlist */}
            <button
              id="navbar-wishlist-button"
              onClick={() => onNavigate('wishlist')}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Email Notifications & Live Alerts Drawer Button */}
            <button
              id="navbar-email-inbox-button"
              onClick={() => onOpenEmailInbox && onOpenEmailInbox()}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative flex items-center justify-center"
              aria-label="Email Inbox & Notifications"
              title="Email Notifications (Order & Security Alerts)"
            >
              <Mail className="w-5 h-5" />
              {unreadEmails > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadEmails}
                </span>
              )}
            </button>

            {/* Shopping Cart Drawer Trigger */}
            <button
              id="navbar-cart-button"
              onClick={() => {
                if (onOpenCartDrawer) onOpenCartDrawer();
                else openCartDrawer();
              }}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative flex items-center gap-2"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Auth Dropdown */}
            <div ref={userMenuRef} className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    id="navbar-user-menu-btn"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase overflow-hidden ring-1 ring-indigo-500/30">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.name ? user.name.charAt(0) : 'U'
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-medium text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">
                        {user?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      id="navbar-user-dropdown"
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 divide-y divide-slate-100 dark:divide-slate-800"
                    >
                      <div className="px-4 py-2.5">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Administrator
                          </span>
                        )}
                      </div>

                      <div className="py-1">
                        {isAdmin && (
                          <>
                            <button
                              id="menu-admin-dashboard"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onNavigate('admin-dashboard');
                              }}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-semibold text-left transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Admin Dashboard</span>
                            </button>
                            <button
                              id="menu-admin-emails"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onNavigate('admin-emails');
                              }}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-semibold text-left transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              <span>Email Center & Logs</span>
                            </button>
                          </>
                        )}
                        <button
                          id="menu-profile-btn"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('profile');
                          }}
                          className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>My Profile</span>
                        </button>
                        <button
                          id="menu-orders-btn"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('profile', 'tab=orders');
                          }}
                          className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                        >
                          <PackageCheck className="w-4 h-4 text-slate-400" />
                          <span>My Orders & Tracking</span>
                        </button>
                        <button
                          id="menu-emails-drawer-btn"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenEmailInbox) onOpenEmailInbox();
                          }}
                          className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                        >
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>Email & Alert Inbox</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          id="menu-logout-btn"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="navbar-login-btn"
                    onClick={() => onNavigate('login')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    id="navbar-register-btn"
                    onClick={() => onNavigate('register')}
                    className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Main Navigation strip (Desktop) */}
        <nav className="hidden md:flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                currentView === 'home' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('products')}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                currentView === 'products' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => onNavigate('track-order')}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                currentView === 'track-order' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
              }`}
            >
              Track Order
            </button>
            <button
              onClick={() => onNavigate('wishlist')}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                currentView === 'wishlist' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
              }`}
            >
              Wishlist ({wishlist.length})
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Free Delivery Over ₹999
            </span>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4"
        >
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('home');
              }}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left font-medium text-slate-800 dark:text-slate-200"
            >
              Home
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('products');
              }}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left font-medium text-slate-800 dark:text-slate-200"
            >
              All Products
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('track-order');
              }}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left font-medium text-slate-800 dark:text-slate-200"
            >
              Track Order
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('wishlist');
              }}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left font-medium text-slate-800 dark:text-slate-200"
            >
              Wishlist ({wishlist.length})
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('products', `category=${encodeURIComponent(cat.name)}`);
                  }}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
