import React from 'react';
import { Star, Heart, ShoppingCart, Eye, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  onNavigateDetail: (id: string) => void;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigateDetail,
  onQuickView
}) => {
  const { addToCart, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product.id);
  const cartItem = items.find((i) => i.productId === product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-400/30 transition-all duration-300"
    >
      {/* Top Image Container */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.discount && product.discount > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-sm">
              -{product.discount}%
            </span>
          ) : null}
          {product.isBestSeller && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm tracking-wide">
              BESTSELLER
            </span>
          )}
          {product.featured && !product.isBestSeller && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-sm tracking-wide">
              FEATURED
            </span>
          )}
        </div>

        {/* Action icons (Wishlist & Quick View) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`p-2 rounded-full backdrop-blur-md shadow-md transition-all ${
              isWishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-200 hover:text-rose-500'
            }`}
            aria-label="Add to wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-600 dark:text-slate-200 hover:text-indigo-600 shadow-md transition-all duration-200"
              aria-label="Quick View"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-md border border-slate-700">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="font-medium truncate">{product.brand}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 truncate">
            {product.category}
          </span>
        </div>

        <button
          onClick={() => onNavigateDetail(product.id)}
          className="text-left font-medium text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm sm:text-base leading-snug mb-2 focus:outline-none"
        >
          {product.name}
        </button>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-[11px] text-slate-400">({product.numReviews})</span>

          {isLowStock && (
            <span className="ml-auto text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Only {product.stock} left!
            </span>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {formatINR(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <button
            id={`add-cart-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) addToCart(product, 1);
            }}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              isOutOfStock
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : cartItem
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30'
            }`}
          >
            {cartItem ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">In Cart ({cartItem.quantity})</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
