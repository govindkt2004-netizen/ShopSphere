import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingCart,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Check
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductReviews } from '../components/ProductReviews';
import { api } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../context/RealtimeContext';
import { formatINR } from '../utils/currency';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (view: string, param?: string) => void;
  onQuickView?: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
  onQuickView
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const { addToCart, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { error, info } = useToast();
  const { subscribeToStock, isConnected } = useRealtime();

  // Real-time stock subscription
  useEffect(() => {
    if (!productId) return;
    const unsub = subscribeToStock(productId, (newStock) => {
      setProduct((prev) => (prev ? { ...prev, stock: newStock } : null));
    });
    return () => unsub();
  }, [productId, subscribeToStock]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const data = await api.products.getById(productId);
        const prod = data.product;
        setProduct(prod);
        setSelectedImageIdx(0);
        setQuantity(1);

        if (data.relatedProducts && data.relatedProducts.length > 0) {
          setRelatedProducts(data.relatedProducts.filter((p) => p.id !== prod.id));
        } else if (prod.category) {
          const res = await api.products.getAll({ category: prod.category, limit: 4 });
          setRelatedProducts(res.products.filter((p) => p.id !== prod.id));
        }
      } catch (err) {
        console.error('Error loading product details:', err);
        error('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProductData();
  }, [productId, error]);

  if (loading) {
    return (
      <div className="py-12 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Product Not Found</h3>
        <p className="text-xs text-slate-500">The product you are looking for might have been retired.</p>
        <button
          onClick={() => onNavigate('products')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const cartItem = items.find((i) => i.productId === product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      info('Product link copied to clipboard!');
    }
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setProduct(updatedProduct);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate('products', `category=${encodeURIComponent(product.category)}`)}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-lg">
            <img
              src={product.images[selectedImageIdx] || product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />

            {product.discount && product.discount > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-md">
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-100 dark:bg-slate-800 ${
                    selectedImageIdx === idx
                      ? 'border-indigo-600 scale-95 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Buying Box */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {product.brand} • {product.category}
              </span>
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white mt-1 leading-tight">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">
                ({product.numReviews} verified customer reviews)
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatINR(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-slate-400 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Inclusive of all GST taxes
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {product.description}
          </p>

          {/* Stock Status Indicator */}
          <div className="text-xs">
            {product.stock > 10 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>In Stock — Ready to ship today</span>
              </span>
            ) : product.stock > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Low Stock — Only {product.stock} units remaining in warehouse</span>
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Currently Out of Stock
              </span>
            )}
          </div>

          {/* Buying Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={isOutOfStock}
                  className="px-3.5 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={isOutOfStock || quantity >= product.stock}
                  className="px-3.5 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                id="product-add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {cartItem
                    ? `Added (${cartItem.quantity}) • Add ${quantity} More`
                    : `Add ${quantity} to Shopping Cart`}
                </span>
              </button>

              {/* Wishlist toggle */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isWishlisted
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Delivery & Trust Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <Truck className="w-4 h-4 text-indigo-600 mb-1" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Express Delivery</span>
              <span>2-4 Business Days</span>
            </div>

            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <RotateCcw className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">30-Day Returns</span>
              <span>No Questions Asked</span>
            </div>

            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <ShieldCheck className="w-4 h-4 text-amber-600 mb-1" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">2-Yr Warranty</span>
              <span>Authentic Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Features Tab */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
          Product Specifications & Features
        </h3>

        {/* Features list */}
        {product.features && product.features.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Key Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications table */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Technical Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
              {Object.entries(product.specs).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60"
                >
                  <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Reviews & Feedback Component */}
      <ProductReviews
        product={product}
        onProductUpdate={handleProductUpdate}
        onNavigate={onNavigate}
      />

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            You Might Also Like
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigateDetail={(id) => onNavigate('product-detail', id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
