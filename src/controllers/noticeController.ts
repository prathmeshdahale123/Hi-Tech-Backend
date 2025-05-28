import { Request, Response } from 'express';
import { Notice } from '../models/Notice';
import { validateNotice } from '../utils/validators';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import fs from 'fs';
import path from 'path';

/**
 * Notice management controller
 */
export class NoticeController {
  /**
   * Create a new notice
   * POST /api/notices
   */
  static async createNotice(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateNotice(req.body);
      if (error) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          await deleteFile(req.file.path);
        }
        
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const { title, description, date } = value;
      const adminId = (req as any).admin.adminId;

      // Prepare notice data
      const noticeData: any = {
        title,
        description,
        date: date ? new Date(date) : new Date(),
        createdBy: adminId,
        updatedBy: adminId
      };

      // Add file information if file was uploaded
      if (req.file) {
        noticeData.attachment = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimeType: req.file.mimetype
        };
      }

      // Create notice
      const notice = new Notice(noticeData);
      await notice.save();

      // Populate creator information
      await notice.populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        data: {
          notice
        }
      });

    } catch (error) {
      console.error('Create notice error:', error);
      
      // Clean up uploaded file if database operation fails
      if (req.file) {
        await deleteFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while creating notice'
      });
    }
  }

  /**
   * Get all notices
   * GET /api/notices
   */
  static async getAllNotices(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Get notices with pagination
      const notices = await Notice.find()
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Notice.countDocuments();

      res.status(200).json({
        success: true,
        message: 'Notices retrieved successfully',
        data: {
          notices,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get notices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching notices'
      });
    }
  }

  /**
   * Get a single notice by ID
   * GET /api/notices/:id
   */
  static async getNoticeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const notice = await Notice.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!notice) {
        res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notice retrieved successfully',
        data: {
          notice
        }
      });

    } catch (error) {
      console.error('Get notice by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching notice'
      });
    }
  }

  /**
   * Update a notice
   * PUT /api/notices/:id
   */
  static async updateNotice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = (req as any).admin.adminId;

      // Find existing notice
      const existingNotice = await Notice.findById(id);
      if (!existingNotice) {
        // Clean up uploaded file if notice doesn't exist
        if (req.file) {
          await deleteFile(req.file.path);
        }
        
        res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
        return;
      }

      // Validate request body
      const { error, value } = validateNotice(req.body);
      if (error) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          await deleteFile(req.file.path);
        }
        
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
        return;
      }

      const { title, description, date } = value;

      // Prepare update data
      const updateData: any = {
        title,
        description,
        date: date ? new Date(date) : existingNotice.date,
        updatedBy: adminId,
        updatedAt: new Date()
      };

      // Handle file replacement
      if (req.file) {
        // Delete old file if it exists
        if (existingNotice.attachment?.path) {
          await deleteFile(existingNotice.attachment.path);
        }

        // Add new file information
        updateData.attachment = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimeType: req.file.mimetype
        };
      }

      // Update notice
      const notice = await Notice.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email')
       .populate('updatedBy', 'name email');

      res.status(200).json({
        success: true,
        message: 'Notice updated successfully',
        data: {
          notice
        }
      });

    } catch (error) {
      console.error('Update notice error:', error);
      
      // Clean up uploaded file if database operation fails
      if (req.file) {
        await deleteFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating notice'
      });
    }
  }

  /**
   * Delete a notice
   * DELETE /api/notices/:id
   */
  static async deleteNotice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const notice = await Notice.findById(id);
      if (!notice) {
        res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
        return;
      }

      // Delete associated file if it exists
      if (notice.attachment?.path) {
        await deleteFile(notice.attachment.path);
      }

      // Delete notice from database
      await Notice.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Notice deleted successfully',
        data: {
          deletedNotice: {
            id: notice._id,
            title: notice.title
          }
        }
      });

    } catch (error) {
      console.error('Delete notice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting notice'
      });
    }
  }
}
