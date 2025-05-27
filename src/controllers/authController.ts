import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { config } from '../config/environment';
import { validateSignIn } from '../utils/validators';

/**
 * Admin authentication controller
 */
export class AuthController {
  /**
   * Admin sign in
   * POST /api/auth/signin
   */
  static async signIn(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateSignIn(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const { email, password } = value;

      // Find admin by email
      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Generate JWT token
      const payload = { 
        adminId: admin._id?.toString() || '',
        email: admin.email,
        role: admin.role
      };
      const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '24h' });

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin
          }
        }
      });

    } catch (error) {
      console.error('Sign in error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authentication'
      });
    }
  }

  /**
   * Get current admin profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).admin.adminId;
      
      const admin = await Admin.findById(adminId);
      if (!admin) {
        res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile'
      });
    }
  }

  /**
   * Verify token endpoint
   * GET /api/auth/verify
   */
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      // If we reach here, the auth middleware has already verified the token
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          admin: (req as any).admin
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token verification'
      });
    }
  }
}
