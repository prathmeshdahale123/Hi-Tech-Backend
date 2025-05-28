import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateAdmin } from '../middlewares/auth';

/**
 * Authentication routes
 */
const router = Router();

/**
 * @route   POST /api/auth/signin
 * @desc    Admin sign in
 * @access  Public
 */
router.post('/signin', AuthController.signIn);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current admin profile
 * @access  Private (Admin only)
 */
router.get('/profile', authenticateAdmin, AuthController.getProfile);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private (Admin only)
 */
router.get('/verify', authenticateAdmin, AuthController.verifyToken);

router.post('/logout', AuthController.logout)

export default router;
