import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Percent,
  Star,
  Quote,
  Clock,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import { api } from '../services/api';
import { Product, Category } from '../types';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
  onQuickView?: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onQuickView }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Countdown timer for flash sale
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 20 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.products.getAll({ limit: 12 }),
          api.categories.getAll()
        ]);

        const allProds = prodRes.products || [];
        setFeaturedProducts(allProds.filter((p) => p.featured).slice(0, 4));
        setBestSellers(allProds.filter((p) => p.isBestSeller).slice(0, 4));
        setCategories(catRes || []);
      } catch (err) {
        console.error('Error loading home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white mt-4 sm:mt-6 border border-slate-800 shadow-2xl">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Next-Gen Collection 2026</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-serif leading-[1.1]">
              Elevate Your Lifestyle with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-200">
                Precision Craft.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Explore curated audio acoustics, Japanese selvedge apparel, titanium horology, and minimalist architectural living essentials with expedited worldwide delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="hero-shop-now-btn"
                onClick={() => onNavigate('products')}
                className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all hover:scale-[1.02]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop New Arrivals</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('products', 'category=Electronics')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold text-sm border border-white/20 transition-all"
              >
                Browse Electronics
              </button>
            </div>

            {/* Micro proof badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Free 2-Day Shipping</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>30-Day Money Back</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>2-Year Authentic Warranty</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Visual Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=85"
                alt="AeroPulse Studio Headphones"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      Flagship Audio
                    </span>
                    <h3 className="text-lg font-bold text-white">AeroPulse Studio Wireless</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 line-through">₹18,999</span>
                    <p className="text-xl font-bold text-emerald-400">₹14,999</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('product-detail', 'prod_1')}
                  className="mt-3 w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Product Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Promotional Code Strip */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base">Special Welcome Offer</h4>
            <p className="text-xs text-indigo-100">
              Apply code <strong className="bg-white/20 px-2 py-0.5 rounded font-mono font-bold">SAVE10</strong> at checkout for 10% instant discount!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('products')}
            className="px-4 py-2 bg-white text-indigo-900 text-xs font-bold rounded-xl hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Claim Discount Now
          </button>
        </div>
      </section>

      {/* 3. Popular Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Explore Categories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Shop by Premium Category
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate('products', `category=${encodeURIComponent(cat.name)}`)}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-indigo-500/40 transition-all text-left"
            >
              <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3.5">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{cat.itemCount || 4}+ Products</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Flash Deal with Live Countdown */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold tracking-wider uppercase">
              <Clock className="w-4 h-4" />
              <span>Limited Time Flash Sale</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-bold font-serif leading-tight">
              Up to 30% Off on Titanium Wearables & Studio Audio
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Don&apos;t miss our flash discounts on top-rated flagship items. Stock is strictly limited per customer account.
            </p>

            {/* Countdown Box */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700">
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase">Hours</span>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700">
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase">Mins</span>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700">
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase">Secs</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('products', 'sort=bestseller')}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
              >
                Shop Flash Deals Now
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
              alt="Chronos Smartwatch"
              referrerPolicy="no-referrer"
              className="w-72 sm:w-80 rounded-2xl shadow-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. Featured Products */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Curated Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Featured Products
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products', 'featured=true')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All Featured</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigateDetail={(id) => onNavigate('product-detail', id)}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. Best Selling Products */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Best Selling Essentials
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products', 'sort=bestseller')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Browse Best Sellers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigateDetail={(id) => onNavigate('product-detail', id)}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. Customer Testimonials */}
      <section className="bg-slate-100 dark:bg-slate-900/60 rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-slate-800 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Verified Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Loved by 50,000+ Modern Shoppers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &quot;The AeroPulse headphones exceeded my audiophile expectations. The soundstage is vast and the delivery to Seattle arrived in less than 48 hours.&quot;
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                JD
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Johnathan Davis</h5>
                <span className="text-[10px] text-slate-400">Verified Buyer • California</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &quot;The customer service and order tracking live timeline made the entire checkout experience effortless. The Italian leather duffle is heirloom quality.&quot;
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                SC
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Sophia Chen</h5>
                <span className="text-[10px] text-slate-400">Verified Buyer • New York</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &quot;Cleanest checkout process I&apos;ve experienced. The Chronos smartwatch battery reserve lasts a full 14 days without charge. 10/10 recommend.&quot;
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                MK
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Marcus King</h5>
                <span className="text-[10px] text-slate-400">Verified Buyer • London</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onNavigateDetail={(id) => onNavigate('product-detail', id)}
      />
    </div>
  );
};
