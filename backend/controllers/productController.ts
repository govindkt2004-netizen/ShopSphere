import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Product, Review } from '../types/index.js';
import { broadcastStockUpdate, broadcastProductUpdate } from '../services/websocketService.js';

// @desc    Get all products with filtering, search, sorting & pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      sort,
      featured,
      inStock,
      page = 1,
      limit = 12
    } = req.query;

    let filtered = [...db.products];

    // Search filter
    if (q && typeof q === 'string') {
      const searchTerm = q.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.category.toLowerCase().includes(searchTerm) ||
          p.brand.toLowerCase().includes(searchTerm) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchTerm)))
      );
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'all' && category !== '') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    // Brand filter
    if (brand && typeof brand === 'string' && brand !== 'all' && brand !== '') {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // Min Price
    if (minPrice !== undefined && minPrice !== '') {
      const min = Number(minPrice);
      if (!isNaN(min)) filtered = filtered.filter((p) => p.price >= min);
    }

    // Max Price
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = Number(maxPrice);
      if (!isNaN(max)) filtered = filtered.filter((p) => p.price <= max);
    }

    // Min Rating
    if (minRating !== undefined && minRating !== '') {
      const rating = Number(minRating);
      if (!isNaN(rating)) filtered = filtered.filter((p) => p.rating >= rating);
    }

    // In Stock filter
    if (inStock === 'true' || inStock === '1') {
      filtered = filtered.filter((p) => p.stock > 0);
    }

    // Featured
    if (featured === 'true' || featured === '1') {
      filtered = filtered.filter((p) => p.featured === true);
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'bestseller':
        filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    const total = filtered.length;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 12);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limitNum);

    // Collect available categories & brands for dynamic faceted filter counts
    const availableCategories = Array.from(new Set(db.products.map((p) => p.category)));
    const availableBrands = Array.from(new Set(db.products.map((p) => p.brand)));

    res.json({
      products: paginatedProducts,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      availableCategories,
      availableBrands
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = db.products.find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch 4 related products in same category
    const relatedProducts = db.products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    res.json({
      product,
      relatedProducts
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      brand,
      images,
      stock,
      featured,
      isBestSeller,
      tags,
      specs
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    const priceNum = Number(price);
    const origPriceNum = originalPrice ? Number(originalPrice) : undefined;
    let discount = 0;
    if (origPriceNum && origPriceNum > priceNum) {
      discount = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
    }

    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: name.trim(),
      description: description || 'No description provided.',
      price: priceNum,
      originalPrice: origPriceNum,
      discount: discount > 0 ? discount : undefined,
      category: category.trim(),
      brand: brand ? brand.trim() : 'Generic',
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
      stock: stock !== undefined ? Number(stock) : 10,
      rating: 5.0,
      numReviews: 0,
      reviews: [],
      featured: Boolean(featured),
      isBestSeller: Boolean(isBestSeller),
      tags: Array.isArray(tags) ? tags : [],
      specs: specs || {},
      createdAt: new Date().toISOString()
    };

    db.products.unshift(newProduct);

    // Update category item count
    const cat = db.categories.find((c) => c.name.toLowerCase() === category.toLowerCase());
    if (cat) {
      cat.itemCount = (cat.itemCount || 0) + 1;
    }

    // Real-time broadcast
    broadcastProductUpdate(newProduct, 'created');
    broadcastStockUpdate(newProduct.id, newProduct.stock, newProduct.name);

    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = db.products.find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      description,
      price,
      originalPrice,
      category,
      brand,
      images,
      stock,
      featured,
      isBestSeller,
      tags,
      specs
    } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (category !== undefined) product.category = category.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (images !== undefined && Array.isArray(images)) product.images = images;
    if (stock !== undefined) product.stock = Number(stock);
    if (featured !== undefined) product.featured = Boolean(featured);
    if (isBestSeller !== undefined) product.isBestSeller = Boolean(isBestSeller);
    if (tags !== undefined) product.tags = tags;
    if (specs !== undefined) product.specs = specs;

    if (product.originalPrice && product.originalPrice > product.price) {
      product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    } else {
      product.discount = 0;
    }

    // Real-time broadcast
    broadcastProductUpdate(product, 'updated');
    if (stock !== undefined) {
      broadcastStockUpdate(product.id, product.stock, product.name);
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const index = db.products.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [deleted] = db.products.splice(index, 1);

    // Update category item count
    const cat = db.categories.find((c) => c.name.toLowerCase() === deleted.category.toLowerCase());
    if (cat && cat.itemCount && cat.itemCount > 0) {
      cat.itemCount -= 1;
    }

    // Real-time broadcast
    broadcastProductUpdate(deleted, 'deleted');

    res.json({ message: 'Product removed successfully', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// @desc    Create or update review for product
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const product = db.products.find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Please provide rating and review comment' });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be a valid number between 1 and 5' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!product.reviews) {
      product.reviews = [];
    }

    // Check if user already reviewed - if yes, update it
    const existingIndex = product.reviews.findIndex((r) => r.userId === req.user!.id);
    let review: Review;
    let isUpdated = false;

    if (existingIndex !== -1) {
      isUpdated = true;
      review = {
        ...product.reviews[existingIndex],
        rating: ratingNum,
        comment: comment.trim(),
        userName: req.user.name || product.reviews[existingIndex].userName,
        createdAt: new Date().toISOString()
      };
      product.reviews[existingIndex] = review;
    } else {
      review = {
        id: `rev_${Date.now()}`,
        userId: req.user.id,
        userName: req.user.name || 'Verified Shopper',
        rating: ratingNum,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };
      product.reviews.unshift(review);
    }

    product.numReviews = product.reviews.length;
    product.rating = Number(
      (product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length).toFixed(1)
    );

    res.status(isUpdated ? 200 : 201).json({
      message: isUpdated ? 'Your review was updated successfully' : 'Review published successfully',
      review,
      product
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error submitting review', error: error.message });
  }
};

// @desc    Delete a review for product
// @route   DELETE /api/products/:id/reviews
// @access  Private
export const deleteProductReview = async (req: AuthRequest, res: Response) => {
  try {
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!product.reviews || product.reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found on this product' });
    }

    const reviewIndex = product.reviews.findIndex(
      (r) => r.userId === req.user!.id || req.user!.role === 'admin'
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    product.reviews.splice(reviewIndex, 1);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.length > 0
      ? Number(
          (product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length).toFixed(1)
        )
      : 0;

    res.json({
      message: 'Review removed successfully',
      product
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
