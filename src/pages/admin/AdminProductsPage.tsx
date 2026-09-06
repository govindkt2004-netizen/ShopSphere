import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Category } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { formatINR } from '../../utils/currency';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    discount: 0,
    category: 'Electronics',
    brand: 'ShopSphere',
    stock: 20,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    featured: false,
    isBestSeller: false,
    features: ['Precision engineered', '1-year warranty included']
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.products.getAll({ limit: 100 }),
        api.categories.getAll()
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Error fetching admin products:', err);
      error('Failed to load products inventory.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 2499,
      originalPrice: 3499,
      discount: 28,
      category: categories[0]?.name || 'Electronics',
      brand: 'ShopSphere Studio',
      stock: 25,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
      featured: false,
      isBestSeller: false,
      features: ['Aircraft grade aluminum', 'Ergonomic contours']
    });
    setImageUrlInput('');
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice || p.price,
      discount: p.discount || 0,
      category: p.category,
      brand: p.brand,
      stock: p.stock,
      images: p.images,
      featured: p.featured || false,
      isBestSeller: p.isBestSeller || false,
      features: p.features || []
    });
    setImageUrlInput('');
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      error('Please provide a valid product name and positive price.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingProduct) {
        await api.products.update(editingProduct.id, formData);
        success(`Updated product "${formData.name}" successfully!`);
      } else {
        await api.products.create(formData);
        success(`Created new product "${formData.name}" successfully!`);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await api.products.delete(productToDelete.id);
      success(`Deleted product "${productToDelete.name}" from catalog.`);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || 'Failed to delete product.');
    }
  };

  const handleInlineStockUpdate = async (p: Product, newStock: number) => {
    try {
      await api.products.update(p.id, { stock: Math.max(0, newStock) });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, stock: Math.max(0, newStock) } : item))
      );
      success(`Stock for ${p.name} updated to ${newStock}`);
    } catch {
      error('Failed to update stock.');
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Product Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage catalog items, pricing, discounts, specifications, and stock quantities
          </p>
        </div>

        <button
          id="btn-admin-add-product"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, name, brand..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 border-none focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 animate-pulse">
            Loading product inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">No products found</h4>
            <p className="text-xs text-slate-500">Try changing your search query or add a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3.5 pl-4">Product</th>
                  <th className="py-3.5">Category</th>
                  <th className="py-3.5">Price</th>
                  <th className="py-3.5">Inventory Stock</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                            {p.name}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {p.brand} • SKU: {p.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(p.price)}
                      </div>
                      {p.discount && p.discount > 0 ? (
                        <span className="text-[10px] text-rose-500 font-bold">-{p.discount}% OFF</span>
                      ) : null}
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) => handleInlineStockUpdate(p, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white font-mono text-center border-transparent focus:outline-none"
                        />
                        {p.stock <= 5 && p.stock > 0 && (
                          <span className="text-[10px] text-amber-500 font-bold">Low</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3">
                      {p.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product SKU'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. AeroPulse Wireless Studio"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-none focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Original Price (₹) (Optional for discount calculation)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Inventory Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Discount Ribbon Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Detailed Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                  />
                </div>

                {/* Images Array */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Product Image URLs
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste image URL (Unsplash, CDN, etc.)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrlInput.trim()) {
                          setFormData({
                            ...formData,
                            images: [...formData.images, imageUrlInput.trim()]
                          });
                          setImageUrlInput('');
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 text-white rounded-xl font-semibold"
                    >
                      Add Image
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pt-1">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden shrink-0 border">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== idx)
                            })
                          }
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features Highlights */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Bullet Highlights & Features
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 40-Hour Battery Reserve"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (featureInput.trim()) {
                          setFormData({
                            ...formData,
                            features: [...formData.features, featureInput.trim()]
                          });
                          setFeatureInput('');
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 text-white rounded-xl font-semibold"
                    >
                      Add Feature
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.features.map((f, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              features: formData.features.filter((_, i) => i !== idx)
                            })
                          }
                          className="text-slate-400 hover:text-rose-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Badges Toggles */}
                <div className="sm:col-span-2 flex items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Featured in Store Showcase</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Best Seller Ribbon</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!productToDelete}
        title="Delete Product SKU?"
        message={`Are you sure you want to remove "${productToDelete?.name}" from your catalog? This will delete all associated reviews.`}
        confirmText="Yes, Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
