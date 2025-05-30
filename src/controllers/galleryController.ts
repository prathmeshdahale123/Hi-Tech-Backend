import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import Gallery from '../models/gallery';
import { cloudinaryUtils } from '../utils/cloudinary';

// @desc    Upload a new image to the gallery
// @route   POST /api/gallery
// @access  Private/Admin
export const uploadImageToGallery = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const { title, description, category, date } = req.body;

  // Validate required fields
  if (!title || !category) {
    res.status(400);
    throw new Error('Title and category are required');
  }

  // Validate and parse date if provided
  let parsedDate = date ? new Date(date) : new Date();
  if (date && isNaN(parsedDate.getTime())) {
    res.status(400);
    throw new Error('Invalid date format');
  }

  const uploadResult = await cloudinaryUtils.upload(req.file.buffer, 'hitech-institute/gallery');

  const newImage = await Gallery.create({
    title,
    description,
    image: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      size: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
    },
    category,
    date: parsedDate,
    uploadedBy: (req as any).admin.adminId,
  });

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: newImage,
  });
});

// @desc    Get all images from the gallery
// @route   GET /api/gallery
// @access  Public (or adjust based on your needs)
export const getAllGalleryImages = asyncHandler(async (req: Request, res: Response) => {
  const images = await Gallery.find().sort({ date: -1 }); // Sort by custom date

  res.status(200).json({
    success: true,
    message: 'Gallery images fetched successfully',
    images,
  });
});

// @desc    Delete an image from the gallery
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
export const deleteGalleryImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await Gallery.findById(req.params.id);

  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  // Delete from Cloudinary
  const publicId = image.image?.publicId;

  if (typeof publicId === 'string') {
    await cloudinaryUtils.delete(publicId);
  }
  // Delete from DB
  await image.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
  });
});

// @desc    Update image details in the gallery
// @route   PUT /api/gallery/:id
// @access  Private/Admin
export const updateGalleryImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await Gallery.findById(req.params.id);

  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  const { title, description, category, date } = req.body;

  // Update fields if provided
  image.title = title || image.title;
  image.description = description || image.description;
  image.category = category || image.category;
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400);
      throw new Error('Invalid date format');
    }
    image.date = parsedDate;
  }

  const updatedImage = await image.save();

  res.status(200).json({
    success: true,
    message: 'Image updated successfully',
    data: updatedImage,
  });
});