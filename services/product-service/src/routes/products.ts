import express from 'express';
import Joi from 'joi';
import { Op } from 'sequelize';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { redisClient } from '../config/redis';

const router = express.Router();

// Validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  categoryId: Joi.string().uuid().required(),
  sku: Joi.string().min(3).max(50).required(),
  stock: Joi.number().integer().min(0).required(),
  imageUrl: Joi.string().uri().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  weight: Joi.number().min(0).optional(),
  dimensions: Joi.object({
    length: Joi.number().min(0).required(),
    width: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  categoryId: Joi.string().uuid().optional(),
  stock: Joi.number().integer().min(0).optional(),
  imageUrl: Joi.string().uri().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  weight: Joi.number().min(0).optional(),
  dimensions: Joi.object({
    length: Joi.number().min(0).required(),
    width: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and description
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, rating, createdAt]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'DESC';

    // Build cache key
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    
    // Try to get from cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }

    // Build where clause
    const whereClause: any = { isActive: true };

    if (category) {
      whereClause.categoryId = category;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (!isNaN(minPrice)) {
      whereClause.price = { ...whereClause.price, [Op.gte]: minPrice };
    }

    if (!isNaN(maxPrice)) {
      whereClause.price = { ...whereClause.price, [Op.lte]: maxPrice };
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    const result = {
      products: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };

    // Cache the result for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product data
 *       404:
 *         description: Product not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    
    // Try cache first
    const cachedProduct = await redisClient.get(cacheKey);
    if (cachedProduct) {
      return res.json(JSON.parse(cachedProduct));
    }

    const product = await Product.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Cache for 10 minutes
    await redisClient.setEx(cacheKey, 600, JSON.stringify(product));

    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
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
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               sku:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const { error } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Verify category exists
    const category = await Category.findByPk(req.body.categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const product = await Product.create(req.body);

    // Clear related caches
    await redisClient.del('products:*');

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { error } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.body.categoryId) {
      const category = await Category.findByPk(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    await product.update(req.body);

    // Clear caches
    await redisClient.del(`product:${req.params.id}`);
    await redisClient.del('products:*');

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({ isActive: false });

    // Clear caches
    await redisClient.del(`product:${req.params.id}`);
    await redisClient.del('products:*');

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Update product stock
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               operation:
 *                 type: string
 *                 enum: [add, subtract, set]
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */
router.put('/:id/stock', async (req, res, next) => {
  try {
    const { quantity, operation = 'set' } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newStock = product.stock;
    switch (operation) {
      case 'add':
        newStock += quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, newStock - quantity);
        break;
      case 'set':
        newStock = quantity;
        break;
      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }

    await product.update({ stock: newStock });

    // Clear caches
    await redisClient.del(`product:${req.params.id}`);
    await redisClient.del('products:*');

    res.json({
      message: 'Stock updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
