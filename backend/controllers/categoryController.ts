import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Category } from '../types/index.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    // Dynamic recalculation of item counts
    const categoriesWithCounts = db.categories.map((cat) => {
      const count = db.products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
      return {
        ...cat,
        itemCount: count
      };
    });

    res.json(categoriesWithCounts);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, image, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = db.categories.find((c) => c.slug === slug || c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      slug,
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      description: description || '',
      itemCount: 0
    };

    db.categories.push(newCategory);
    res.status(201).json(newCategory);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = db.categories.find((c) => c.id === req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, image, description } = req.body;

    const oldName = category.name;
    if (name) {
      category.name = name.trim();
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Update products category name as well
      db.products.forEach((p) => {
        if (p.category.toLowerCase() === oldName.toLowerCase()) {
          p.category = category.name;
        }
      });
    }

    if (image !== undefined) category.image = image;
    if (description !== undefined) category.description = description;

    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const index = db.categories.findIndex((c) => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const [deleted] = db.categories.splice(index, 1);
    res.json({ message: 'Category deleted successfully', id: deleted.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
