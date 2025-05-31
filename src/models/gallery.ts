import mongoose, { Schema } from 'mongoose';

const gallerySchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    image: {
      url: { type: String, required: true },
      publicId: { type: String },
      format: { type: String },
      size: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    category: {
      type: String,
      required: true, // Ensure a category is always provided
      trim: true, // Remove extra whitespace
      enum: ['College Events', 'Workshops & Seminars', 'Campus Tour', 'Technical Competitions', 'Sports & Cultural'], // Optional: restrict to specific categories
    },
    date: {
    type: Date,
    required: [true, 'Notice date is required'],
    default: Date.now
  },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Gallery', gallerySchema);