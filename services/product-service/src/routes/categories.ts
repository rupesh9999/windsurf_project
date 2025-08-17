import express from 'express';
import Joi from 'joi';
import { Category } from '../models/Category';
import { redisClient } from '../config/redis';

const router = express.Router();

// Validation schemas
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().optional(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
  parentId: Joi.string().uuid().optional(),
  imageUrl: Joi.string().uri().optional(),
  sortOrder: Joi.number().integer().optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().optional(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
  parentId: Joi.string().uuid().optional(),
  imageUrl: Joi.string().uri().optional(),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive categories
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const cacheKey = `categories:${includeInactive}`;
    
    // Try cache first
    const cachedCategories = await redisClient.get(cacheKey);
    if (cachedCategories) {
      return res.json(JSON.parse(cachedCategories));
    }

    const whereClause = includeInactive ? {} : { isActive: true };

    const categories = await Category.findAll({
      where: whereClause,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      include: [
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false,
          order: [['sortOrder', 'ASC']],
        },
      ],
    });

    // Cache for 15 minutes
    await redisClient.setEx(cacheKey, 900, JSON.stringify(categories));

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category data
 *       404:
 *         description: Category not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const cacheKey = `category:${req.params.id}`;
    
    const cachedCategory = await redisClient.get(cacheKey);
    if (cachedCategory) {
      return res.json(JSON.parse(cachedCategory));
    }

    const category = await Category.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false,
          order: [['sortOrder', 'ASC']],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Cache for 15 minutes
    await redisClient.setEx(cacheKey, 900, JSON.stringify(category));

    res.json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               slug:
 *                 type: string
 *               parentId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const { error } = createCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Verify parent category exists if provided
    if (req.body.parentId) {
      const parentCategory = await Category.findByPk(req.body.parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const category = await Category.create(req.body);

    // Clear category caches
    await redisClient.del('categories:*');

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { error } = updateCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (req.body.parentId) {
      const parentCategory = await Category.findByPk(req.body.parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    await category.update(req.body);

    // Clear caches
    await redisClient.del(`category:${req.params.id}`);
    await redisClient.del('categories:*');

    res.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category (soft delete)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.update({ isActive: false });

    // Clear caches
    await redisClient.del(`category:${req.params.id}`);
    await redisClient.del('categories:*');

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
