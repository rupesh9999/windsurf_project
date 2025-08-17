import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { User } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get('/profile', authenticate, async (req: any, res, next) => {
  try {
    res.json(req.user.toJSON());
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticate, async (req: any, res, next) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { firstName, lastName, phone } = req.body;
    
    await req.user.update({
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
    });

    res.json({
      message: 'Profile updated successfully',
      user: req.user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.put('/change-password', authenticate, async (req: any, res, next) => {
  try {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await req.user.update({ password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      users: rows.map(user => user.toJSON()),
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Update user status (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 */
router.put('/:id/status', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive });

    res.json({
      message: 'User status updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
