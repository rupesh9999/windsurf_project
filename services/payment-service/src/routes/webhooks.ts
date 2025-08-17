import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import Payment, { PaymentStatus } from '../models/Payment';
import config from '../config/config';
import logger from '../utils/logger';
import redis from '../config/redis';
import axios from 'axios';

const router = Router();
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

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
 * /api/webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  logger.info(`Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful payment intent
const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    const payment = await Payment.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (!payment) {
      logger.warn(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.SUCCEEDED;
    
    // Get charge details
    if (paymentIntent.charges.data[0]) {
      const charge = paymentIntent.charges.data[0];
      payment.stripeChargeId = charge.id;
      
      if (charge.payment_method_details?.card) {
        payment.paymentMethodDetails = {
          card: {
            brand: charge.payment_method_details.card.brand,
            last4: charge.payment_method_details.card.last4,
            expMonth: charge.payment_method_details.card.exp_month,
            expYear: charge.payment_method_details.card.exp_year,
          }
        };
      }
    }

    await payment.save();

    // Update order payment status
    await updateOrderPaymentStatus(payment.orderId, 'paid');

    // Clear cache
    await redis.del(`payment:${payment.id}`);

    logger.info(`Payment succeeded: ${payment.id} for order ${payment.orderId}`);
  } catch (error) {
    logger.error('Error handling payment intent succeeded:', error);
  }
};

// Handle failed payment intent
const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    const payment = await Payment.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (!payment) {
      logger.warn(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.FAILED;
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    await payment.save();

    // Update order payment status
    await updateOrderPaymentStatus(payment.orderId, 'failed');

    // Clear cache
    await redis.del(`payment:${payment.id}`);

    logger.info(`Payment failed: ${payment.id} for order ${payment.orderId}`);
  } catch (error) {
    logger.error('Error handling payment intent failed:', error);
  }
};

// Handle canceled payment intent
const handlePaymentIntentCanceled = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    const payment = await Payment.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (!payment) {
      logger.warn(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.CANCELLED;
    await payment.save();

    // Update order payment status
    await updateOrderPaymentStatus(payment.orderId, 'failed');

    // Clear cache
    await redis.del(`payment:${payment.id}`);

    logger.info(`Payment canceled: ${payment.id} for order ${payment.orderId}`);
  } catch (error) {
    logger.error('Error handling payment intent canceled:', error);
  }
};

// Handle charge dispute created
const handleChargeDisputeCreated = async (dispute: Stripe.Dispute) => {
  try {
    const payment = await Payment.findOne({
      where: { stripeChargeId: dispute.charge as string }
    });

    if (!payment) {
      logger.warn(`Payment not found for charge: ${dispute.charge}`);
      return;
    }

    // Log dispute for manual review
    logger.warn(`Dispute created for payment ${payment.id}:`, {
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      reason: dispute.reason,
      status: dispute.status,
    });

    // TODO: Implement dispute handling logic
    // - Send notification to admin
    // - Update order status
    // - Gather evidence for dispute response

  } catch (error) {
    logger.error('Error handling charge dispute created:', error);
  }
};

// Handle successful invoice payment (for subscriptions)
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  try {
    logger.info(`Invoice payment succeeded: ${invoice.id}`);
    
    // TODO: Implement subscription payment handling
    // - Update subscription status
    // - Send confirmation email
    // - Extend service period

  } catch (error) {
    logger.error('Error handling invoice payment succeeded:', error);
  }
};

// Handle failed invoice payment (for subscriptions)
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  try {
    logger.warn(`Invoice payment failed: ${invoice.id}`);
    
    // TODO: Implement failed subscription payment handling
    // - Send payment failure notification
    // - Retry payment logic
    // - Suspend service if necessary

  } catch (error) {
    logger.error('Error handling invoice payment failed:', error);
  }
};

// Handle subscription deletion
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  try {
    logger.info(`Subscription deleted: ${subscription.id}`);
    
    // TODO: Implement subscription cancellation handling
    // - Update user subscription status
    // - Send cancellation confirmation
    // - Schedule data retention/deletion

  } catch (error) {
    logger.error('Error handling subscription deleted:', error);
  }
};

export default router;
