import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { config } from '../config/environment';

interface JwtPayload {
  adminId: string;
  email: string;
  role: string;
}

/**
 * Authentication middleware to protect routes
 */
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookies
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    // Check if admin still exists in database
    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Admin not found.'
      });
      return;
    }

    // Check if admin is active
    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Admin account is deactivated.'
      });
      return;
    }

    // Attach admin info to request object
    (req as any).admin = {
      adminId: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Token has expired.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const adminRole = (req as any).admin?.role;

      if (!adminRole || !allowedRoles.includes(adminRole)) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.'
      });
    }
  };
};
