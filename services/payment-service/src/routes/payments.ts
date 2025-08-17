import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Stripe from 'stripe';
import Payment, { PaymentStatus, PaymentMethod } from '../models/Payment';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import redis from '../config/redis';
import logger from '../utils/logger';
import config from '../config/config';
import axios from 'axios';

const router = Router();
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

// Validation rules
const createPaymentIntentValidation = [
  body('orderId').isInt({ min: 1 }).withMessage('Valid order ID is required'),
  body('amount').isFloat({ min: 0.5 }).withMessage('Amount must be at least $0.50'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).withMessage('Invalid currency'),
  body('paymentMethod').isIn(Object.values(PaymentMethod)).withMessage('Invalid payment method'),
];

const confirmPaymentValidation = [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('orderId').isInt({ min: 1 }).withMessage('Valid order ID is required'),
];

const refundValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid payment ID is required'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be positive'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
];

// Helper function to get order details
const getOrderDetails = async (orderId: number) => {
  try {
    const response = await axios.get(`${config.services.orderService}/api/orders/${orderId}`);
    return response.data.order;
  } catch (error) {
    logger.error(`Failed to fetch order ${orderId}:`, error);
    throw new Error(`Order ${orderId} not found`);
  }
};

// Helper function to update order payment status
const updateOrderPaymentStatus = async (orderId: number, paymentStatus: string) => {
  try {
    await axios.put(`${config.services.orderService}/api/orders/${orderId}`, {
      paymentStatus,
    });
  } catch (error) {
    logger.error(`Failed to update order ${orderId} payment status:`, error);
  }
};

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, bank_transfer, paypal, apple_pay, google_pay]
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/create-intent', authenticateToken, createPaymentIntentValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, amount, currency = 'USD', paymentMethod } = req.body;
    const userId = req.user!.userId;

    // Verify order exists and belongs to user
    const order = await getOrderDetails(orderId);
    if (order.userId !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this order' });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({
      where: { orderId, status: [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED] }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for this order' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: paymentMethod === PaymentMethod.CARD ? ['card'] : ['card'],
      metadata: {
        orderId: orderId.toString(),
        userId: userId.toString(),
      },
    });

    // Create payment record
    const payment = await Payment.create({
      orderId,
      userId,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency: currency.toUpperCase(),
      status: PaymentStatus.PENDING,
      paymentMethod,
      metadata: {
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    // Cache payment for quick access
    await redis.setex(`payment:${payment.id}`, 3600, JSON.stringify(payment.toJSON()));

    logger.info(`Payment intent created: ${paymentIntent.id} for order ${orderId}`);

    res.status(201).json({
      message: 'Payment intent created successfully',
      payment: {
        id: payment.id,
        clientSecret: paymentIntent.client_secret,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *               - orderId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *               orderId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/confirm', authenticateToken, confirmPaymentValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, orderId } = req.body;
    const userId = req.user!.userId;

    // Find payment record
    const payment = await Payment.findOne({
      where: { 
        stripePaymentIntentId: paymentIntentId,
        orderId,
        userId: req.user!.role === 'admin' ? undefined : userId,
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update payment based on Stripe status
    let newStatus: PaymentStatus;
    let paymentMethodDetails = {};

    switch (paymentIntent.status) {
      case 'succeeded':
        newStatus = PaymentStatus.SUCCEEDED;
        if (paymentIntent.charges.data[0]) {
          const charge = paymentIntent.charges.data[0];
          payment.stripeChargeId = charge.id;
          
          if (charge.payment_method_details?.card) {
            paymentMethodDetails = {
              card: {
                brand: charge.payment_method_details.card.brand,
                last4: charge.payment_method_details.card.last4,
                expMonth: charge.payment_method_details.card.exp_month,
                expYear: charge.payment_method_details.card.exp_year,
              }
            };
          }
        }
        break;
      case 'processing':
        newStatus = PaymentStatus.PROCESSING;
        break;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        newStatus = PaymentStatus.PENDING;
        break;
      case 'canceled':
        newStatus = PaymentStatus.CANCELLED;
        break;
      default:
        newStatus = PaymentStatus.FAILED;
        payment.failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    }

    // Update payment
    payment.status = newStatus;
    payment.paymentMethodDetails = paymentMethodDetails;
    await payment.save();

    // Update order payment status
    if (newStatus === PaymentStatus.SUCCEEDED) {
      await updateOrderPaymentStatus(orderId, 'paid');
    } else if (newStatus === PaymentStatus.FAILED || newStatus === PaymentStatus.CANCELLED) {
      await updateOrderPaymentStatus(orderId, 'failed');
    }

    // Clear cache
    await redis.del(`payment:${payment.id}`);

    logger.info(`Payment confirmed: ${paymentIntentId} with status ${newStatus}`);

    res.json({
      message: 'Payment status updated',
      payment: payment.toJSON(),
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get user's payments
 *     tags: [Payments]
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
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as PaymentStatus;
    const userId = req.user!.userId;

    const offset = (page - 1) * limit;
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      payments: payments.map(payment => payment.toJSON()),
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
    logger.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
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
 *         description: Payment retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    const userId = req.user!.userId;

    // Try cache first
    const cached = await redis.get(`payment:${paymentId}`);
    if (cached) {
      const payment = JSON.parse(cached);
      if (payment.userId === userId || req.user!.role === 'admin') {
        return res.json({ payment });
      }
    }

    const where: any = { id: paymentId };
    if (req.user!.role !== 'admin') {
      where.userId = userId;
    }

    const payment = await Payment.findOne({ where });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Cache the result
    await redis.setex(`payment:${paymentId}`, 3600, JSON.stringify(payment.toJSON()));

    res.json({ payment: payment.toJSON() });
  } catch (error) {
    logger.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment' });
  }
});

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Refund payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Cannot refund payment
 *       404:
 *         description: Payment not found
 */
router.post('/:id/refund', authenticateToken, refundValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const paymentId = parseInt(req.params.id);
    const { amount, reason = 'Customer request' } = req.body;
    const userId = req.user!.userId;

    const where: any = { id: paymentId };
    if (req.user!.role !== 'admin') {
      where.userId = userId;
    }

    const payment = await Payment.findOne({ where });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!payment.canBeRefunded()) {
      return res.status(400).json({ error: 'Payment cannot be refunded' });
    }

    const refundAmount = amount || payment.getRemainingRefundableAmount();

    if (refundAmount > payment.getRemainingRefundableAmount()) {
      return res.status(400).json({ error: 'Refund amount exceeds remaining refundable amount' });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      charge: payment.stripeChargeId!,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        paymentId: payment.id.toString(),
        orderId: payment.orderId.toString(),
        reason,
      },
    });

    // Update payment record
    await payment.addRefund(refundAmount);

    // Update order payment status
    if (payment.status === PaymentStatus.REFUNDED) {
      await updateOrderPaymentStatus(payment.orderId, 'refunded');
    }

    // Clear cache
    await redis.del(`payment:${paymentId}`);

    logger.info(`Refund processed: ${refund.id} for payment ${payment.id}, amount: $${refundAmount}`);

    res.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
        reason,
      },
      payment: payment.toJSON(),
    });
  } catch (error) {
    logger.error('Refund payment error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Admin routes
/**
 * @swagger
 * /api/payments/admin/all:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
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
 *         description: Payments retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin/all', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as PaymentStatus;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const offset = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      payments: payments.map(payment => payment.toJSON()),
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
    logger.error('Get all payments error:', error);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

export default router;
