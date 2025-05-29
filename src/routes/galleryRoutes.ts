import express from 'express';
import { uploadImageToGallery, getAllGalleryImages, deleteGalleryImage, updateGalleryImage } from '../controllers/galleryController'; // ✅ THIS LINE
import { authenticateAdmin } from '../middlewares/auth';
import { requiredCloudinaryUpload } from '../middlewares/cloudinaryUpload';

const router = express.Router();

router.post('/', authenticateAdmin, requiredCloudinaryUpload, uploadImageToGallery);
router.get('/', getAllGalleryImages);
router.delete('/:id', authenticateAdmin, deleteGalleryImage);
router.put('/:id', authenticateAdmin, updateGalleryImage);


export default router;
