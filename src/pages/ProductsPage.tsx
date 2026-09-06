import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  List
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import { api } from '../services/api';
import { Product } from '../types';

interface ProductsPageProps {
  initialQuery?: string;
  onNavigate: (view: string, param?: string) => void;
  onQuickView?: (product: Product) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ initialQuery = '', onNavigate, onQuickView }) => {
  // Parse initial query params
  const parseParams = useCallback(() => {
    if (!initialQuery) {
      return {
        q: '',
        category: 'all',
        brand: 'all',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        sort: 'newest',
        featured: '',
        inStock: ''
      };
    }
    const cleanQuery = initialQuery.startsWith('?') ? initialQuery.slice(1) : initialQuery;
    const params = new URLSearchParams(cleanQuery);
    const catParam = params.get('category');
    const directCat = !cleanQuery.includes('=') && cleanQuery !== 'all' ? cleanQuery : 'all';

    return {
      q: params.get('q') || '',
      category: catParam || directCat,
      brand: params.get('brand') || 'all',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      minRating: params.get('minRating') || '',
      sort: params.get('sort') || 'newest',
      featured: params.get('featured') || '',
      inStock: params.get('inStock') || ''
    };
  }, [initialQuery]);

  const parsed = parseParams();

  const [search, setSearch] = useState(parsed.q);
  const [selectedCategory, setSelectedCategory] = useState(parsed.category);
  const [selectedBrand, setSelectedBrand] = useState(parsed.brand);
  const [minPrice, setMinPrice] = useState(parsed.minPrice);
  const [maxPrice, setMaxPrice] = useState(parsed.maxPrice);
  const [minRating, setMinRating] = useState(parsed.minRating);
  const [sortBy, setSortBy] = useState(parsed.sort);
  const [inStockOnly, setInStockOnly] = useState(parsed.inStock === 'true');
  const [featuredOnly, setFeaturedOnly] = useState(parsed.featured === 'true');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync if initialQuery changes from external navbar clicks
  useEffect(() => {
    const p = parseParams();
    setSearch(p.q);
    setSelectedCategory(p.category);
    setSelectedBrand(p.brand);
    setSortBy(p.sort);
    setFeaturedOnly(p.featured === 'true');
    setPage(1);
  }, [initialQuery, parseParams]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.products.getAll({
        q: search,
        category: selectedCategory,
        brand: selectedBrand,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        sort: sortBy,
        inStock: inStockOnly ? true : undefined,
        featured: featuredOnly ? true : undefined,
        page,
        limit: 12
      });

      setProducts(res.products || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.pages || 1);
      if (res.availableCategories) setAvailableCategories(res.availableCategories);
      if (res.availableBrands) setAvailableBrands(res.availableBrands);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedBrand, minPrice, maxPrice, minRating, sortBy, inStockOnly, featuredOnly, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSortBy('newest');
    setInStockOnly(false);
    setFeaturedOnly(false);
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    minPrice ||
    maxPrice ||
    minRating ||
    inStockOnly ||
    featuredOnly ||
    sortBy !== 'newest';

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              {selectedCategory !== 'all' ? selectedCategory : 'All Products Collection'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {products.length} of {totalCount} premium items
            </p>
          </div>

          {/* Search bar & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by name, tag..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl text-slate-900 dark:text-white border-transparent focus:border-indigo-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 border-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="newest">Sort: Newest Arrival</option>
              <option value="bestseller">Sort: Best Sellers</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating: High to Low</option>
            </select>

            {/* Grid / List View Toggle */}
            <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <div
          className={`lg:block ${
            isFilterDrawerOpen ? 'block fixed inset-0 z-50 bg-slate-900/50 p-4' : 'hidden'
          } lg:relative lg:p-0`}
        >
          <div
            className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 ${
              isFilterDrawerOpen ? 'max-w-sm mx-auto max-h-[90vh] overflow-y-auto mt-10' : ''
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filter Products</h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Price Range (₹)
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min (₹)"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max (₹)"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Brand
                </h4>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 border-none focus:outline-none"
                >
                  <option value="all">All Brands</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Minimum Rating Filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Minimum Rating
              </h4>
              <div className="space-y-1">
                {[
                  { label: '4.5 & up', val: '4.5' },
                  { label: '4.0 & up', val: '4.0' },
                  { label: '3.0 & up', val: '3.0' }
                ].map((r) => (
                  <button
                    key={r.val}
                    onClick={() => {
                      setMinRating((prev) => (prev === r.val ? '' : r.val));
                      setPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      minRating === r.val
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{r.label}</span>
                    </div>
                    {minRating === r.val && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock & Featured Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => {
                    setFeaturedOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Featured Items Only</span>
              </label>
            </div>

            {isFilterDrawerOpen && (
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Apply & Close
              </button>
            )}
          </div>
        </div>

        {/* Right Catalog Grid / List */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                We couldn&apos;t find any items matching your active search terms and filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigateDetail={(id) => onNavigate('product-detail', id)}
                  onQuickView={(p) => {
                    if (onQuickView) {
                      onQuickView(p);
                    } else {
                      setQuickViewProduct(p);
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                    page === i + 1
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onNavigateDetail={(id) => onNavigate('product-detail', id)}
      />
    </div>
  );
};
