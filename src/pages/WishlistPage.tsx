import React from 'react';
import { Heart, ShoppingBag, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';

interface WishlistPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { wishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveAllToCart = () => {
    wishlist.forEach((p) => {
      if (p.stock > 0) addToCart(p, 1);
    });
  };

  if (wishlist.length === 0) {
    return (
      <div className="py-20 max-w-xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
          <Heart className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Save your favorite items here to purchase later or track price reductions.
          </p>
        </div>
        <button
          onClick={() => onNavigate('products')}
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg transition-all"
        >
          Discover Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-rose-500 fill-current" />
            <span>My Saved Wishlist ({wishlist.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Personal collection of luxury goods and electronics saved to your account
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMoveAllToCart}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add All In-Stock to Cart</span>
          </button>

          <button
            onClick={clearWishlist}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 text-xs font-semibold rounded-xl transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Grid of Wishlisted Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onNavigateDetail={(id) => onNavigate('product-detail', id)}
          />
        ))}
      </div>
    </div>
  );
};
