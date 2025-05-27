import { Router } from 'express';
import { NoticeController } from '../controllers/noticeController';
import { authenticateAdmin } from '../middlewares/auth';
import { optionalFileUpload } from '../middlewares/fileUpload';

/**
 * Notice management routes
 */
const router = Router();

/**
 * @route   POST /api/notices
 * @desc    Create a new notice
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticateAdmin,
  optionalFileUpload,
  NoticeController.createNotice
);

/**
 * @route   GET /api/notices
 * @desc    Get all notices with pagination
 * @access  Public
 */
router.get('/', NoticeController.getAllNotices);

/**
 * @route   GET /api/notices/:id
 * @desc    Get a single notice by ID
 * @access  Public
 */
router.get('/:id', NoticeController.getNoticeById);

/**
 * @route   PUT /api/notices/:id
 * @desc    Update a notice
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticateAdmin,
  optionalFileUpload,
  NoticeController.updateNotice
);

/**
 * @route   DELETE /api/notices/:id
 * @desc    Delete a notice
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateAdmin, NoticeController.deleteNotice);

export default router;
