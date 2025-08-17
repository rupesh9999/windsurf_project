import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Order, { OrderStatus, PaymentStatus } from '../models/Order';
import OrderItem from '../models/OrderItem';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import redis from '../config/redis';
import logger from '../utils/logger';
import axios from 'axios';
import config from '../config/config';

const router = Router();

// Validation rules
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items array is required and must not be empty'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('shippingAddress.firstName').notEmpty().withMessage('First name is required'),
  body('shippingAddress.lastName').notEmpty().withMessage('Last name is required'),
  body('shippingAddress.address').notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('billingAddress.firstName').notEmpty().withMessage('Billing first name is required'),
  body('billingAddress.lastName').notEmpty().withMessage('Billing last name is required'),
  body('billingAddress.address').notEmpty().withMessage('Billing address is required'),
  body('billingAddress.city').notEmpty().withMessage('Billing city is required'),
  body('billingAddress.state').notEmpty().withMessage('Billing state is required'),
  body('billingAddress.zipCode').notEmpty().withMessage('Billing ZIP code is required'),
  body('billingAddress.country').notEmpty().withMessage('Billing country is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
];

const updateOrderValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid order ID is required'),
  body('status').optional().isIn(Object.values(OrderStatus)).withMessage('Invalid order status'),
  body('paymentStatus').optional().isIn(Object.values(PaymentStatus)).withMessage('Invalid payment status'),
];

// Helper function to validate product and get details
const validateAndGetProductDetails = async (productId: number) => {
  try {
    const response = await axios.get(`${config.services.productService}/api/products/${productId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch product ${productId}:`, error);
    throw new Error(`Product ${productId} not found or unavailable`);
  }
};

// Helper function to check product stock
const checkProductStock = async (productId: number, quantity: number) => {
  try {
    const response = await axios.get(`${config.services.productService}/api/products/${productId}/stock`);
    const availableStock = response.data.stock;
    return availableStock >= quantity;
  } catch (error) {
    logger.error(`Failed to check stock for product ${productId}:`, error);
    return false;
  }
};

// Helper function to calculate tax
const calculateTax = (subtotal: number, taxRate: number = 0.08): number => {
  return Math.round(subtotal * taxRate * 100) / 100;
};

// Helper function to calculate shipping
const calculateShipping = (subtotal: number, items: any[]): number => {
  // Free shipping for orders over $100
  if (subtotal >= 100) return 0;
  
  // Base shipping rate
  const baseRate = 9.99;
  const perItemRate = 2.99;
  
  return baseRate + (items.length - 1) * perItemRate;
};

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - billingAddress
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, createOrderValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shippingAddress, billingAddress, paymentMethod, notes } = req.body;
    const userId = req.user!.userId;

    // Validate products and check stock
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await validateAndGetProductDetails(item.productId);
      const hasStock = await checkProductStock(item.productId, item.quantity);

      if (!hasStock) {
        return res.status(400).json({ 
          error: `Insufficient stock for product: ${product.name}` 
        });
      }

      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        productImage: product.images?.[0],
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      });
    }

    // Calculate amounts
    const taxAmount = calculateTax(subtotal);
    const shippingAmount = calculateShipping(subtotal, items);
    const discountAmount = 0; // TODO: Implement discount logic
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Create order
    const orderNumber = Order.generateOrderNumber();
    const order = await Order.create({
      userId,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount,
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
    });

    // Create order items
    const orderItems = await Promise.all(
      validatedItems.map(item => 
        OrderItem.create({
          orderId: order.id,
          ...item,
        })
      )
    );

    // Cache order for quick access
    await redis.setex(`order:${order.id}`, 3600, JSON.stringify({
      ...order.toJSON(),
      items: orderItems.map(item => item.toJSON()),
    }));

    // TODO: Send order confirmation email
    // TODO: Reserve inventory
    // TODO: Create payment intent

    logger.info(`Order created: ${orderNumber} for user ${userId}`);

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order.toJSON(),
        items: orderItems.map(item => item.toJSON()),
      },
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as OrderStatus;
    const userId = req.user!.userId;

    const offset = (page - 1) * limit;
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      orders: orders.map(order => order.toJSON()),
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user!.userId;

    // Try cache first
    const cached = await redis.get(`order:${orderId}`);
    if (cached) {
      const order = JSON.parse(cached);
      if (order.userId === userId || req.user!.role === 'admin') {
        return res.json({ order });
      }
    }

    const where: any = { id: orderId };
    if (req.user!.role !== 'admin') {
      where.userId = userId;
    }

    const order = await Order.findOne({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
      }],
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Cache the result
    await redis.setex(`order:${orderId}`, 3600, JSON.stringify(order.toJSON()));

    res.json({ order: order.toJSON() });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/:id', authenticateToken, updateOrderValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderId = parseInt(req.params.id);
    const { status, paymentStatus, notes } = req.body;
    const userId = req.user!.userId;

    const where: any = { id: orderId };
    if (req.user!.role !== 'admin') {
      where.userId = userId;
    }

    const order = await Order.findOne({ where });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update fields
    if (status) {
      if (status === OrderStatus.CANCELLED && !order.canBeCancelled()) {
        return res.status(400).json({ error: 'Order cannot be cancelled' });
      }
      order.status = status;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    // Clear cache
    await redis.del(`order:${orderId}`);

    logger.info(`Order ${order.orderNumber} updated by user ${userId}`);

    res.json({
      message: 'Order updated successfully',
      order: order.toJSON(),
    });
  } catch (error) {
    logger.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user!.userId;

    const where: any = { id: orderId };
    if (req.user!.role !== 'admin') {
      where.userId = userId;
    }

    const order = await Order.findOne({ where });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    await order.updateStatus(OrderStatus.CANCELLED);

    // Clear cache
    await redis.del(`order:${orderId}`);

    // TODO: Process refund if payment was made
    // TODO: Release reserved inventory
    // TODO: Send cancellation email

    logger.info(`Order ${order.orderNumber} cancelled by user ${userId}`);

    res.json({
      message: 'Order cancelled successfully',
      order: order.toJSON(),
    });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Admin routes
/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin/all', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as OrderStatus;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const offset = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      orders: orders.map(order => order.toJSON()),
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

export default router;
